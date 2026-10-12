import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { DashboardTabBar, type DashboardTabKey } from "@/components/dashboard/dashboard-tab-bar";
import { RequestCard } from "@/components/dashboard/request-card";
import { StepHeader } from "@/components/emergency/step-header";
import { AsyncState } from "@/components/ui/async-state";
import { Blood, Surface } from "@/constants/colors";
import { DASHBOARD_TABS, ROLE_HOME, ROUTES } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/auth";
import {
  listEmergencyRequests,
  type EmergencyRequest,
} from "@/services/requests/emergency-requests";

/**
 * Requests — the recipient's own request history, straight from the API.
 *
 * Same recipe as Request Status: `StepHeader`, ScrollView with
 * pull-to-refresh, `DashboardTabBar` pinned below (active = requests). Each
 * card pushes the real Request Status screen with its id, so this list is the
 * index for every entry point into tracking.
 */
export default function RequestsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  // Fall back to the signed-in user's own home, not always the recipient one.
  const onBack = useAuthBack(ROLE_HOME[session?.user.role ?? "recipient"]);

  const [requests, setRequests] = useState<EmergencyRequest[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  /** Pull-to-refresh / retry — invoked from event handlers only. */
  async function load(mode: "initial" | "refresh") {
    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      setRequests(await listEmergencyRequests());
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      if (mode === "initial") {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }

  function openRequest(id: string) {
    router.push({ pathname: ROUTES.requestStatus, params: { id } });
  }

  function goTab(key: DashboardTabKey) {
    if (key === "requests") {
      return;
    }

    router.push(DASHBOARD_TABS[key]);
  }

  const isEmpty = (requests ?? []).length === 0;
  const showEmptyAction = !isLoading && error === null && isEmpty;

  return (
    <View style={styles.screen}>
      <StepHeader title="Requests" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void load("refresh");
            }}
            tintColor={Blood.primary}
            colors={[Blood.primary]}
          />
        }
      >
        <Text style={styles.subtitle}>
          Every emergency request you have raised — tap one to track its live status.
        </Text>

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={isEmpty}
          emptyTitle="No requests yet"
          emptyMessage="You have not raised an emergency request yet."
          onRetry={() => {
            void load("initial");
          }}
        >
          <View style={styles.list}>
            {(requests ?? []).map((request) => (
              <Pressable
                key={request.id}
                accessibilityRole="button"
                accessibilityLabel={`Open status for ${request.patientName}`}
                onPress={() => openRequest(request.id)}
                style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}
              >
                <RequestCard request={request} />
              </Pressable>
            ))}
          </View>
        </AsyncState>

        {showEmptyAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(ROUTES.emergencyRequest)}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
          >
            <Text style={styles.primaryActionText}>Raise an Emergency Request</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <DashboardTabBar
        tabs={[
          { key: "home", label: "Home", icon: "home" },
          { key: "requests", label: "Requests", icon: "file-text" },
          { key: "alerts", label: "Alerts", icon: "bell" },
          { key: "profile", label: "Profile", icon: "user" },
        ]}
        activeKey="requests"
        onSelect={goTab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  pressed: {
    opacity: 0.7,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 18,
  },

  subtitle: {
    fontSize: 9.5,
    lineHeight: 14,
    color: Surface.textSecondary,
    marginBottom: 9,
  },

  list: {
    gap: 10,
  },

  cardPressable: {
    borderRadius: 11,
  },

  primaryAction: {
    height: 40,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
    marginTop: 3,
  },

  primaryActionPressed: {
    backgroundColor: Blood.dark,
    opacity: 1,
  },

  primaryActionText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
    color: Surface.onPrimary,
  },
});
