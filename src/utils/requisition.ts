/**
 * Display mapping for the hospital requisition board.
 *
 * One shape feeds the card whether the source is an API emergency request or
 * the legacy fixture list, so Home and the Requests tab can never drift apart.
 */

import type { BloodGroup } from "@/constants/blood-groups";
import {
  REQUEST_STATUS_META,
  URGENCY_LABEL,
  type DonationStage,
  type RequestStatus,
} from "@/constants/emergency";
import type { EmergencyRequest } from "@/services/requests/emergency-requests";
import { referenceFor } from "@/utils/reference";
import { timeAgo } from "@/utils/time";

export type RequisitionStatus = "in-transit" | "broadcast";

export type Requisition = {
  /** Human reference shown at the top of the card, e.g. `#REQ-2094`. */
  reference: string;
  ward: string;
  bloodGroup: BloodGroup;
  units: number;
  /** Secondary line — who reported it, or the ward detail. */
  subtitle: string;
  status: RequisitionStatus;
  statusTitle: string;
  statusDetail: string;
  /** Monograms for the overlapping avatars; only the transit state shows them. */
  donorInitials: readonly string[];
  /** Red attention pill on the panel; `null` when there is nothing to flag. */
  urgency: string | null;
  /** Relative age, already formatted for display. */
  createdAt: string;
};

const STAGE_TITLES: Record<Exclude<DonationStage, "completed">, string> = {
  accepted: "Donor Accepted",
  en_route: "Donor In Transit",
  arrived: "Donor At Hospital",
};

const STAGE_DETAILS: Record<Exclude<DonationStage, "completed">, string> = {
  accepted: "Preparing to leave for this station",
  en_route: "ETA tracking live",
  arrived: "Awaiting extraction at the desk",
};

const BROADCAST_DETAILS: Record<RequestStatus, string> = {
  pending: "Awaiting verification at this station",
  verified: "Donors notified — awaiting responses",
  fulfilled: "Transfusion completed",
  cancelled: "No longer needed",
};

/** A donor mid-journey flips the card into its transit panel. */
function isEnRoute(stage: DonationStage | null): stage is "en_route" | "arrived" {
  return stage === "en_route" || stage === "arrived";
}

export function toRequisition(request: EmergencyRequest): Requisition {
  const enRoute = isEnRoute(request.donorStage);
  const accepted = request.donorStage === "accepted";

  return {
    reference: `#REQ-${referenceFor(request.id)}`,
    ward: request.patientName,
    bloodGroup: request.bloodGroup,
    units: request.units,
    subtitle: request.notes ?? `Reported by ${request.contactName}`,
    status: enRoute || accepted ? "in-transit" : "broadcast",
    statusTitle:
      enRoute || accepted
        ? STAGE_TITLES[request.donorStage as keyof typeof STAGE_TITLES]
        : REQUEST_STATUS_META[request.status].label,
    statusDetail:
      enRoute || accepted
        ? STAGE_DETAILS[request.donorStage as keyof typeof STAGE_DETAILS]
        : BROADCAST_DETAILS[request.status],
    // The list endpoint does not carry responder names, so avatars stay empty
    // and the card falls through to the urgency pill.
    donorInitials: [],
    urgency:
      request.urgency === "standard"
        ? null
        : `${URGENCY_LABEL[request.urgency]} urgency`,
    createdAt: `Created ${timeAgo(request.createdAt)}`,
  };
}
