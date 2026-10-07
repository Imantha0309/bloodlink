import { ApiError } from "@/services/api/errors";
import { request } from "@/services/api/client";
import { hasRemoteApi } from "@/services/config";
import {
  listEmergencyRequests,
  type DonorResponse,
  type DonationStage,
  type EmergencyRequest,
} from "@/services/requests/emergency-requests";

export type DonorCommitment = EmergencyRequest & { donorStage: DonationStage };
export type DonorResponseRecord = {
  request: EmergencyRequest;
  response: DonorResponse;
  stage: DonationStage;
  createdAt: string;
  updatedAt: string;
};
export type DonorCheckInTicket = { ticket: string; expiresAt: string };

const mockStages = new Map<string, DonationStage>();

export async function listDonorCommitments(): Promise<DonorCommitment[]> {
  if (!hasRemoteApi) {
    return (await listEmergencyRequests())
      .filter((item) => item.donorResponse === "accepted")
      .map((item) => ({ ...item, donorStage: mockStages.get(item.id) ?? item.donorStage ?? "accepted" }));
  }

  const body = await request<{ commitments?: unknown }>("/donors/me/commitments");
  if (!Array.isArray(body.commitments)) return [];

  return body.commitments.filter(
    (item): item is DonorCommitment =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as DonorCommitment).id === "string" &&
      (item as DonorCommitment).donorResponse === "accepted" &&
      typeof (item as DonorCommitment).donorStage === "string",
  );
}

export async function listDonorResponses(): Promise<DonorResponseRecord[]> {
  if (!hasRemoteApi) {
    const requests = await listEmergencyRequests();
    return requests.flatMap((request) =>
      request.donorResponse === null
        ? []
        : [{
            request,
            response: request.donorResponse,
            stage: request.donorStage ?? "accepted",
            createdAt: request.createdAt,
            updatedAt: request.createdAt,
          }],
    );
  }

  const body = await request<{ responses?: unknown }>("/donors/me/responses");
  if (!Array.isArray(body.responses)) return [];
  return body.responses.filter(
    (item): item is DonorResponseRecord =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as DonorResponseRecord).request?.id === "string" &&
      ((item as DonorResponseRecord).response === "accepted" ||
        (item as DonorResponseRecord).response === "declined"),
  );
}

export async function startDonorTransit(requestId: string): Promise<DonationStage> {
  if (!hasRemoteApi) {
    const commitments = await listDonorCommitments();
    const found = commitments.find((item) => item.id === requestId);
    if (!found) {
      throw new ApiError("not_found", "Accept this request before starting transit.");
    }
    if (found.donorStage !== "accepted") {
      throw new ApiError("conflict", "Transit has already started for this request.");
    }
    mockStages.set(requestId, "en_route");
    return "en_route";
  }

  const body = await request<{ stage?: unknown }>(
    `/donors/me/commitments/${encodeURIComponent(requestId)}/en-route`,
    { method: "POST", body: {} },
  );
  if (body.stage !== "en_route") throw new ApiError("unknown", "Could not start donor transit.");
  return body.stage;
}

export async function createDonorCheckInTicket(requestId: string): Promise<DonorCheckInTicket> {
  if (!hasRemoteApi) {
    const localToken = `bloodlink-intake:${requestId}:demo-${Date.now().toString(36)}`;
    return { ticket: localToken, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString() };
  }

  const body = await request<{ ticket?: unknown; expiresAt?: unknown }>(
    `/donors/me/commitments/${encodeURIComponent(requestId)}/check-in-ticket`,
    { method: "POST", body: {} },
  );
  if (typeof body.ticket !== "string" || typeof body.expiresAt !== "string") {
    throw new ApiError("unknown", "The server returned an invalid intake ticket.");
  }
  return { ticket: body.ticket, expiresAt: body.expiresAt };
}

export async function verifyDonorCheckIn(
  requestId: string,
  token: string,
): Promise<{ stage: DonationStage; checkedInAt: string }> {
  if (!hasRemoteApi) {
    mockStages.set(requestId, "arrived");
    return { stage: "arrived", checkedInAt: new Date().toISOString() };
  }

  const body = await request<{ stage?: unknown; checkedInAt?: unknown }>(
    `/donors/requests/${encodeURIComponent(requestId)}/check-in`,
    {
      method: "POST",
      body: { token },
    },
  );

  if (body.stage !== "arrived" || typeof body.checkedInAt !== "string") {
    throw new ApiError("unknown", "Could not verify donor intake.");
  }

  return { stage: "arrived", checkedInAt: body.checkedInAt };
}

export async function completeDonationCase(
  requestId: string,
): Promise<{ stage: DonationStage; completedAt: string }> {
  if (!hasRemoteApi) {
    mockStages.set(requestId, "completed");
    return { stage: "completed", completedAt: new Date().toISOString() };
  }

  const body = await request<{ stage?: unknown; completedAt?: unknown }>(
    `/donors/requests/${encodeURIComponent(requestId)}/complete`,
    {
      method: "POST",
      body: {},
    },
  );

  if (body.stage !== "completed" || typeof body.completedAt !== "string") {
    throw new ApiError("unknown", "Could not complete donation case.");
  }

  return { stage: "completed", completedAt: body.completedAt };
}

