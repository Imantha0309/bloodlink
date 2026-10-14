import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import { initialsOf } from "@/utils/initials";

type AdminHeaderProps = {
  /** Line under the brand, e.g. "National Blood Registry". */
  subtitle: string;
  /** Full name of the signed-in administrator; falls back to "Admin". */
  fullName?: string | null;
};

/**
 * Brand header for the administrator area.
 *
 * Mirrors `HospitalHeader` minus the avatar link: an admin has no staff profile
 * screen to open, so the monogram is presentational here rather than a
 * navigation target.
 */
export function AdminHeader({ subtitle, fullName }: AdminHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Feather name="shield" size={18} color={Surface.onPrimary} />
        </View>

        <View style={styles.brandText}>
          <Text style={styles.brandName}>BloodLink</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initialsOf(fullName ?? "Admin")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  brand: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logo: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  brandText: {
    flex: 1,
    gap: 1,
  },

  brandName: {
    ...Typography.cardTitle,
    color: Blood.primary,
    letterSpacing: -0.4,
  },

  subtitle: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textSecondary,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  avatarText: {
    ...Typography.micro,
    color: Surface.text,
  },
});
