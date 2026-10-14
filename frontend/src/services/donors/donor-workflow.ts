/**
 * Donor commitment workflow: accepting a request, travelling to the hospital,
 * and the single-use intake ticket a hospital scans on arrival.
 *
 * The raw intake token lives only on the donor's device; only its SHA-256 hash
 * is ever sent to the backend. The ticket string embeds the request id and the
 * secret so a scanner can recover both: `bloodlink-intake:<requestId>:<secret>`.
 */

import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from "expo-crypto";

import { apiRequest } from "@/services/api/client";
import { toApiError } from "@/services/api/to-api-error";
import {
  readEmergencyRequest,
  type DonationStage,
  type DonorResponse,
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

async function hashToken(token: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, token);
}

/** The donor's accepted cases (active + completed history). */
export async function listDonorCommitments(): Promise<DonorCommitment[]> {
  try {
    const { commitments } = await apiRequest<{ commitments: unknown }>("/donors/me/commitments");
    const rows = Array.isArray(commitments) ? commitments : [];

    const parsed: DonorCommitment[] = [];

    for (const row of rows) {
      const request = readEmergencyRequest(row);

      if (
        request !== null &&
        request.donorResponse === "accepted" &&
        request.donorStage !== null
      ) {
        parsed.push({ ...request, donorStage: request.donorStage });
      }
    }

    return parsed;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Every response the donor created, including declined ones. */
export async function listDonorResponses(): Promise<DonorResponseRecord[]> {
  try {
    const { responses } = await apiRequest<{ responses: unknown }>("/donors/me/responses");
    const rows = Array.isArray(responses) ? responses : [];

    const records: DonorResponseRecord[] = [];

    for (const row of rows) {
      const request = readEmergencyRequest(row);

      if (request === null || request.donorResponse === null) {
        continue;
      }

      const source = row as { responseCreatedAt?: unknown; responseUpdatedAt?: unknown };

      records.push({
        request,
        response: request.donorResponse,
        stage: request.donorStage ?? "accepted",
        createdAt:
          typeof source.responseCreatedAt === "string"
            ? source.responseCreatedAt
            : request.createdAt,
        updatedAt:
          typeof source.responseUpdatedAt === "string"
            ? source.responseUpdatedAt
            : request.updatedAt,
      });
    }

    return records;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Moves an accepted commitment into transit. */
export async function startDonorTransit(requestId: string): Promise<DonationStage> {
  try {
    await apiRequest<unknown>(`/donors/me/commitments/${requestId}/en-route`, { method: "POST" });

    return "en_route";
  } catch (error) {
    throw toApiError(error, "Accept this request before starting transit.");
  }
}

/** Issues a 15-minute, single-use intake ticket bound to this request. */
export async function createDonorCheckInTicket(requestId: string): Promise<DonorCheckInTicket> {
  try {
    const secret = randomUUID().replace(/-/g, "");

    const { ticket } = await apiRequest<{ ticket: { expiresAt?: unknown } | null }>(
      `/donors/me/commitments/${requestId}/check-in-ticket`,
      { method: "POST", body: { tokenHash: await hashToken(secret) } },
    );

    if (typeof ticket?.expiresAt !== "string") {
      throw new Error("The server returned an invalid intake ticket.");
    }

    return { ticket: `bloodlink-intake:${requestId}:${secret}`, expiresAt: ticket.expiresAt };
  } catch (error) {
    throw toApiError(error, "Start transit before opening your intake QR.");
  }
}

/** Hospital scan: verifies the ticket and marks the donor as arrived. */
export async function verifyDonorCheckIn(
  requestId: string,
  token: string,
): Promise<{ stage: DonationStage; checkedInAt: string }> {
  try {
    const { verified } = await apiRequest<{ verified: { checkedInAt?: unknown } | null }>(
      `/donors/requests/${requestId}/check-in`,
      { method: "POST", body: { tokenHash: await hashToken(token) } },
    );

    if (typeof verified?.checkedInAt !== "string") {
      throw new Error("Could not verify donor intake.");
    }

    return { stage: "arrived", checkedInAt: verified.checkedInAt };
  } catch (error) {
    throw toApiError(error, "This intake QR is invalid or has expired.");
  }
}

/** Staff close the case: the donation completes and the request is fulfilled. */
export async function completeDonationCase(
  requestId: string,
): Promise<{ stage: DonationStage; completedAt: string }> {
  try {
    await apiRequest<unknown>(`/donors/requests/${requestId}/complete`, { method: "POST" });

    return { stage: "completed", completedAt: new Date().toISOString() };
  } catch (error) {
    throw toApiError(error, "Could not complete donation case.");
  }
}
