/**
 * Hospital-scoped operations: district stock, transmission candidates and the
 * per-case intake workflow (screening → extraction).
 *
 * Offline the inventory reads and writes the shared facility list, while the
 * intake endpoints simulate their stage rules locally so the verify-donor and
 * extraction flows stay demoable with no server.
 */

import type { BloodGroup } from "@/constants/blood-groups";
import { request } from "@/services/api/client";
import { ApiError } from "@/services/api/errors";
import { hasRemoteApi } from "@/services/config";
import {
  getBloodBank,
  listBloodBanks,
  updateOfflineInventory,
  type BloodComponent,
  type HospitalInventoryBank,
  type InventoryItem,
} from "@/services/blood-banks";
import type { DonationStage, EmergencyRequest } from "@/services/requests/emergency-requests";

export type RequestCandidates = {
  requestId: string;
  status: string;
  bloodGroup: BloodGroup;
  /** Available donors whose group can serve this request. */
  compatibleAvailable: number;
  accepted: number;
  enRoute: number;
};

export type ScreeningInput = {
  temperature?: string;
  bloodPressure?: string;
  pulse?: string;
  hemoglobin?: string;
  eligible: boolean;
  bedLabel?: string;
};

export type ScreeningRecord = ScreeningInput & { createdAt: string };

export type ExtractionRecord = {
  status: "in_progress" | "completed";
  volumeMl: number | null;
  phlebotomistName: string | null;
  startedAt: string;
  completedAt: string | null;
};

export type RequestWorkflow = {
  request: EmergencyRequest;
  response: { id: string; stage: DonationStage } | null;
  donor: { id: string; fullName: string; bloodGroup: BloodGroup | null; district: string | null } | null;
  screening: ScreeningRecord | null;
  extraction: ExtractionRecord | null;
};

export async function getHospitalInventory(): Promise<{ banks: HospitalInventoryBank[] }> {
  if (!hasRemoteApi) {
    const banks = await listBloodBanks();
    const detailed = await Promise.all(
      banks.map(async (bank) => (await getBloodBank(bank.id)).inventory),
    );

    return {
      banks: banks.map((bank, index) => ({
        id: bank.id,
        name: bank.name,
        district: bank.district,
        inventory: detailed[index],
      })),
    };
  }

  const body = await request<{ banks?: unknown }>("/hospital/inventory");
  const list = Array.isArray(body.banks) ? body.banks : [];

  return {
    banks: list.filter(
      (item): item is HospitalInventoryBank =>
        typeof item === "object" && item !== null && typeof (item as HospitalInventoryBank).id === "string",
    ),
  };
}

export async function updateInventoryItem(
  bankId: string,
  bloodGroup: BloodGroup,
  component: BloodComponent,
  units: number,
): Promise<InventoryItem> {
  if (!hasRemoteApi) {
    return updateOfflineInventory(bankId, bloodGroup, component, units);
  }

  const body = await request<{ inventory?: unknown }>(
    `/hospital/inventory/${encodeURIComponent(bankId)}/${encodeURIComponent(bloodGroup)}/${encodeURIComponent(component)}`,
    { method: "PUT", body: { units } },
  );

  const item = body.inventory as InventoryItem | undefined;

  if (item === undefined || typeof item.units !== "number") {
    throw new ApiError("unknown", "The server returned an unexpected response.");
  }

  return item;
}

export async function getRequestCandidates(requestId: string): Promise<RequestCandidates> {
  if (!hasRemoteApi) {
    return {
      requestId,
      status: "verified",
      bloodGroup: "A+",
      compatibleAvailable: 6,
      accepted: 0,
      enRoute: 0,
    };
  }

  const body = await request<Partial<RequestCandidates>>(
    `/hospital/requests/${encodeURIComponent(requestId)}/candidates`,
  );

  return {
    requestId,
    status: typeof body.status === "string" ? body.status : "pending",
    bloodGroup: (body.bloodGroup ?? "A+") as BloodGroup,
    compatibleAvailable: typeof body.compatibleAvailable === "number" ? body.compatibleAvailable : 0,
    accepted: typeof body.accepted === "number" ? body.accepted : 0,
    enRoute: typeof body.enRoute === "number" ? body.enRoute : 0,
  };
}

/**
 * Offline workflow state, keyed by request id: the donor's stage, their
 * screening and the running extraction session. Rules mirror the server so a
 * demo cannot skip check-in.
 */
type OfflineWorkflow = {
  stage: DonationStage;
  screening: ScreeningRecord | null;
  extraction: ExtractionRecord | null;
};

const OFFLINE_WORKFLOWS = new Map<string, OfflineWorkflow>();

