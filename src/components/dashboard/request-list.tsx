import { StyleSheet, View } from "react-native";

import { EmptyNote } from "@/components/dashboard/empty-note";
import { RequestCard } from "@/components/dashboard/request-card";
import type { BloodGroup } from "@/constants/blood-groups";
import { CAN_DONATE_TO } from "@/constants/blood-groups";
import type { EmergencyRequest } from "@/services/requests/emergency-requests";

type RequestListProps = {
  requests: readonly EmergencyRequest[];
  /** Ignored when the list is non-empty. */
  emptyTitle?: string;
  emptyMessage?: string;
  /**
   * When set, requests this donor's blood can serve get the matching
   * treatment. Presentation only — the server already decided what to return.
   */
  donorGroup?: BloodGroup | null;
  /**
   * Enables the Manage / Cancel actions on each card, for a recipient's own
   * requests. Left off for donor and admin lists, which only read the queue.
   */
  isManageable?: boolean;
  /** Opens the edit form for a request. */
  onEdit?: (request: EmergencyRequest) => void;
  /** Cancels a request after confirmation; the list reports the outcome. */
  onCancel?: (request: EmergencyRequest) => Promise<void>;
};

/** A triage list, or the "nothing here" note when it is empty. */
export function RequestList({
  requests,
  emptyTitle = "Nothing to show",
  emptyMessage = "There are no requests here right now.",
  donorGroup = null,
  isManageable = false,
  onEdit,
  onCancel,
}: RequestListProps) {
  if (requests.length === 0) {
    return <EmptyNote title={emptyTitle} message={emptyMessage} />;
  }

  const servable = donorGroup === null ? null : CAN_DONATE_TO[donorGroup];

  return (
    <View style={styles.list}>
      {requests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          matchesDonor={servable?.includes(request.bloodGroup) ?? false}
          isManageable={isManageable}
          onEdit={onEdit}
          onCancel={onCancel}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
});
