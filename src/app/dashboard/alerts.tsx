import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { DashboardTabBar, type DashboardTabKey } from "@/components/dashboard/dashboard-tab-bar";
import { StepHeader } from "@/components/emergency/step-header";
import { Reveal } from "@/components/motion/reveal";
import { AsyncState } from "@/components/ui/async-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { ALERT_META } from "@/constants/alerts";
import { Blood, Surface } from "@/constants/colors";
import { ControlHeight, Radius } from "@/constants/radius";
import { DASHBOARD_TABS, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import { listAlerts, markAlertsRead, type Alert } from "@/services/alerts";
import { haptics } from "@/utils/haptics";
import { timeAgo } from "@/utils/time";

/**
 * The alerts feed — every notification for the signed-in account.
 *
 * Follows the dashboard recipe: `StepHeader` on top, one ScrollView with
 * pull-to-refresh, `DashboardTabBar` pinned below. Alerts come from the API
 * (offline: the module fallback feed); reading one or tapping "Mark all read"
 * persists through `markAlertsRead`.
 */

export default function AlertsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const onBack = useAuthBack(DASHBOARD_TABS.alerts);

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = alerts.filter((alert) => alert.readAt === null).length;

  /** Pull-to-refresh (or the retry button) from the handlers, never an effect. */
  async function refreshFeed(options?: { useLoader?: boolean }) {
    if (options?.useLoader === true) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      setAlerts((await listAlerts()).alerts);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      if (options?.useLoader === true) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }

  useEffect(() => {
    let cancelled = false;

    listAlerts()
      .then((feed) => {
        if (!cancelled) {
          setAlerts(feed.alerts);
        }
      })
      .catch((caught: unknown) => {
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

  /** Marks everything read, then re-reads so the feed and badge agree. */
  async function markAllRead() {
    try {
      await markAlertsRead();
      haptics.light();
      setAlerts((await listAlerts()).alerts);
    } catch {
      // Keep the feed as-is; the button stays for another try.
    }
  }

  /** Opens a single alert, linking through to its request when it has one. */
  async function openAlert(alert: Alert) {
    if (alert.readAt === null) {
      try {
        haptics.light();
        await markAlertsRead([alert.id]);
        const feed = await listAlerts();
        setAlerts((current) =>
          current.map((candidate) =>
            candidate.id === alert.id
              ? { ...candidate, readAt: feed.alerts.find((next) => next.id === alert.id)?.readAt ?? candidate.readAt }
              : candidate,
          ),
        );
      } catch {
        // Reading is best-effort; the navigation below still happens.
      }
    }

    if (alert.requestId !== null) {
      router.push({ pathname: ROUTES.requestStatus, params: { id: alert.requestId } });
    }
  }

  function goTab(key: DashboardTabKey) {
    if (key === "alerts") {
      return;
    }

    router.push(DASHBOARD_TABS[key]);
  }

  return (
    <View style={styles.screen}>
      <StepHeader
        title="Alerts"
        onBack={onBack}
        right={
          unreadCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mark all alerts as read"
              onPress={() => void markAllRead()}
              hitSlop={6}
              style={({ pressed }) => [styles.markAll, pressed && styles.pressed]}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          ) : null
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refreshFeed()}
            tintColor={Blood.primary}
            colors={[Blood.primary]}
          />
        }
      >
        <Text style={styles.subtitle}>
          {session?.user.fullName ?? "Your"} responses, matches and request updates, newest first.
        </Text>

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={alerts.length === 0}
          emptyTitle="No alerts yet"
          emptyMessage="Donor responses, matches and status changes for your requests will land here."
          skeleton={
            <>
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </>
          }
          onRetry={() => void refreshFeed({ useLoader: true })}
        >
          <View style={styles.feed}>
            {alerts.map((alert, index) => {
              const meta = ALERT_META[alert.type];

              return (
                <Reveal index={index} key={alert.id}>
                  <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${alert.title}. ${alert.body}`}
                  onPress={() => void openAlert(alert)}
                  style={({ pressed }) => [styles.item, pressed && styles.pressed]}
                >
                  <View style={[styles.badge, { backgroundColor: meta.background }]}>
                    <Feather name={meta.icon} size={14} color={meta.color} />
                  </View>

                  <View style={styles.itemCopy}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemLabel}>{meta.label}</Text>
                      <Text style={styles.itemTime}>{timeAgo(alert.createdAt)}</Text>
                    </View>

                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {alert.title}
                    </Text>
                    <Text style={styles.itemBody} numberOfLines={2}>
                      {alert.body}
                    </Text>
                  </View>

                  {alert.readAt === null ? <View style={styles.unreadDot} /> : null}
                  </Pressable>
                </Reveal>
              );
            })}
          </View>
        </AsyncState>
      </ScrollView>

      <DashboardTabBar
        tabs={[
          { key: "home", label: "Home", icon: "home" },
          { key: "requests", label: "Requests", icon: "file-text" },
          { key: "alerts", label: "Alerts", icon: "bell" },
          { key: "profile", label: "Profile", icon: "user" },
        ]}
        activeKey="alerts"
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

  markAll: {
    minHeight: ControlHeight.iconButton,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    backgroundColor: Surface.softRed,
  },

  markAllText: {
    ...Typography.label,
    fontSize: 11,
    color: Blood.primary,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 10,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  feed: {
    gap: 8,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  badge: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  itemCopy: {
    flex: 1,
    gap: 1,
  },

  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  itemLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Surface.textMuted,
  },

  itemTime: {
    ...Typography.micro,
    color: Surface.textMuted,
  },

  itemTitle: {
    ...Typography.label,
    fontSize: 13,
    color: Surface.text,
  },

  itemBody: {
    ...Typography.small,
    fontSize: 12,
    color: Surface.textSecondary,
    lineHeight: 16,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Blood.primary,
  },
});