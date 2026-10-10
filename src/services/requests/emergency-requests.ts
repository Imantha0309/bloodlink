/**
 * Emergency blood requests.
 *
 * `createEmergencyRequest` is intentionally usable while signed out — that is
 * the "Zero Login" urgent path. Signed-in callers are attributed to their
 * account. Listing dispatches by the caller's role, mirroring the server's
 * `GET /emergency` behaviour: recipients see their own requests, donors see the
 * compatible open feed, hospital staff and admins see the triage queue.
 */

import { isBloodGroup, type BloodGroup } from "@/constants/blood-groups";
import { isUrgencyLevel, type RequestStatus, type UrgencyLevel } from "@/constants/emergency";
import { ApiError } from "@/services/api/errors";
import { loadSession } from "@/services/auth/session";
import type { UserRole } from "@/services/auth/types";
import { toApiError } from "@/services/dataconnect/errors";
import { app } from "@/services/firebase";
import {
  createEmergencyRequestAsUser,
  createEmergencyRequest as createRequestPublic,
  deleteDonorResponse,
  getEmergencyRequest as fetchEmergencyRequest,
  DonorResponse as GeneratedDonorResponse,
  RequestStatus as GeneratedRequestStatus,
  UrgencyLevel as GeneratedUrgencyLevel,
  listDonorFeed,
  listMyRequests,
  listTriageQueue,
  respondToRequest,
  updateDonorResponse,
  updateRequestStatus,
} from "@dataconnect/generated";
import { getFunctions, httpsCallable } from "firebase/functions";

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

const REQUEST_STATUSES: readonly RequestStatus[] = ["pending", "verified", "fulfilled", "cancelled"];
const DONOR_RESPONSES: readonly DonorResponse[] = ["accepted", "declined"];
const DONATION_STAGES: readonly DonationStage[] = ["accepted", "en_route", "arrived", "completed"];

function isRequestStatus(value: unknown): value is RequestStatus {
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

/** Narrows one request row returned by the raw-SQL list queries. */
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
    donorResponse: candidate.donorResponse,
    donorStage: candidate.donorStage,
    acceptedByOtherDonor:
      typeof candidate.acceptedByOtherDonor === "boolean" ? candidate.acceptedByOtherDonor : false,
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
  const vars = {
    patientName: input.patientName.trim(),
    bloodGroup: input.bloodGroup,
    units: input.units,
    hospital: input.hospital.trim(),
    district: input.district ?? null,
    contactName: input.contactName.trim(),
    contactMobile: input.contactMobile.trim(),
    urgency: GeneratedUrgencyLevel[input.urgency],
    notes: input.notes?.trim() || null,
  };

  try {
    const session = await loadSession();
    const row = session
      ? (await createEmergencyRequestAsUser(vars)).data.request
      : (await createRequestPublic(vars)).data.request;

    const request = readEmergencyRequest({
      ...(typeof row === "object" && row !== null ? row : {}),
      isAnonymous: session === null,
      donorResponse: null,
      donorStage: null,
    });

    if (request === null) {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    // Fan-out push notifications to compatible available donors — non-blocking.
    // This is best-effort: the request was already created; a push failure
    // must not roll it back.
    void notifyDonorsViaPush(request).catch(() => {
      // Intentionally swallowed
    });

    return request;
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * Calls the `notifyDonors` Cloud Function to fan-out FCM push notifications
 * to all compatible available donors. Non-blocking fire-and-forget.
 */
async function notifyDonorsViaPush(request: EmergencyRequest): Promise<void> {
  try {
    const fns = getFunctions(app);
    const notify = httpsCallable(fns, "notifyDonors");
    await notify({
      bloodGroup: request.bloodGroup,
      urgency: request.urgency,
      requestId: request.id,
      patientName: request.patientName,
      district: request.district,
    });
  } catch {
    // Non-blocking — push failure must not surface to the user
  }
}

/** The signed-in user's list, by role — never the raw table. */
export async function listEmergencyRequests(): Promise<EmergencyRequest[]> {
  try {
    const session = await loadSession();

    if (session === null) {
      return [];
    }

    const { data } = await listByRole(session.user.role);

    return readRequestList(data.requests);
  } catch (error) {
    throw toApiError(error);
  }
}

function listByRole(role: UserRole) {
  switch (role) {
    case "donor":
      return listDonorFeed();
    case "hospital":
    case "admin":
      return listTriageQueue();
    case "recipient":
    default:
      return listMyRequests();
  }
}

export type EmergencyRequestDetail = {
  request: EmergencyRequest;
  /** Donor groups whose blood the patient can receive. */
  compatibleDonorGroups: BloodGroup[];
};

export async function getEmergencyRequest(id: string): Promise<EmergencyRequestDetail> {
  try {
    const { data } = await fetchEmergencyRequest({ id });
    const row = data.request;

    if (typeof row !== "object" || row === null) {
      throw new ApiError("not_found", "That request could not be found.");
    }

    const request = readEmergencyRequest(row);

    if (request === null) {
      throw new ApiError("not_found", "That request could not be found.");
    }

    const compatible = (row as { compatibleDonorGroups?: unknown }).compatibleDonorGroups;
    const compatibleDonorGroups: BloodGroup[] = Array.isArray(compatible)
      ? compatible.filter(isBloodGroup)
      : [];

    return { request, compatibleDonorGroups };
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
    await updateRequestStatus({ requestId: id, status: GeneratedRequestStatus[status] });
    const { request } = await getEmergencyRequest(id);
    return request;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function respondToEmergencyRequest(
  id: string,
  response: DonorResponse,
): Promise<DonorResponse> {
  try {
    const { data } = await respondToRequest({ requestId: id, response: GeneratedDonorResponse[response] });
    const recorded = (data.created as { response?: unknown } | null | undefined)?.response;

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
    await updateDonorResponse({ requestId: id, response: GeneratedDonorResponse[response] });
    return response;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteEmergencyResponse(id: string): Promise<void> {
  try {
    await deleteDonorResponse({ requestId: id });
  } catch (error) {
    throw toApiError(error);
  }
}