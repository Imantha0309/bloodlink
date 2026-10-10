/**
 * Privacy-safe donor search for the Find Donors page.
 *
 * Only available donors come back, and only as initials + blood group +
 * district — never a name or contact detail. The compatibility filter runs
 * server-side; this module just shapes the rows for display.
 */

import { isBloodGroup, type BloodGroup } from "@/constants/blood-groups";
import { apiRequest } from "@/services/api/client";
import { toApiError } from "@/services/api/to-api-error";
import { personInitials } from "@/utils/initials";

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

export async function searchDonors(query: DonorDirectoryQuery = {}): Promise<DonorDirectoryResult> {
  try {
    const { donors: rows } = await apiRequest<{ donors: unknown }>("/donors/directory", {
      query: { bloodGroup: query.bloodGroup ?? null, district: query.district ?? null },
    });

    const donors: DirectoryDonor[] = [];

    for (const row of Array.isArray(rows) ? rows : []) {
      if (typeof row !== "object" || row === null) {
        continue;
      }

      const donor = row as { fullName?: unknown; bloodGroup?: unknown; district?: unknown };

      if (typeof donor.fullName !== "string" || typeof donor.bloodGroup !== "string") {
        continue;
      }

      const initials = personInitials(donor.fullName);

      if (initials === null || !isBloodGroup(donor.bloodGroup)) {
        continue;
      }

      donors.push({
        initials,
        bloodGroup: donor.bloodGroup,
        district: typeof donor.district === "string" ? donor.district : null,
      });
    }

    return { donors, count: donors.length };
  } catch (error) {
    throw toApiError(error);
  }
}
