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

/** Offline stand-in so the screens have something to render without a server. */
const MOCK_REQUESTS: EmergencyRequest[] = [
  {
    id: "req_mock_1",
    patientName: "R. M. Silva",
    bloodGroup: "O-",
    units: 3,
    hospital: "National Hospital of Sri Lanka",
    district: "Colombo",
    contactName: "Ravindu Silva",
    contactMobile: "0771234501",
    urgency: "critical",
    notes: "Road traffic accident. Theatre scheduled within the hour.",
    status: "pending",
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isAnonymous: true,
  },
  {
    id: "req_mock_2",
    patientName: "F. A. Rizwan",
    bloodGroup: "A+",
    units: 2,
    hospital: "Kandy Teaching Hospital",
    district: "Kandy",
    contactName: "Fathima Rizwan",
    contactMobile: "0775551234",
    urgency: "urgent",
    notes: "Post-operative transfusion.",
    status: "verified",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isAnonymous: false,
  },
];

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
    };

    MOCK_REQUESTS.unshift(created);

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
    return [...MOCK_REQUESTS];
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
    const found = MOCK_REQUESTS.find((item) => item.id === id);

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
