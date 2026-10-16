import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdminHeader } from "@/components/admin/admin-header";
import { AsyncState } from "@/components/ui/async-state";
import { OptionChips } from "@/components/ui/option-chips";
import { SkeletonCard } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import { KeyboardDismissView } from "@/components/ui/keyboard-dismiss";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import {
  listUsers,
  setUserRole,
  setUserVerification,
  type AdminUser,
} from "@/services/admin/users";
import type { UserRole } from "@/services/auth/types";
import { initialsOf } from "@/utils/initials";
import { timeAgo } from "@/utils/time";

const ROLE_FILTERS = ["all", "recipient", "donor", "hospital", "admin"] as const;
type RoleFilter = (typeof ROLE_FILTERS)[number];

const ROLE_LABELS: Record<UserRole, string> = {
  recipient: "Recipient",
  donor: "Donor",
  hospital: "Hospital",
  admin: "Admin",
};

/**
 * Account administration.
 *
 * `ListUsers` matches no rows unless the caller holds the admin role, so a
 * non-admin who somehow lands here sees an empty list rather than other people's
 * accounts. Verification is the approval action that matters: `is_verified` is
 * the flag every staff-only operation gates on, so an unapproved hospital
 * cannot touch stock or patients.
 */
export default function AdminUsersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const selfUid = session?.user.id ?? null;

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search is committed on submit rather than per keystroke: a query per
  // character would be both wasteful and unreadable while it is typing.
  useEffect(() => {
    let cancelled = false;

    listUsers({ role: roleFilter === "all" ? null : roleFilter, search: appliedSearch })
      .then((data) => {
        if (!cancelled) {
          setUsers(data);
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
  }, [roleFilter, appliedSearch]);

  function retry() {
    setIsLoading(true);
    setError(null);

    listUsers({ role: roleFilter === "all" ? null : roleFilter, search: appliedSearch })
      .then((data) => {
        setUsers(data);
      })
      .catch((caught) => {
        setError(apiErrorMessage(caught));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function patchUser(uid: string, next: Partial<AdminUser>) {
    setUsers((current) =>
      (current ?? []).map((user) => (user.uid === uid ? { ...user, ...next } : user)),
    );
  }

  async function toggleVerification(user: AdminUser) {
    if (busyUid !== null) {
      return;
    }

    setBusyUid(user.uid);
    setActionError(null);

    try {
      const saved = await setUserVerification(user.uid, !user.isVerified);
      patchUser(user.uid, { isVerified: saved.isVerified });
    } catch (caught) {
      setActionError(apiErrorMessage(caught));
    } finally {
      setBusyUid(null);
    }
  }

  async function changeRole(user: AdminUser, role: UserRole) {
    if (busyUid !== null || role === user.role) {
      return;
    }

    setBusyUid(user.uid);
    setActionError(null);

    try {
      const saved = await setUserRole(user.uid, role);
      patchUser(user.uid, { role: saved.role });
    } catch (caught) {
      setActionError(apiErrorMessage(caught));
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <KeyboardDismissView style={styles.root}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AdminHeader
          subtitle="Account Administration"
          fullName={session?.user.fullName}
          onOpenProfile={() => router.push(ROUTES.adminProfile)}
        />

        <View style={styles.headingText}>
          <Text style={styles.title} accessibilityRole="header">
            Accounts
          </Text>

          <Text style={styles.subtitle}>
            Approve hospital accounts and reassign roles. Unverified hospitals cannot touch stock or
            patients.
          </Text>
        </View>

        <OptionChips
          label="Role"
          options={ROLE_FILTERS}
          value={roleFilter}
          onChange={(value) => {
            setRoleFilter(value);
            setIsLoading(true);
          }}
          labelFor={(value) => (value === "all" ? "All" : ROLE_LABELS[value])}
        />

        <TextField
          label="Search"
          value={search}
          onChangeText={setSearch}
          placeholder="Name, email or mobile"
          icon="search"
          returnKeyType="search"
          onSubmitEditing={() => {
            setAppliedSearch(search.trim());
          }}
          hint="Press return to search."
        />

        {actionError !== null ? (
          <View style={styles.actionError}>
            <Feather name="alert-triangle" size={13} color={Blood.primary} />
            <Text style={styles.actionErrorText}>{actionError}</Text>
          </View>
        ) : null}

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={(users ?? []).length === 0}
          emptyTitle="No accounts match"
          emptyMessage="Nothing here for this filter. Clear the search or pick another role."
          skeleton={
            <View style={styles.list}>
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
            </View>
          }
          onRetry={retry}
        >
          <View style={styles.list}>
            {(users ?? []).map((user) => {
              const isBusy = busyUid === user.uid;
              const isSelf = user.uid === selfUid;

              return (
                <View key={user.uid} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initialsOf(user.fullName)}</Text>
                    </View>

                    <View style={styles.cardText}>
                      <Text style={styles.name} numberOfLines={1}>
                        {user.fullName}
                        {isSelf ? " (you)" : ""}
                      </Text>

                      <Text style={styles.meta} numberOfLines={1}>
                        {[user.email, user.mobile].filter(Boolean).join(" · ") || "No contact on file"}
                      </Text>

                      <Text style={styles.meta} numberOfLines={1}>
                        {[
                          user.district,
                          user.bloodGroup,
                          user.registrationNumber
                            ? `Reg ${user.registrationNumber}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ") || "No district or group set"}{" "}
                        · joined {timeAgo(user.createdAt)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.roleRow}>
                      <View style={styles.rolePill}>
                        <Text style={styles.roleText}>{ROLE_LABELS[user.role]}</Text>
                      </View>

                      {isSelf ? (
                        <Text style={styles.selfNote}>You can&apos;t change your own role</Text>
                      ) : (
                        <View style={styles.rolePicker}>
                          {(["recipient", "donor", "hospital", "admin"] as const).map(
                            (role) => (
                              <Pressable
                                key={role}
                                accessibilityRole="radio"
                                accessibilityState={{ selected: user.role === role }}
                                accessibilityLabel={`Set ${user.fullName} to ${ROLE_LABELS[role]}`}
                                disabled={isBusy || user.role === role}
                                onPress={() => void changeRole(user, role)}
                                style={({ pressed }) => [
                                  styles.roleOption,
                                  user.role === role && styles.roleOptionSelected,
                                  pressed && styles.pressed,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.roleOptionText,
                                    user.role === role && styles.roleOptionTextSelected,
                                  ]}
                                >
                                  {ROLE_LABELS[role]}
                                </Text>
                              </Pressable>
                            ),
                          )}
                        </View>
                      )}
                    </View>

                    <Pressable
                      accessibilityRole="switch"
                      accessibilityState={{ checked: user.isVerified }}
                      accessibilityLabel={`${user.isVerified ? "Revoke" : "Approve"} ${user.fullName}`}
                      disabled={isBusy}
                      onPress={() => void toggleVerification(user)}
                      style={({ pressed }) => [
                        styles.verify,
                        user.isVerified && styles.verifyOn,
                        pressed && styles.pressed,
                      ]}
                    >
                      {isBusy ? (
                        <ActivityIndicator size="small" color={Surface.onPrimary} />
                      ) : (
                        <Feather
                          name={user.isVerified ? "check-circle" : "clock"}
                          size={13}
                          color={Surface.onPrimary}
                        />
                      )}

                      <Text style={styles.verifyText}>
                        {user.isVerified ? "Verified" : "Approve"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        </AsyncState>
      </ScrollView>
    </KeyboardDismissView>
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

  headingText: {
    gap: 3,
  },

  title: {
    ...Typography.title,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  actionError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 11,
    borderRadius: Radius.sm,
    backgroundColor: Surface.softRed,
  },

  actionErrorText: {
    flex: 1,
    ...Typography.small,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "600",
    color: Blood.primary,
  },

  list: {
    gap: 10,
  },

  card: {
    gap: 11,
    padding: 13,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
  },

  avatarText: {
    ...Typography.micro,
    color: Surface.text,
  },

  cardText: {
    flex: 1,
    gap: 1,
  },

  name: {
    ...Typography.label,
    fontSize: 13,
    color: Surface.text,
  },

  meta: {
    ...Typography.small,
    fontSize: 10.5,
    lineHeight: 15,
    color: Surface.textSecondary,
  },

  cardFooter: {
    gap: 9,
    paddingTop: 11,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
  },

  roleRow: {
    gap: 7,
  },

  rolePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Surface.iconWash,
  },

  roleText: {
    ...Typography.micro,
    fontSize: 9.5,
    letterSpacing: 0.1,
    color: Surface.text,
  },

  rolePicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  roleOption: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  roleOptionSelected: {
    backgroundColor: Surface.softRed,
    borderColor: Surface.softRedBorder,
  },

  roleOptionText: {
    ...Typography.micro,
    fontSize: 9.5,
    letterSpacing: 0.1,
    color: Surface.textSecondary,
  },

  roleOptionTextSelected: {
    color: Blood.primary,
  },

  selfNote: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textMuted,
  },

  verify: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 40,
    borderRadius: Radius.sm,
    backgroundColor: Surface.textSecondary,
  },

  verifyOn: {
    backgroundColor: Surface.online,
  },

  verifyText: {
    ...Typography.label,
    fontSize: 12,
    color: Surface.onPrimary,
  },

  pressed: {
    opacity: 0.7,
  },
});
