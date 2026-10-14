/**
 * Transfusion discrepancy reports.
 *
 * Append-only: nothing here edits or deletes a report. Resolving one records who
 * dealt with it, because an incident log that can be quietly tidied away is not
 * an audit trail. The list defaults to open reports; passing `true` brings the
 * resolved ones back so the history stays reachable.
 */

import { apiRequest } from "@/services/api/client";
import { toApiError } from "@/services/api/to-api-error";

export const DISCREPANCY_TYPES = ["labeling", "volume", "hemolysis", "transport", "other"] as const;
export type DiscrepancyType = (typeof DISCREPANCY_TYPES)[number];

export const DISCREPANCY_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type DiscrepancySeverity = (typeof DISCREPANCY_SEVERITIES)[number];

export type DiscrepancyReport = {
  id: string;
  /** The district that filed it; null for an admin filing one. */
  district: string | null;
  type: DiscrepancyType;
  severity: DiscrepancySeverity;
  detail: string;
  /** Snapshotted at filing time, so the log survives the account being removed. */
  reporterName: string;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
};

export type DiscrepancyInput = {
  type: DiscrepancyType;
  severity: DiscrepancySeverity;
  detail: string;
};

function isDiscrepancyType(value: unknown): value is DiscrepancyType {
  return typeof value === "string" && (DISCREPANCY_TYPES as readonly string[]).includes(value);
}

function isDiscrepancySeverity(value: unknown): value is DiscrepancySeverity {
  return typeof value === "string" && (DISCREPANCY_SEVERITIES as readonly string[]).includes(value);
}

/** Narrows one report row; malformed rows are dropped rather than trusted. */
export function readDiscrepancyReport(row: unknown): DiscrepancyReport | null {
  if (typeof row !== "object" || row === null) {
    return null;
  }

  const candidate = row as Partial<DiscrepancyReport>;

  if (
    typeof candidate.id !== "string" ||
    !isDiscrepancyType(candidate.type) ||
    !isDiscrepancySeverity(candidate.severity) ||
    typeof candidate.detail !== "string" ||
    typeof candidate.reporterName !== "string" ||
    typeof candidate.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    district: typeof candidate.district === "string" ? candidate.district : null,
    type: candidate.type,
    severity: candidate.severity,
    detail: candidate.detail,
    reporterName: candidate.reporterName,
    resolved: candidate.resolved === true,
    resolvedAt: typeof candidate.resolvedAt === "string" ? candidate.resolvedAt : null,
    createdAt: candidate.createdAt,
  };
}

function readReportList(value: unknown): DiscrepancyReport[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const reports: DiscrepancyReport[] = [];

  for (const row of value) {
    const report = readDiscrepancyReport(row);

    if (report !== null) {
      reports.push(report);
    }
  }

  return reports;
}

/** Open reports by default; `includeResolved` adds the closed ones back. */
export async function listDiscrepancyReports(includeResolved: boolean): Promise<DiscrepancyReport[]> {
  try {
    const { reports } = await apiRequest<{ reports: unknown }>("/hospital/discrepancies", {
      query: { includeResolved: includeResolved ? "true" : null },
    });

    return readReportList(reports);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function createDiscrepancyReport(input: DiscrepancyInput): Promise<DiscrepancyReport> {
  try {
    const { report } = await apiRequest<{ report: unknown }>("/hospital/discrepancies", {
      method: "POST",
      body: { type: input.type, severity: input.severity, detail: input.detail.trim() },
    });

    const created = readDiscrepancyReport(report);

    if (created === null) {
      throw new Error("The server returned an unexpected response.");
    }

    return created;
  } catch (error) {
    throw toApiError(error, "Could not file that report.");
  }
}

export async function resolveDiscrepancyReport(id: string): Promise<void> {
  try {
    await apiRequest<unknown>(`/hospital/discrepancies/${id}/resolve`, { method: "PATCH" });
  } catch (error) {
    throw toApiError(error, "Could not resolve that report.");
  }
}
