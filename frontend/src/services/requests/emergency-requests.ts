/**
 * Emergency blood requests.
 *
 * `createEmergencyRequest` is intentionally usable while signed out — that is
 * the "Zero Login" urgent path. The server decides who the caller is from the
 * token it is (not) given, so this module no longer has to choose between two
 * endpoints: it posts to one and the API attributes the request, or leaves it
 * anonymous, on its own.
 *
 * Listing dispatches by the caller's role server-side — donors see the
 * compatible open feed, hospital staff see their district's triage queue, and
 * admins see the whole country. A recipient's own requests are asked for
 * explicitly, with `listEmergencyRequests({ mine: true })`, because a recipient
 * who sets a blood group is also donor-eligible and would otherwise be answered
 * by the donor feed.
 */

import { isBloodGroup, type BloodGroup } from "@/constants/blood-groups";
import { isUrgencyLevel, type RequestStatus, type UrgencyLevel } from "@/constants/emergency";
import { ApiError } from "@/services/api/errors";
import { apiRequest } from "@/services/api/client";
import { toApiError } from "@/services/api/to-api-error";
import { loadSession } from "@/services/auth/session";

/** The app's string unions, re-exported for consumers of this module. */
export type { RequestStatus, UrgencyLevel } from "@/constants/emergency";

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
  /** When the status last changed (equals `createdAt` until it does). */
  updatedAt: string;
  /** True when it came through the account-free urgent path. */
  isAnonymous: boolean;
  /** Who raised it, when known — drives owner-only affordances like editing. */
  requesterId: string | null;
  /** This donor's persisted decision, null until they respond. */
  donorResponse: DonorResponse | null;
  /** Progress from acceptance through hospital intake. */
  donorStage: DonationStage | null;
  /** True when another donor has already accepted this request. */
  acceptedByOtherDonor?: boolean;
  /**
   * True when hospital staff accepted a donor for this request from a scanned
   * pass. Only ever set on a requester's own list, and only tells them a donor
   * was matched — the donor's name reaches them through the acceptance alert.
   */
  donorMatchedOnBehalf?: boolean;
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

const REQUEST_STATUSES: readonly RequestStatus[] = ["pending", "verified", "fulfilled", "cancelled"];
const DONOR_RESPONSES: readonly DonorResponse[] = ["accepted", "declined"];
const DONATION_STAGES: readonly DonationStage[] = ["accepted", "en_route", "arrived", "completed"];

export function isRequestStatus(value: unknown): value is RequestStatus {
  return typeof value === "string" && (REQUEST_STATUSES as readonly string[]).includes(value);
}

function isDonorResponse(value: unknown): value is DonorResponse {
  return typeof value === "string" && (DONOR_RESPONSES as readonly string[]).includes(value);
}

function isDonorResponseValue(value: unknown): value is DonorResponse | null {
  return value === null || isDonorResponse(value);
}

function isDonationStage(value: unknown): value is DonationStage {
  return typeof value === "string" && (DONATION_STAGES as readonly string[]).includes(value);
}

function isDonationStageValue(value: unknown): value is DonationStage | null {
  return value === null || isDonationStage(value);
}

/** Narrows one request row returned by the API. */
export function readEmergencyRequest(row: unknown): EmergencyRequest | null {
  if (typeof row !== "object" || row === null) {
    return null;
  }

  const candidate = row as Partial<EmergencyRequest>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.patientName !== "string" ||
    typeof candidate.bloodGroup !== "string" ||
    !isBloodGroup(candidate.bloodGroup) ||
    typeof candidate.units !== "number" ||
    typeof candidate.hospital !== "string" ||
    typeof candidate.contactName !== "string" ||
    typeof candidate.contactMobile !== "string" ||
    typeof candidate.urgency !== "string" ||
    !isUrgencyLevel(candidate.urgency) ||
    typeof candidate.status !== "string" ||
    !isRequestStatus(candidate.status) ||
    typeof candidate.createdAt !== "string" ||
    typeof candidate.updatedAt !== "string" ||
    typeof candidate.isAnonymous !== "boolean" ||
    !isDonorResponseValue(candidate.donorResponse) ||
    !isDonationStageValue(candidate.donorStage)
  ) {
    return null;
  }

  return {
    id: candidate.id,
    patientName: candidate.patientName,
    bloodGroup: candidate.bloodGroup,
    units: candidate.units,
    hospital: candidate.hospital,
    district: typeof candidate.district === "string" ? candidate.district : null,
    contactName: candidate.contactName,
    contactMobile: candidate.contactMobile,
    urgency: candidate.urgency,
    notes: typeof candidate.notes === "string" ? candidate.notes : null,
    status: candidate.status,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    isAnonymous: candidate.isAnonymous,
    requesterId: typeof candidate.requesterId === "string" ? candidate.requesterId : null,
    donorResponse: candidate.donorResponse,
    donorStage: candidate.donorStage,
    acceptedByOtherDonor:
      typeof candidate.acceptedByOtherDonor === "boolean" ? candidate.acceptedByOtherDonor : false,
    donorMatchedOnBehalf:
      typeof candidate.donorMatchedOnBehalf === "boolean" ? candidate.donorMatchedOnBehalf : false,
  };
}

