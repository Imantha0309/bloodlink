import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { queryKeys } from "@/data/keys";
import { useMutation } from "@/data/use-mutation";
import { usePollingQuery } from "@/data/use-polling-query";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";
import { listAlerts, markAlertsRead, type Alert } from "@/services/alerts";
import { haptics } from "@/utils/haptics";
import { timeAgo } from "@/utils/time";

/**
 * The alerts feed — every notification for the signed-in account.
 *
 * Follows the dashboard recipe: `StepHeader` on top, one ScrollView with
 * pull-to-refresh, `DashboardTabBar` pinned below.
 *
 * Reads the shared `["alerts"]` cache entry — the same one the unread badge
 * reads — and polls it while the screen is focused, so a new alert appears
 * without a manual refresh. Marking anything read runs through `markAlertsRead`
 * and then invalidates that one key, which is what moves the badge.
 */

export default function AlertsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const onBack = useAuthBack(DASHBOARD_TABS.alerts);

  const feed = usePollingQuery({
    key: queryKeys.alerts(),
    queryFn: listAlerts,
  });

  const alerts = feed.data?.alerts ?? [];
  const unreadCount = alerts.filter((alert) => alert.readAt === null).length;

  // One line refreshes both readers of `["alerts"]`: this screen re-renders
  // from the cache, and so does the badge in the tab bar.
  const markRead = useMutation({
    mutationFn: (ids?: string[]) => markAlertsRead(ids),
    invalidate: [queryKeys.alerts()],
  });

  /** Pull-to-refresh, and the retry button behind a failed load. */
  async function refreshFeed() {
    await feed.refetch();
  }

  /** Marks everything read; the invalidation is what refreshes the views. */
  async function markAllRead() {
    const updated = await markRead.mutate(undefined);

    if (updated !== null) {
      haptics.light();
    }
  }

  /** Opens a single alert, linking through to its request when it has one. */
  async function openAlert(alert: Alert) {
    if (alert.readAt === null) {
      haptics.light();

      // Best-effort — the navigation below happens either way.
      await markRead.mutate([alert.id]);
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
            refreshing={feed.isRefreshing}
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
          isLoading={feed.isLoading}
          error={feed.error}
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
          onRetry={() => void refreshFeed()}
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