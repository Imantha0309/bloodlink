import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HospitalHeader } from "@/components/hospital/hospital-header";
import { RequisitionCard } from "@/components/hospital/requisition-card";
import { AsyncState } from "@/components/ui/async-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import {
  listEmergencyRequests,
  type EmergencyRequest,
} from "@/services/requests/emergency-requests";
import { toRequisition } from "@/utils/requisition";
import { initialsOf } from "@/utils/initials";

/** Loading placeholder for the requisition board. */
function BoardSkeleton() {
  return (
    <View style={styles.list}>
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
    </View>
  );
}

/** Full requisition board — everything Home summarises, straight from the API. */
export default function HospitalRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [requests, setRequests] = useState<EmergencyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load: state only changes inside the promise callbacks, so the
  // effect body itself never triggers a cascading render.
  useEffect(() => {
    let cancelled = false;

    listEmergencyRequests()
      .then((data) => {
        if (!cancelled) {
          setRequests(data);
          setError(null);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setError(apiErrorMessage(caught));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** Retry — invoked from event handlers only. */
  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      setRequests(await listEmergencyRequests());
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }

  const center = session?.user.district
    ? `${session.user.district} District`
    : "Your station";

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HospitalHeader
          subtitle="Hospital Staff Dashboard"
          initials={initialsOf(session?.user.fullName)}
        />

        <View style={styles.headingRow}>
          <View style={styles.headingText}>
            <Text style={styles.title} accessibilityRole="header">
              Emergency Requisitions
            </Text>

            <Text style={styles.subtitle}>Active board at {center}</Text>
          </View>

          <View style={styles.countPill}>
            <Text style={styles.countText}>{requests.length}</Text>
          </View>
        </View>

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={requests.length === 0}
          emptyTitle="Board is clear"
          emptyMessage="No emergency requisitions yet — issue one from Home to start the board."
          emptyAction={{
            label: "Issue a requisition",
            onPress: () => router.push(ROUTES.hospitalCreateRequest),
          }}
          skeleton={<BoardSkeleton />}
          onRetry={() => {
            void load();
          }}
        >
          <View style={styles.list}>
            {requests.map((request) => (
              <RequisitionCard
                key={request.id}
                item={toRequisition(request)}
                onManage={() => {
                  router.push({
                    pathname: ROUTES.hospitalVerifyDonor,
                    params: { requestId: request.id },
                  });
                }}
              />
            ))}
          </View>
        </AsyncState>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  flex: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    gap: 14,
  },

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
  },

  headingText: {
    flex: 1,
    gap: 2,
  },

  title: {
    ...Typography.title,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  countPill: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  countText: {
    ...Typography.label,
    color: Blood.primary,
  },

  list: {
    gap: 10,
  },
});