function readRequestList(value: unknown): EmergencyRequest[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const requests: EmergencyRequest[] = [];

  for (const row of value) {
    const request = readEmergencyRequest(row);

    if (request !== null) {
      requests.push(request);
    }
  }

  return requests;
}

export async function createEmergencyRequest(input: EmergencyRequestInput): Promise<EmergencyRequest> {
  try {
    const { request } = await apiRequest<{ request: unknown }>("/emergency", {
      method: "POST",
      body: {
        patientName: input.patientName.trim(),
        bloodGroup: input.bloodGroup,
        units: input.units,
        hospital: input.hospital.trim(),
        district: input.district ?? null,
        contactName: input.contactName.trim(),
        contactMobile: input.contactMobile.trim(),
        urgency: input.urgency,
        notes: input.notes?.trim() || null,
      },
    });

    const created = readEmergencyRequest(request);

    if (created === null) {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    // Compatible donors are alerted by the server as part of the same write, so
    // there is nothing left for the client to fan out here.
    return created;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * The signed-in user's list, by role — never the raw table.
 *
 * Pass `{ mine: true }` when the screen means "requests I raised" rather than
 * "the feed for my role". A recipient who has set a blood group is also
 * donor-eligible, so without it the server would answer with the compatible open
 * feed and the screen would present strangers' requests as the user's own.
 */
export async function listEmergencyRequests(
  options: { mine?: boolean } = {},
): Promise<EmergencyRequest[]> {
  try {
    const session = await loadSession();

    if (session === null) {
      return [];
    }

    const { requests } = await apiRequest<{ requests: unknown }>("/emergency", {
      query: options.mine === true ? { mine: true } : undefined,
    });

    return readRequestList(requests);
  } catch (error) {
    throw toApiError(error);
  }
}

export type EmergencyRequestDetail = {
  request: EmergencyRequest;
  /** Donor groups whose blood the patient can receive. */
  compatibleDonorGroups: BloodGroup[];
};

export async function getEmergencyRequest(id: string): Promise<EmergencyRequestDetail> {
  try {
    // Sends an available session token so the API can return recipient-only
    // tracking details; the same endpoint remains readable without a session.
    const { request } = await apiRequest<{ request: unknown }>(`/emergency/${id}`);
    const row = request;

    if (typeof row !== "object" || row === null) {
      throw new ApiError("not_found", "That request could not be found.");
    }

    const parsed = readEmergencyRequest(row);

    if (parsed === null) {
      throw new ApiError("not_found", "That request could not be found.");
    }

    const compatible = (row as { compatibleDonorGroups?: unknown }).compatibleDonorGroups;
    const compatibleDonorGroups: BloodGroup[] = Array.isArray(compatible)
      ? compatible.filter(isBloodGroup)
      : [];

    return { request: parsed, compatibleDonorGroups };
  } catch (error) {
    throw toApiError(error, "That request could not be found.");
  }
}

/** Moves a request to a new status; the server enforces who may do what. */
export async function updateEmergencyRequestStatus(
  id: string,
  status: RequestStatus,
): Promise<EmergencyRequest> {
  try {
    const { request } = await apiRequest<{ request: unknown }>(`/emergency/${id}`, {
      method: "PATCH",
      body: { status },
    });

    const updated = readEmergencyRequest(request);

    if (updated === null) {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    return updated;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Updates clinical fields on a pending request owned by the current user. */
export async function updateEmergencyRequest(
  id: string,
  input: Partial<EmergencyRequestInput>,
): Promise<EmergencyRequest> {
  try {
    const body: Record<string, unknown> = {};
    if (input.patientName !== undefined) body.patientName = input.patientName.trim();
    if (input.bloodGroup !== undefined) body.bloodGroup = input.bloodGroup;
    if (input.units !== undefined) body.units = input.units;
    if (input.hospital !== undefined) body.hospital = input.hospital.trim();
    if (input.contactName !== undefined) body.contactName = input.contactName.trim();
    if (input.contactMobile !== undefined) body.contactMobile = input.contactMobile.trim();
    if (input.urgency !== undefined) body.urgency = input.urgency;
    if (input.notes !== undefined) body.notes = input.notes?.trim() || null;

    const { request } = await apiRequest<{ request: unknown }>(`/emergency/${id}`, {
      method: "PATCH",
      body,
    });

    const updated = readEmergencyRequest(request);

    if (updated === null) {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    return updated;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function respondToEmergencyRequest(
  id: string,
  response: DonorResponse,
): Promise<DonorResponse> {
  try {
    const { created } = await apiRequest<{ created: { response?: unknown } | null }>(
      `/emergency/${id}/response`,
      { method: "POST", body: { response } },
    );

    const recorded = created?.response;

    if (!isDonorResponse(recorded)) {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    return recorded;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function updateEmergencyResponse(
  id: string,
  response: DonorResponse,
): Promise<DonorResponse> {
  try {
    const { updated } = await apiRequest<{ updated: { response?: unknown } | null }>(
      `/emergency/${id}/response`,
      { method: "PUT", body: { response } },
    );

    return isDonorResponse(updated?.response) ? updated.response : response;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteEmergencyResponse(id: string): Promise<void> {
  try {
    await apiRequest<void>(`/emergency/${id}/response`, { method: "DELETE" });
  } catch (error) {
    throw toApiError(error);
  }
}
