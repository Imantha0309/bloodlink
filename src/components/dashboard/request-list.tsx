import { StyleSheet, View } from "react-native";

import { EmptyNote } from "@/components/dashboard/empty-note";
import { RequestCard } from "@/components/dashboard/request-card";
import type { BloodGroup } from "@/constants/blood-groups";
import { CAN_DONATE_TO } from "@/constants/blood-groups";
import type { DonorResponse, EmergencyRequest } from "@/services/requests/emergency-requests";

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
  canAccept?: boolean;
  onDonorResponse?: (id: string, response: DonorResponse, isUpdate: boolean) => Promise<DonorResponse>;
  onRemoveDonorResponse?: (id: string) => Promise<void>;
};

/** A triage list, or the "nothing here" note when it is empty. */
export function RequestList({
  requests,
  emptyTitle = "Nothing to show",
  emptyMessage = "There are no requests here right now.",
  donorGroup = null,
  canAccept = true,
  onDonorResponse,
  onRemoveDonorResponse,
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
          canAccept={canAccept}
          onDonorResponse={onDonorResponse}
          onRemoveDonorResponse={onRemoveDonorResponse}
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
