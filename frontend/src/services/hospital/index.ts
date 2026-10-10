/**
 * Hospital-scoped operations: district stock, transmission candidates and the
 * per-case intake workflow (screening → extraction). The API gates every route
 * to verified staff.
 */

import { isBloodGroup, type BloodGroup } from "@/constants/blood-groups";
import { ApiError } from "@/services/api/errors";
import { apiRequest } from "@/services/api/client";
import { toApiError } from "@/services/api/to-api-error";
import {
  readInventoryItem,
  readInventoryMatrix,
  type BloodComponent,
  type HospitalInventoryBank,
  type InventoryItem,
} from "@/services/blood-banks";
import {
  isRequestStatus,
  readEmergencyRequest,
  type DonationStage,
  type EmergencyRequest,
  type RequestStatus,
} from "@/services/requests/emergency-requests";

export type RequestCandidates = {
  requestId: string;
  status: RequestStatus;
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

/** The flat row behind `RequestWorkflow`, as `GET /hospital/requests/:id/responses` returns it. */
type WorkflowRow = Record<string, unknown>;

const DONATION_STAGES: readonly DonationStage[] = ["accepted", "en_route", "arrived", "completed"];

function isDonationStage(value: unknown): value is DonationStage {
  return typeof value === "string" && (DONATION_STAGES as readonly string[]).includes(value);
}

/** Whether an extraction session is currently open. */
function isExtractionStatus(value: unknown): value is "in_progress" | "completed" {
  return value === "in_progress" || value === "completed";
}

export async function getHospitalInventory(): Promise<{ banks: HospitalInventoryBank[] }> {
  try {
    const { banks: rows } = await apiRequest<{ banks: unknown }>("/hospital/inventory");
    const list = Array.isArray(rows) ? rows : [];

    const banks: HospitalInventoryBank[] = [];

    for (const row of list) {
      const bank = (row as { bank?: unknown } | null | undefined)?.bank;

      if (typeof bank !== "object" || bank === null) {
        continue;
      }

      const candidate = bank as {
        id?: unknown;
        name?: unknown;
        district?: unknown;
        inventory?: unknown;
      };

      if (typeof candidate.id !== "string" || typeof candidate.name !== "string") {
        continue;
      }

      banks.push({
        id: candidate.id,
        name: candidate.name,
        district: typeof candidate.district === "string" ? candidate.district : "",
        inventory: readInventoryMatrix(candidate.inventory),
      });
    }

    return { banks };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateInventoryItem(
  bankId: string,
  bloodGroup: BloodGroup,
  component: BloodComponent,
  units: number,
): Promise<InventoryItem> {
  try {
    const { inventory } = await apiRequest<{ inventory: unknown }>(
      `/hospital/inventory/${bankId}/${bloodGroup}/${component}`,
      { method: "PUT", body: { units } },
    );

    const item = readInventoryItem(inventory);

    if (item === null) {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    return item;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getRequestCandidates(requestId: string): Promise<RequestCandidates> {
  try {
    const { candidates } = await apiRequest<{ candidates: unknown }>(
      `/hospital/requests/${requestId}/candidates`,
    );

    const row = candidates as
      | {
          status?: unknown;
          bloodGroup?: unknown;
          compatibleAvailable?: unknown;
          accepted?: unknown;
          enRoute?: unknown;
        }
      | null
      | undefined;

    if (row === null || row === undefined) {
      throw new ApiError("not_found", "That request could not be found.");
    }

    return {
      requestId,
      status: isRequestStatus(row.status) ? row.status : "pending",
      bloodGroup: isBloodGroup(row.bloodGroup) ? row.bloodGroup : "A+",
      compatibleAvailable: typeof row.compatibleAvailable === "number" ? row.compatibleAvailable : 0,
      accepted: typeof row.accepted === "number" ? row.accepted : 0,
      enRoute: typeof row.enRoute === "number" ? row.enRoute : 0,
    };
  } catch (error) {
    throw toApiError(error, "That request could not be found.");
  }
}

/** Assembles the accepted donor's full case file from the flat workflow row. */
export async function getRequestWorkflow(requestId: string): Promise<RequestWorkflow> {
  try {
    const { workflow } = await apiRequest<{ workflow: unknown }>(
      `/hospital/requests/${requestId}/responses`,
    );

    if (typeof workflow !== "object" || workflow === null) {
      throw new ApiError("not_found", "That request could not be found.");
    }

    const row = workflow as WorkflowRow;
    const request = readEmergencyRequest(row);

    if (request === null) {
      throw new ApiError("not_found", "That request could not be found.");
    }

    const response =
      typeof row.responseId === "string" && isDonationStage(row.stage)
        ? { id: row.responseId, stage: row.stage }
        : null;

    const donor =
      typeof row.donorId === "string"
        ? {
            id: row.donorId,
            fullName: typeof row.donorFullName === "string" ? row.donorFullName : "Verified Donor",
            bloodGroup: isBloodGroup(row.donorBloodGroup) ? row.donorBloodGroup : null,
            district: typeof row.donorDistrict === "string" ? row.donorDistrict : null,
          }
        : null;

    const screening =
      typeof row.screeningCreatedAt !== "string"
        ? null
        : {
            temperature: typeof row.temperature === "string" ? row.temperature : undefined,
            bloodPressure:
              typeof row.bloodPressure === "string" ? row.bloodPressure : undefined,
            pulse: typeof row.pulse === "string" ? row.pulse : undefined,
            hemoglobin: typeof row.hemoglobin === "string" ? row.hemoglobin : undefined,
            eligible: row.eligible === true,
            bedLabel: typeof row.bedLabel === "string" ? row.bedLabel : undefined,
            createdAt: row.screeningCreatedAt,
          };

    const extraction = isExtractionStatus(row.extractionStatus)
      ? {
          status: row.extractionStatus,
          volumeMl: typeof row.volumeMl === "number" ? row.volumeMl : null,
          phlebotomistName:
            typeof row.phlebotomistName === "string" ? row.phlebotomistName : null,
          startedAt: typeof row.startedAt === "string" ? row.startedAt : new Date().toISOString(),
          completedAt: typeof row.completedAt === "string" ? row.completedAt : null,
        }
      : null;

    return { request, response, donor, screening, extraction };
  } catch (error) {
    throw toApiError(error, "That request could not be found.");
  }
}

export async function submitScreening(requestId: string, input: ScreeningInput): Promise<ScreeningRecord> {
  try {
    const { screening } = await apiRequest<{ screening: { createdAt?: unknown } | null }>(
      `/donors/requests/${requestId}/screening`,
      {
        method: "POST",
        body: {
          temperature: input.temperature ?? null,
          bloodPressure: input.bloodPressure ?? null,
          pulse: input.pulse ?? null,
          hemoglobin: input.hemoglobin ?? null,
          eligible: input.eligible,
          bedLabel: input.bedLabel ?? null,
        },
      },
    );

    return {
      ...input,
      createdAt:
        typeof screening?.createdAt === "string" ? screening.createdAt : new Date().toISOString(),
    };
  } catch (error) {
    throw toApiError(error, "Check the donor in before recording vitals.");
  }
}

export async function startExtraction(requestId: string): Promise<ExtractionRecord> {
  try {
    const { extraction } = await apiRequest<{ extraction: { startedAt?: unknown } | null }>(
      `/donors/requests/${requestId}/extraction`,
      { method: "POST" },
    );

    return {
      status: "in_progress",
      volumeMl: null,
      phlebotomistName: null,
      startedAt:
        typeof extraction?.startedAt === "string" ? extraction.startedAt : new Date().toISOString(),
      completedAt: null,
    };
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Closes the case: the donation completes and the requisition is fulfilled.
 *
 * Re-exported from `@/services/donors/donor-workflow`, which owns the intake
 * endpoints — the transit ping, the arrival scan and this final close all sit on
 * the same `/donors/requests/:id` route group, because they are all steps of one
 * donation. The extraction screen drives that whole workflow from this module,
 * so the close is surfaced here rather than making a single screen reach across
 * into another service folder mid-flow.
 */
export { completeDonationCase } from "@/services/donors/donor-workflow";

export async function completeExtraction(
  requestId: string,
  input: { volumeMl: number; phlebotomistName?: string },
): Promise<ExtractionRecord> {
  try {
    const { extraction } = await apiRequest<{ extraction: Record<string, unknown> | null }>(
      `/donors/requests/${requestId}/extraction`,
      {
        method: "PATCH",
        body: { volumeMl: input.volumeMl, phlebotomistName: input.phlebotomistName ?? null },
      },
    );

    if (extraction === null || extraction === undefined) {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    return {
      status: isExtractionStatus(extraction.status) ? extraction.status : "completed",
      volumeMl: typeof extraction.volumeMl === "number" ? extraction.volumeMl : null,
      phlebotomistName:
        typeof extraction.phlebotomistName === "string" ? extraction.phlebotomistName : null,
      startedAt:
        typeof extraction.startedAt === "string" ? extraction.startedAt : new Date().toISOString(),
      completedAt: typeof extraction.completedAt === "string" ? extraction.completedAt : null,
    };
  } catch (error) {
    throw toApiError(error);
  }
}
