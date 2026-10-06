/**
 * Emergency blood requests.
 *
 * `createEmergencyRequest` is intentionally usable while signed out — that is
 * the "Zero Login" urgent path. In mock mode the requests live in a module-level
 * array so the whole flow is still demoable with no server running.
 */

import { request } from "@/services/api/client";
import { ApiError } from "@/services/api/errors";
import type { BloodGroup } from "@/constants/blood-groups";
import type { UrgencyLevel } from "@/constants/emergency";
import { hasRemoteApi } from "@/services/config";

export type RequestStatus = "pending" | "verified" | "fulfilled" | "cancelled";
export type DonorResponse = "accepted" | "declined";
export type DonationStage = "accepted" | "en_route" | "arrived" | "completed";

export type EmergencyRequest = {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  units: number;
  hospital: string;
  district: string | null;
  contactName: string;
  contactMobile: string;
  urgency: UrgencyLevel;
  notes: string | null;
  status: RequestStatus;
  createdAt: string;
  /** True when it came through the account-free urgent path. */
  isAnonymous: boolean;
  /** This donor's persisted decision, null until they respond. */
  donorResponse: DonorResponse | null;
  /** Progress from acceptance through hospital intake. */
  donorStage: DonationStage | null;
  /** True when another donor has already accepted this request. */
  acceptedByOtherDonor?: boolean;
};

export type EmergencyRequestInput = {
  patientName: string;
  bloodGroup: BloodGroup;
  units: number;
  hospital: string;
  district?: string | null;
  contactName: string;
  contactMobile: string;
  urgency: UrgencyLevel;
  notes?: string | null;
};

/** Offline mode starts with no fabricated requests; user-created requests stay in memory. */
const OFFLINE_REQUESTS: EmergencyRequest[] = [];

function readRequestBody(body: unknown): EmergencyRequest | null {
  const candidate = (body as { request?: unknown } | null)?.request;

  if (typeof candidate !== "object" || candidate === null) {
    return null;
  }

  const record = candidate as Partial<EmergencyRequest>;

  return typeof record.id === "string" && typeof record.patientName === "string"
    ? (record as EmergencyRequest)
    : null;
}

export async function createEmergencyRequest(
  input: EmergencyRequestInput,
): Promise<EmergencyRequest> {
  if (!hasRemoteApi) {
    // No backend to validate against, so the mock keeps the contract the server
    // would enforce rather than accepting anything.
    if (input.units < 1 || input.units > 20) {
      throw new ApiError("validation", "Units must be between 1 and 20.", {
        units: "Units must be between 1 and 20.",
      });
    }

    const created: EmergencyRequest = {
      id: `req_mock_${Date.now().toString(36)}`,
      patientName: input.patientName,
      bloodGroup: input.bloodGroup,
      units: input.units,
      hospital: input.hospital,
      district: input.district ?? null,
      contactName: input.contactName,
      contactMobile: input.contactMobile,
      urgency: input.urgency,
      notes: input.notes ?? null,
      status: "pending",
      createdAt: new Date().toISOString(),
      isAnonymous: true,
      donorResponse: null,
      donorStage: null,
    };

    OFFLINE_REQUESTS.unshift(created);

    return created;
  }

  const body = await request<unknown>("/emergency-requests", {
    method: "POST",
    body: {
      patientName: input.patientName.trim(),
      bloodGroup: input.bloodGroup,
      units: input.units,
      hospital: input.hospital.trim(),
      district: input.district ?? undefined,
      contactName: input.contactName.trim(),
      contactMobile: input.contactMobile.trim(),
      urgency: input.urgency,
      notes: input.notes?.trim() || undefined,
    },
  });

  const created = readRequestBody(body);

  if (created === null) {
    throw new ApiError("unknown", "The server returned an unexpected response.");
  }

  return created;
}

export async function listEmergencyRequests(): Promise<EmergencyRequest[]> {
  if (!hasRemoteApi) {
    return [...OFFLINE_REQUESTS];
  }

  const body = await request<{ requests?: unknown }>("/emergency-requests");
  const list = Array.isArray(body.requests) ? body.requests : [];

  return list.filter(
    (item): item is EmergencyRequest =>
      typeof item === "object" && item !== null && typeof (item as EmergencyRequest).id === "string",
  );
}

export type EmergencyRequestDetail = {
  request: EmergencyRequest;
  /** Donor groups whose blood the patient can receive. */
  compatibleDonorGroups: BloodGroup[];
};

export async function getEmergencyRequest(id: string): Promise<EmergencyRequestDetail> {
  if (!hasRemoteApi) {
    const found = OFFLINE_REQUESTS.find((item) => item.id === id);

    if (found === undefined) {
      throw new ApiError("not_found", "That request could not be found.");
    }

    return { request: found, compatibleDonorGroups: [] };
  }

  const body = await request<{ request?: unknown; compatibleDonorGroups?: unknown }>(
    `/emergency-requests/${encodeURIComponent(id)}`,
  );

  const found = readRequestBody(body);

  if (found === null) {
    throw new ApiError("not_found", "That request could not be found.");
  }

  return {
    request: found,
    compatibleDonorGroups: Array.isArray(body.compatibleDonorGroups)
      ? (body.compatibleDonorGroups as BloodGroup[])
      : [],
  };
}

export async function respondToEmergencyRequest(
  id: string,
  response: DonorResponse,
): Promise<DonorResponse> {
  if (!hasRemoteApi) {
    const found = OFFLINE_REQUESTS.find((item) => item.id === id);

    if (!found) {
      throw new ApiError("not_found", "That request could not be found.");
    }

    if (found.status !== "pending" && found.status !== "verified") {
      throw new ApiError("conflict", "This request is no longer accepting responses.");
    }

    found.donorResponse = response;
    found.donorStage = response === "accepted" ? "accepted" : null;
    return response;
  }

  const body = await request<{ response?: unknown }>(
    `/emergency-requests/${encodeURIComponent(id)}/response`,
    { method: "POST", body: { response } },
  );

  if (body.response !== "accepted" && body.response !== "declined") {
    throw new ApiError("unknown", "The server returned an unexpected response.");
  }

  return body.response;
}

export async function updateEmergencyResponse(
  id: string,
  response: DonorResponse,
): Promise<DonorResponse> {
  if (!hasRemoteApi) {
    return respondToEmergencyRequest(id, response);
  }

  const body = await request<{ response?: unknown }>(
    `/emergency-requests/${encodeURIComponent(id)}/response`,
    { method: "PUT", body: { response } },
  );
  if (body.response !== "accepted" && body.response !== "declined") {
    throw new ApiError("unknown", "The server returned an unexpected response.");
  }
  return body.response;
}

export async function deleteEmergencyResponse(id: string): Promise<void> {
  if (!hasRemoteApi) {
    const found = OFFLINE_REQUESTS.find((item) => item.id === id);
    if (!found) throw new ApiError("not_found", "That request could not be found.");
    found.donorResponse = null;
    found.donorStage = null;
    return;
  }

  await request<{ deleted?: boolean }>(`/emergency-requests/${encodeURIComponent(id)}/response`, {
    method: "DELETE",
  });
}
