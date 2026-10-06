import { ApiError } from "@/services/api/errors";
import { request } from "@/services/api/client";
import { hasRemoteApi } from "@/services/config";
import {
  listEmergencyRequests,
  type DonationStage,
  type EmergencyRequest,
} from "@/services/requests/emergency-requests";

export type DonorCommitment = EmergencyRequest & { donorStage: DonationStage };
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
