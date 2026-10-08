/**
 * Blood facilities and live stock.
 *
 * The offline branch keeps a small in-memory facility list with deterministic
 * stock so the recipient home, the storage monitor and the urgent form still
 * render with no server running.
 */

import type { BloodGroup } from "@/constants/blood-groups";
import { request } from "@/services/api/client";
import { ApiError } from "@/services/api/errors";
import { hasRemoteApi } from "@/services/config";

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

const OFFLINE_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const OFFLINE_COMPONENTS: BloodComponent[] = ["whole_blood", "prbc", "platelets", "plasma"];

/** Mirrors the seed's deterministic formula, so offline looks like a fresh seed. */
function offlineUnits(bankIndex: number, groupIndex: number, componentIndex: number): number {
  const base = (bankIndex * 5 + groupIndex * 7 + componentIndex * 3) % 14;
  const group = OFFLINE_GROUPS[groupIndex];
  const component = OFFLINE_COMPONENTS[componentIndex];

  if (group === "O-") return base % 4;
  if (component === "platelets") return base % 6;
  return base;
}

/**
 * Mutable so offline stock edits (the hospital storage screen) persist for the
 * session, exactly like the seeded request list does.
 */
const OFFLINE_BANKS: (BloodBank & { inventory: InventoryItem[] })[] = [
  {
    id: "nhs_l",
    name: "National Hospital of Sri Lanka",
    district: "Colombo",
    address: "Regent Street, Colombo 00700",
    phone: "+94 11 200 0001",
    hours: "24 hours",
    isVerified: true,
    note: "Verified national medical facility with 24/7 cold storage",
    inventory: [],
  },
  {
    id: "lady_ridgeway",
    name: "Lady Ridgeway Hospital for Children",
    district: "Colombo",
    address: "Regent Street, Colombo 00800",
    phone: "+94 11 200 0002",
    hours: "24 hours",
    isVerified: true,
    note: "Verified teaching hospital with a paediatric blood bank",
    inventory: [],
  },
  {
    id: "sir_james_peiris",
    name: "Sir James Peiris Hospital",
    district: "Colombo",
    address: "Sir James Pieris Mawatha, Colombo 00800",
    phone: "+94 11 200 0003",
    hours: "7:00 - 19:00",
    isVerified: false,
    note: "Municipal hospital — confirm stock before travelling",
    inventory: [],
  },
  {
    id: "kandy_teaching",
    name: "Kandy Teaching Hospital",
    district: "Kandy",
    address: "Arthur Senanayake Road, Kandy 20000",
    phone: "+94 11 200 0004",
    hours: "24 hours",
    isVerified: true,
    note: "Verified teaching hospital with 24/7 cold storage",
    inventory: [],
  },
  {
    id: "galle_general",
    name: "Galle General Hospital",
    district: "Galle",
    address: "Hospital Road, Galle 80000",
    phone: "+94 11 200 0005",
    hours: "24 hours",
    isVerified: true,
    note: "Verified regional blood bank",
    inventory: [],
  },
  {
    id: "anuradhapura_general",
    name: "Anuradhapura General Hospital",
    district: "Anuradhapura",
    address: "Kalawewa Road, Anuradhapura 50000",
    phone: "+94 11 200 0006",
    hours: "7:00 - 19:00",
    isVerified: false,
    note: "Regional hospital — confirm stock before travelling",
    inventory: [],
  },
  {
    id: "gampaha_base",
    name: "Gampaha Base Hospital",
    district: "Gampaha",
    address: "Colombo Road, Gampaha 11600",
    phone: "+94 11 200 0007",
    hours: "24 hours",
    isVerified: true,
    note: "District hospital with 24/7 emergency blood bank",
    inventory: [],
  },
];

OFFLINE_BANKS.forEach((bank, bankIndex) => {
  bank.inventory = OFFLINE_GROUPS.flatMap((group, groupIndex) =>
    OFFLINE_COMPONENTS.map((component, componentIndex) => ({
      bloodGroup: group,
      component,
      units: offlineUnits(bankIndex, groupIndex, componentIndex),
      updatedAt: new Date().toISOString(),
    })),
  );
});

/** Total units held across the offline facility list. */
function offlineTotal(bank: { inventory: InventoryItem[] }): number {
  return bank.inventory.reduce((sum, item) => sum + item.units, 0);
}

export async function listBloodBanks(): Promise<BloodBank[]> {
  if (!hasRemoteApi) {
    return OFFLINE_BANKS.map(({ inventory, ...bank }) => ({
      ...bank,
      totalUnits: offlineTotal({ inventory }),
    }));
  }

  const body = await request<{ banks?: unknown }>("/blood-banks");
  const list = Array.isArray(body.banks) ? body.banks : [];

  return list.filter(
    (item): item is BloodBank =>
      typeof item === "object" && item !== null && typeof (item as BloodBank).id === "string",
  );
}

export async function getBloodBank(id: string): Promise<BloodBankDetail> {
  if (!hasRemoteApi) {
    const found = OFFLINE_BANKS.find((bank) => bank.id === id);

    if (found === undefined) {
      throw new ApiError("not_found", "That blood bank could not be found.");
    }

    return { ...found, inventory: [...found.inventory] };
  }

  const body = await request<{ bank?: unknown }>(`/blood-banks/${encodeURIComponent(id)}`);
  const bank = body.bank as BloodBankDetail | undefined;

  if (bank === undefined || typeof bank.id !== "string") {
    throw new ApiError("not_found", "That blood bank could not be found.");
  }

  return bank;
}

/**
 * Adjusts one stock line. Offline it mutates the in-memory facility list so
 * the storage screen demonstrates a restock without a server.
 */
export async function updateOfflineInventory(
  bankId: string,
  bloodGroup: BloodGroup,
  component: BloodComponent,
  units: number,
): Promise<InventoryItem> {
  const bank = OFFLINE_BANKS.find((candidate) => candidate.id === bankId);

  if (bank === undefined) {
    throw new ApiError("not_found", "That blood bank could not be found.");
  }

  const item = bank.inventory.find(
    (entry) => entry.bloodGroup === bloodGroup && entry.component === component,
  );
  const updatedAt = new Date().toISOString();

  if (item === undefined) {
    const created: InventoryItem = { bloodGroup, component, units, updatedAt };
    bank.inventory.push(created);
    return created;
  }

  item.units = units;
  item.updatedAt = updatedAt;
  return { ...item };
}
