import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROLE_NAME } from "@/constants/roles";
import { Typography } from "@/constants/typography";
import { MOCK_CREDENTIAL_HINT, hasRemoteApi } from "@/services/auth";

type DevCredentialsHintProps = {
  /** Fills the sign-in form with the chosen account. */
  onPick: (identifier: string, password: string) => void;
};

/**
 * Collapsible list of demo accounts, shown in development builds only.
 *
 * Both adapters ship the same four fixtures — the mock holds them in memory and
 * the server seeds them — so the same list is correct whether or not
 * `EXPO_PUBLIC_API_URL` is set. Collapsed by default so the sign-in screen
 * still reads as the production one.
 *
 * IMPORTANT: Only show when using mock auth (no backend configured).
 * When hasRemoteApi is true, real authentication is active and demo
 * credentials should not be displayed.
 */
export function DevCredentialsHint({ onPick }: DevCredentialsHintProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in dev builds AND when no backend API is configured.
  // When a real backend is available, use actual credentials.
  if (!__DEV__ || hasRemoteApi) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setIsOpen((previous) => !previous)}
        accessibilityRole="button"
        accessibilityLabel={isOpen ? "Hide dev credentials" : "Show dev credentials"}
        accessibilityState={{ expanded: isOpen }}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <Feather name="terminal" size={13} color={Blood.dark} />

        <Text style={styles.headerText}>Dev credentials</Text>

        <View style={styles.spacer} />

        <Feather name={isOpen ? "chevron-up" : "chevron-down"} size={15} color={Surface.textMuted} />
      </Pressable>

      {isOpen ? (
        <View style={styles.list}>
          {MOCK_CREDENTIAL_HINT.map((account) => (
            <Pressable
              key={account.identifier}
              onPress={() => onPick(account.identifier, account.password)}
              accessibilityRole="button"
              accessibilityLabel={`Use the ${ROLE_NAME[account.role]} demo account, ${account.identifier}`}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.role}>
                <Text style={styles.roleText}>{ROLE_NAME[account.role]}</Text>
              </View>

              <View style={styles.credentials}>
                <Text style={styles.identifier} numberOfLines={1}>
                  {account.identifier}
                </Text>

                <Text style={styles.password} numberOfLines={1}>
                  {account.password}
                </Text>
              </View>

              <Feather name="arrow-up-left" size={13} color={Surface.textMuted} />
            </Pressable>
          ))}

          <Text style={styles.footnote}>Tap an account to fill the form.</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.field,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Surface.borderStrong,
    backgroundColor: Surface.card,
    overflow: "hidden",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
  },

  pressed: {
    opacity: 0.6,
  },

  headerText: {
    ...Typography.label,
    color: Blood.dark,
  },

  spacer: {
    flex: 1,
  },

  list: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 6,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    backgroundColor: Surface.background,
  },

  rowPressed: {
    backgroundColor: Surface.softRed,
  },

  role: {
    minWidth: 84,
  },

  roleText: {
    ...Typography.micro,
    color: Surface.textMuted,
  },

  credentials: {
    flex: 1,
    gap: 1,
  },

  identifier: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.text,
  },

  password: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textSecondary,
  },

  footnote: {
    ...Typography.small,
    fontSize: 10,
    color: Surface.textMuted,
    paddingTop: 2,
  },
});
