/**
 * Privacy-safe donor search for the Find Donors page.
 *
 * Only available donors come back, and only as initials + blood group +
 * district — never a name or contact detail. Offline the results are a small
 * fabricated pool filtered by the same criteria.
 */

import type { BloodGroup } from "@/constants/blood-groups";
import { request } from "@/services/api/client";
import { hasRemoteApi } from "@/services/config";

export type DirectoryDonor = {
  initials: string;
  bloodGroup: BloodGroup;
  district: string | null;
};

export type DonorDirectoryResult = {
  donors: DirectoryDonor[];
  count: number;
};

export type DonorDirectoryQuery = {
  bloodGroup?: BloodGroup | null;
  district?: string | null;
};

const OFFLINE_DONORS: DirectoryDonor[] = [
  { initials: "IB", bloodGroup: "O-", district: "Colombo" },
  { initials: "RJ", bloodGroup: "O+", district: "Gampaha" },
  { initials: "TS", bloodGroup: "A+", district: "Kandy" },
  { initials: "MF", bloodGroup: "B+", district: "Galle" },
  { initials: "DP", bloodGroup: "AB+", district: "Colombo" },
  { initials: "NW", bloodGroup: "O-", district: "Gampaha" },
  { initials: "NP", bloodGroup: "O+", district: "Colombo" },
];

export async function searchDonors(query: DonorDirectoryQuery = {}): Promise<DonorDirectoryResult> {
  if (!hasRemoteApi) {
    const donors = OFFLINE_DONORS.filter(
      (donor) =>
        (query.bloodGroup == null || donor.bloodGroup === query.bloodGroup) &&
        (query.district == null || donor.district === query.district),
    );

    return { donors, count: donors.length };
  }

  const params = new URLSearchParams();

  if (query.bloodGroup != null) params.set("bloodGroup", query.bloodGroup);
  if (query.district != null) params.set("district", query.district);

  const qs = params.toString();
  const body = await request<{ donors?: unknown; count?: unknown }>(
    `/donors/directory${qs ? `?${qs}` : ""}`,
  );
  const list = Array.isArray(body.donors) ? body.donors : [];

  const donors = list.filter(
    (item): item is DirectoryDonor =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as DirectoryDonor).initials === "string",
  );

  return { donors, count: typeof body.count === "number" ? body.count : donors.length };
}