function offlineWorkflow(requestId: string): OfflineWorkflow {
  let state = OFFLINE_WORKFLOWS.get(requestId);

  if (state === undefined) {
    // The offline demo starts every case at `arrived` — check-in itself needs
    // the server's signed QR ticket.
    state = { stage: "arrived", screening: null, extraction: null };
    OFFLINE_WORKFLOWS.set(requestId, state);
  }

  return state;
}

export async function getRequestWorkflow(requestId: string): Promise<RequestWorkflow> {
  if (!hasRemoteApi) {
    const state = offlineWorkflow(requestId);
    const found = await getOfflineRequest(requestId);

    if (found === undefined) {
      throw new ApiError("not_found", "That request could not be found.");
    }

    return {
      request: found,
      response: { id: `resp_off_${requestId}`, stage: state.stage },
      donor: { id: "usr_off_donor", fullName: "Demo Donor", bloodGroup: "O+", district: "Colombo" },
      screening: state.screening,
      extraction: state.extraction,
    };
  }

  const body = await request<{
    request?: EmergencyRequest;
    response?: { id: string; stage: DonationStage } | null;
    donor?: RequestWorkflow["donor"];
    screening?: ScreeningRecord | null;
    extraction?: ExtractionRecord | null;
  }>(`/hospital/requests/${encodeURIComponent(requestId)}/responses`);

  if (body.request === undefined) {
    throw new ApiError("not_found", "That request could not be found.");
  }

  return {
    request: body.request,
    response: body.response ?? null,
    donor: body.donor ?? null,
    screening: body.screening ?? null,
    extraction: body.extraction ?? null,
  };
}

/** Offline lookup of a mock request so the workflow has a patient to show. */
async function getOfflineRequest(requestId: string): Promise<EmergencyRequest | undefined> {
  const { listEmergencyRequests } = await import("@/services/requests/emergency-requests");
  const all = await listEmergencyRequests();
  return all.find((item) => item.id === requestId);
}

export async function submitScreening(requestId: string, input: ScreeningInput): Promise<ScreeningRecord> {
  if (!hasRemoteApi) {
    const state = offlineWorkflow(requestId);

    if (state.stage !== "arrived") {
      throw new ApiError("conflict", "Check the donor in before recording vitals.");
    }

    state.screening = { ...input, createdAt: new Date().toISOString() };
    return state.screening;
  }

  const body = await request<{ screening?: { createdAt?: string } }>(
    `/donors/requests/${encodeURIComponent(requestId)}/screening`,
    { method: "POST", body: input },
  );

  return {
    ...input,
    createdAt: body.screening?.createdAt ?? new Date().toISOString(),
  };
}

export async function startExtraction(requestId: string): Promise<ExtractionRecord> {
  if (!hasRemoteApi) {
    const state = offlineWorkflow(requestId);

    if (state.screening === null) {
      throw new ApiError("conflict", "Record the screening before starting collection.");
    }
    if (!state.screening.eligible) {
      throw new ApiError("conflict", "This donor was not cleared for collection.");
    }
    if (state.extraction?.status === "in_progress") {
      throw new ApiError("conflict", "A collection session is already running.");
    }

    const startedAt = new Date().toISOString();
    state.extraction = {
      status: "in_progress",
      volumeMl: null,
      phlebotomistName: null,
      startedAt,
      completedAt: null,
    };

    return state.extraction;
  }

  const body = await request<{ extraction?: { startedAt?: string } }>(
    `/donors/requests/${encodeURIComponent(requestId)}/extraction`,
    { method: "POST", body: {} },
  );

  return {
    status: "in_progress",
    volumeMl: null,
    phlebotomistName: null,
    startedAt: body.extraction?.startedAt ?? new Date().toISOString(),
    completedAt: null,
  };
}

export async function completeExtraction(
  requestId: string,
  input: { volumeMl: number; phlebotomistName?: string },
): Promise<ExtractionRecord> {
  if (!hasRemoteApi) {
    const state = offlineWorkflow(requestId);

    if (state.extraction?.status !== "in_progress") {
      throw new ApiError("conflict", "There is no collection session to complete.");
    }

    state.extraction = {
      ...state.extraction,
      status: "completed",
      volumeMl: input.volumeMl,
      phlebotomistName: input.phlebotomistName ?? null,
      completedAt: new Date().toISOString(),
    };

    return state.extraction;
  }

  const body = await request<{ extraction?: Record<string, unknown> }>(
    `/donors/requests/${encodeURIComponent(requestId)}/extraction`,
    { method: "PATCH", body: input },
  );

  const extraction = body.extraction as ExtractionRecord | undefined;

  if (extraction === undefined) {
    throw new ApiError("unknown", "The server returned an unexpected response.");
  }

  return extraction;
}
