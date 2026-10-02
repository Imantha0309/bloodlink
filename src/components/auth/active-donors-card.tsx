import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import {
  formatDonorCount,
  formatProvinces,
  getActiveDonors,
  type ActiveDonorsSummary,
} from "@/services/donors/active-donors";

type ActiveDonorsCardProps = {
  /**
   * Injectable for tests and previews. When omitted the card resolves its own
   * data through the isolated donors data source.
   */
  summary?: ActiveDonorsSummary;
};

/** Height reserved while loading so the card never shifts the layout. */
const RESERVED_HEIGHT = 66;

/**
 * "12,480+ Active Donors Online" reassurance card.
 *
 * Kept out of LoginScreen and fed by `@/services/donors/active-donors`, so the
 * screen never learns where the numbers come from. Avatars are monograms
 * rather than real donor photos — no photo assets exist, and inventing them
 * would misrepresent real people.
 */
export function ActiveDonorsCard({ summary }: ActiveDonorsCardProps) {
  const [data, setData] = useState<ActiveDonorsSummary | null>(summary ?? null);

  useEffect(() => {
    if (summary) {
      return;
    }

    let isActive = true;

    void getActiveDonors().then((result) => {
      if (isActive) {
        setData(result);
      }
    });

    return () => {
      isActive = false;
    };
  }, [summary]);

  const isLoading = data === null;

  return (
    <View style={[styles.card, isLoading && styles.cardLoading]} accessibilityRole="summary">
      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={Surface.textMuted} />
        </View>
      ) : (
        <>
          <View style={styles.avatars}>
            {data.avatarInitials.slice(0, 4).map((initials, index) => (
              <View
                key={initials}
                style={[
                  styles.avatar,
                  index > 0 && styles.avatarOverlap,
                  index % 2 === 1 && styles.avatarAlt,
                ]}
              >
                <Text style={styles.initials}>{initials}</Text>

                <View style={styles.onlineDot} />
              </View>
            ))}
          </View>

          <View style={styles.copy}>
            <Text style={styles.headline}>
              {formatDonorCount(data.total)} Active Donors Online
            </Text>

            <Text style={styles.subtitle}>{formatProvinces(data.provinces)}</Text>
          </View>

          <Feather name="users" size={18} color={Blood.light} />
        </>
      )}
    </View>
  );
}

const AVATAR_SIZE = 32;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: RESERVED_HEIGHT,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: Surface.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  cardLoading: {
    justifyContent: "center",
  },

  loader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.full,
    backgroundColor: Surface.softRed,
    alignItems: "center",
    justifyContent: "center",
    // White ring separates overlapping circles.
    borderWidth: 2,
    borderColor: Surface.card,
  },

  /** Pulls each circle left so they overlap like the reference. */
  avatarOverlap: {
    marginLeft: -11,
  },

  /** Neutral tone alternating with the red, to keep overlapping circles
      individually readable without introducing another hue. */
  avatarAlt: {
    backgroundColor: Surface.iconWash,
  },

  initials: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    color: Blood.dark,
  },

  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    backgroundColor: Surface.online,
    borderWidth: 2,
    borderColor: Surface.card,
  },

  copy: {
    flex: 1,
    gap: 2,
  },

  headline: {
    ...Typography.label,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.small,
    fontSize: 11,
    color: Surface.textSecondary,
  },
});