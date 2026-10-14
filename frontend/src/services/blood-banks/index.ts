/**
 * Blood facilities and live stock.
 *
 * The API returns the same camelCase keys the SQL used to alias, so this layer
 * only validates shapes and normalises failures.
 */

import { isBloodGroup } from "@/constants/blood-groups";
import type { BloodGroup } from "@/constants/blood-groups";
import { ApiError } from "@/services/api/errors";
import { apiRequest } from "@/services/api/client";
import { toApiError } from "@/services/api/to-api-error";

export type BloodComponent = "whole_blood" | "prbc" | "platelets" | "plasma";

export type InventoryItem = {
  bloodGroup: BloodGroup;
  component: BloodComponent;
  units: number;
  updatedAt: string;
};

export type BloodBank = {
  id: string;
  name: string;
  district: string;
  address: string | null;
  phone: string | null;
  hours: string | null;
  isVerified: boolean;
  note: string | null;
  /** Only present on the list endpoint. */
  totalUnits?: number;
};

export type BloodBankDetail = BloodBank & { inventory: InventoryItem[] };

export type HospitalInventoryBank = Pick<BloodBank, "id" | "name" | "district"> & {
  inventory: InventoryItem[];
};

/** Latest known write time for an inventory row; some edits return none. */
function fallbackUpdatedAt(value: unknown): string {
  return typeof value === "string" ? value : new Date().toISOString();
}

export function readInventoryItem(row: unknown): InventoryItem | null {
  if (typeof row !== "object" || row === null) {
    return null;
  }

  const candidate = row as Partial<InventoryItem>;

  if (
    typeof candidate.bloodGroup !== "string" ||
    !isBloodGroup(candidate.bloodGroup) ||
    typeof candidate.component !== "string" ||
    typeof candidate.units !== "number"
  ) {
    return null;
  }

  return {
    bloodGroup: candidate.bloodGroup,
    component: candidate.component as BloodComponent,
    units: candidate.units,
    updatedAt: fallbackUpdatedAt(candidate.updatedAt),
  };
}

function readBank(row: unknown): BloodBank | null {
  if (typeof row !== "object" || row === null) {
    return null;
  }

  const candidate = row as Partial<BloodBank>;

  if (typeof candidate.id !== "string" || typeof candidate.name !== "string") {
    return null;
  }

  return {
    id: candidate.id,
    name: candidate.name,
    district: typeof candidate.district === "string" ? candidate.district : "",
    address: typeof candidate.address === "string" ? candidate.address : null,
    phone: typeof candidate.phone === "string" ? candidate.phone : null,
    hours: typeof candidate.hours === "string" ? candidate.hours : null,
    isVerified: candidate.isVerified === true,
    note: typeof candidate.note === "string" ? candidate.note : null,
    ...(typeof candidate.totalUnits === "number" ? { totalUnits: candidate.totalUnits } : {}),
  };
}

export async function listBloodBanks(): Promise<BloodBank[]> {
  try {
    const { banks } = await apiRequest<{ banks: unknown }>("/blood-banks", { auth: false });
    const list = Array.isArray(banks) ? banks : [];

    const parsed: BloodBank[] = [];

    for (const row of list) {
      const bank = readBank(row);

      if (bank !== null) {
        parsed.push(bank);
      }
    }

    return parsed;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getBloodBank(id: string): Promise<BloodBankDetail> {
  try {
    const { bank } = await apiRequest<{ bank: unknown }>(`/blood-banks/${id}`, { auth: false });
    const parsed = readBank(bank);

    if (parsed === null) {
      throw new ApiError("not_found", "That blood bank could not be found.");
    }

    const inventory = readInventoryMatrix((bank as { inventory?: unknown }).inventory);

    return { ...parsed, inventory };
  } catch (error) {
    throw toApiError(error, "That blood bank could not be found.");
  }
}

export function readInventoryMatrix(value: unknown): InventoryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: InventoryItem[] = [];

  for (const row of value) {
    const item = readInventoryItem(row);

    if (item !== null) {
      items.push(item);
    }
  }

  return items;
}
