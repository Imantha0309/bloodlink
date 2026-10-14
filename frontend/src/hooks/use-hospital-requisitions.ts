/**
 * Live emergency-request queue for the hospital's requisition board.
 *
 * The board used to render the `REQUISITIONS` fixtures, so the only affordance
 * on a card — "Manage Requisition" — pointed at the donor arrival desk and the
 * queue itself could never be corrected or withdrawn. This feeds the same
 * approved card design from the requests the hospital actually receives
 * (`GET /emergency-requests`, which returns the open queue for staff), and maps
 * them onto the `Requisition` shape the card renders.
 */

import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { URGENCY_LABEL } from "@/constants/emergency";
import type { Requisition } from "@/constants/hospital-demo";
import { apiErrorMessage } from "@/services/auth";
import {
  listEmergencyRequests,
  type EmergencyRequest,
} from "@/services/requests/emergency-requests";
import { timeAgo } from "@/utils/relative-time";

/** Requests nobody has closed yet — the ones the board tracks. */
function isOpen(status: EmergencyRequest["status"]): boolean {
  return status === "pending" || status === "verified";
}

/** Right-hand pill on the broadcast panel; `null` when nothing needs flagging. */
function urgencyFlag(level: EmergencyRequest["urgency"]): string | null {
  if (level === "critical") {
    return "Critical urgency";
  }

  if (level === "urgent") {
    return "Urgent";
  }

  return null;
}

/**
 * Presents one live request in the approved requisition card.
 *
 * This is a deliberate fit to the design rather than a field-for-field match:
 * the slot after the reference carries the patient's name, and the status
 * panel's two lines carry the request's triage state.
 */
export function toRequisition(request: EmergencyRequest, index: number): Requisition {
  const verified = request.status === "verified";

  return {
    reference: `#REQ-${index + 1}`,
    ward: request.patientName,
    bloodGroup: request.bloodGroup,
    units: request.units,
    subtitle:
      request.notes !== null && request.notes !== ""
        ? request.notes
        : `${request.hospital}${request.district !== null ? ` · ${request.district}` : ""}`,
    status: verified ? "in-transit" : "broadcast",
    statusTitle: verified ? "Verified — donors notified" : "Awaiting verification",
    statusDetail: verified
      ? `${URGENCY_LABEL[request.urgency]} urgency · donors matched`
      : "Awaiting verification at this station",
    donorInitials: [],
    urgency: verified ? null : urgencyFlag(request.urgency),
    createdAt: `Created ${timeAgo(request.createdAt)}`,
  };
}

export type HospitalRequisitions = {
  /** Open requests, in the order the server triages them. */
  requests: EmergencyRequest[];
  isLoading: boolean;
  error: string | null;
};

/**
 * The open requisition queue, refetched whenever the screen regains focus.
 *
 * Focus-driven rather than a one-shot mount fetch so a request edited or
 * deleted on the manage screen is reflected on return, without a manual pull.
 */
export function useHospitalRequisitions(): HospitalRequisitions {
  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      // State is only written from the promise callbacks, never synchronously
      // in the effect — `isLoading` already starts true.
      void listEmergencyRequests()
        .then((all) => {
          if (isActive) {
            setRequests(all.filter((item) => isOpen(item.status)));
            setError(null);
          }
        })
        .catch((caught: unknown) => {
          if (isActive) {
            setError(apiErrorMessage(caught));
          }
        })
        .finally(() => {
          if (isActive) {
            setIsLoading(false);
          }
        });

      return () => {
        isActive = false;
      };
    }, []),
  );

  return { requests, isLoading, error };
}
