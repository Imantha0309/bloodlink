/**
 * The shift handover log.
 *
 * One entry per outgoing shift: what the incoming one needs to know. Entries are
 * never edited or deleted — a handover records what the outgoing shift believed
 * at the time, not a status that gets corrected later. The server scopes both
 * the read and the write to the caller's own district.
 */

import { apiRequest } from "@/services/api/client";
import { toApiError } from "@/services/api/to-api-error";

export type ShiftHandover = {
  id: string;
  /** The facility's district; null for an admin filing one. */
  district: string | null;
  /** The shift as filed, e.g. `Day shift · 08:00–20:00`. */
  shiftLabel: string;
  notes: string;
  pendingCrossMatches: number;
  /** Snapshotted at filing time, so the log survives the account being removed. */
  authorName: string;
  createdAt: string;
};

export type ShiftHandoverInput = {
  shiftLabel: string;
  notes: string;
  pendingCrossMatches: number;
};

/** Narrows one handover row; malformed rows are dropped rather than trusted. */
export function readShiftHandover(row: unknown): ShiftHandover | null {
  if (typeof row !== "object" || row === null) {
    return null;
  }

  const candidate = row as Partial<ShiftHandover>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.shiftLabel !== "string" ||
    typeof candidate.notes !== "string" ||
    typeof candidate.authorName !== "string" ||
    typeof candidate.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    district: typeof candidate.district === "string" ? candidate.district : null,
    shiftLabel: candidate.shiftLabel,
    notes: candidate.notes,
    pendingCrossMatches:
      typeof candidate.pendingCrossMatches === "number" ? candidate.pendingCrossMatches : 0,
    authorName: candidate.authorName,
    createdAt: candidate.createdAt,
  };
}

function readHandoverList(value: unknown): ShiftHandover[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const handovers: ShiftHandover[] = [];

  for (const row of value) {
    const handover = readShiftHandover(row);

    if (handover !== null) {
      handovers.push(handover);
    }
  }

  return handovers;
}

/** The district's log, newest first. */
export async function listShiftHandovers(): Promise<ShiftHandover[]> {
  try {
    const { handovers } = await apiRequest<{ handovers: unknown }>("/hospital/handovers");

    return readHandoverList(handovers);
  } catch (error) {
    throw toApiError(error);
  }
}

/** Files one, and returns the stored row so the caller can prepend it. */
export async function createShiftHandover(input: ShiftHandoverInput): Promise<ShiftHandover> {
  try {
    const { handover } = await apiRequest<{ handover: unknown }>("/hospital/handovers", {
      method: "POST",
      body: {
        shiftLabel: input.shiftLabel,
        notes: input.notes.trim(),
        pendingCrossMatches: input.pendingCrossMatches,
      },
    });

    const created = readShiftHandover(handover);

    if (created === null) {
      throw new Error("The server returned an unexpected response.");
    }

    return created;
  } catch (error) {
    throw toApiError(error, "Could not file that handover.");
  }
}
