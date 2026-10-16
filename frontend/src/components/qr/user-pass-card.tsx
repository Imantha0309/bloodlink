/**
 * The identity pass shown on a user's own profile.
 *
 * Owns issuing the pass, keeping it fresh, and the manual-code escape hatch for
 * a broken camera. The caller only decides where the card sits; everything about
 * the QR's lifecycle lives here so no profile screen has to reimplement it.
 *
 * The pass is fetched on mount and rotated only when it is missing or stale, so
 * simply opening a profile does not invalidate the code a colleague may already
 * have scanned.
 */

import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROLE_NAME } from "@/constants/roles";
import { Typography } from "@/constants/typography";
import { apiErrorMessage } from "@/services/auth";
import {
  getOrCreateMyPass,
  isPassExpired,
  rotateMyPass,
  type IdentityPass,
} from "@/services/auth/pass-service";
import { haptics } from "@/utils/haptics";
import { initialsOf } from "@/utils/initials";

/** Seconds until the pass lapses, for the countdown line. */
function secondsLeft(expiresAt: string, now: number): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
}

function expiryLabel(seconds: number): string {
  if (seconds <= 0) {
    return "Expired — rotate to get a new code";
  }

  const days = Math.floor(seconds / 86_400);

  if (days >= 1) {
    return days === 1 ? "Valid for 1 more day" : `Valid for ${days} more days`;
  }

  const hours = Math.floor(seconds / 3_600);

  return hours >= 1 ? `Valid for ${hours} more hours` : "Valid for under an hour";
}

/** Ticks the expiry line once a minute rather than once a second. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return;
    }

    const timer = setInterval(() => setNow(Date.now()), 60_000);

    return () => clearInterval(timer);
  }, [active]);

  return now;
}

type UserPassCardProps = {
  fullName: string | null | undefined;
  role: "recipient" | "donor" | "hospital" | "admin";
  /** Shown under the name — district, blood group, station. */
  subtitle?: string | null;
  /** Seeded from a previous fetch so the QR paints before the network settles. */
  initialPass?: IdentityPass | null;
  onPassChange?: (pass: IdentityPass) => void;
};

export function UserPassCard({
  fullName,
  role,
  subtitle = null,
  initialPass = null,
  onPassChange,
}: UserPassCardProps) {
  const [pass, setPass] = useState<IdentityPass | null>(initialPass);
  const [isRotating, setIsRotating] = useState(false);
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  // Only issues when there is nothing usable to show. Nothing is set
  // synchronously here — state lands after the await, so the card paints its
  // placeholder instead of cascading through a loading flag first.
  useEffect(() => {
    if (initialPass !== null && !isPassExpired(initialPass.expiresAt)) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const next = await getOrCreateMyPass(initialPass);

        if (cancelled || !mounted.current) {
          return;
        }

        setPass(next);
        onPassChange?.(next);
      } catch (caught) {
        if (!cancelled && mounted.current) {
          setError(apiErrorMessage(caught));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialPass, onPassChange]);

  // Explicit rotation is an event rather than an effect, so it may set state up
  // front: the button has to show that it is working straight away.
  async function handleRotate() {
    if (isRotating) {
      return;
    }

    setIsRotating(true);
    setError(null);

    try {
      const next = await rotateMyPass();

      if (!mounted.current) {
        return;
      }

      setPass(next);
      onPassChange?.(next);
      haptics.success();
    } catch (caught) {
      if (mounted.current) {
        setError(apiErrorMessage(caught));
      }
    } finally {
      if (mounted.current) {
        setIsRotating(false);
      }
    }
  }

  const now = useNow(pass !== null);
  const seconds = pass === null ? 0 : secondsLeft(pass.expiresAt, now);
  const isExpired = pass !== null && seconds <= 0;
  // No pass and no error means the first fetch is still in flight.
  const isLoading = pass === null && error === null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headIcon}>
          <Feather name="award" size={18} color={Blood.primary} />
        </View>

        <View style={styles.headText}>
          <Text style={styles.title}>My pass</Text>
          <Text style={styles.subtitle}>
            Show this at any BloodLink desk to confirm who you are.
          </Text>
        </View>
      </View>

      <View style={styles.identity}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initialsOf(fullName)}</Text>
        </View>

        <View style={styles.identityText}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName ?? "Signed in"}
          </Text>

          <Text style={styles.meta} numberOfLines={1}>
            {ROLE_NAME[role]}
            {subtitle === null || subtitle === "" ? "" : ` · ${subtitle}`}
          </Text>
        </View>
      </View>

      <View style={styles.qrFrame}>
        {pass === null ? (
          <View style={styles.qrPlaceholder}>
            {isLoading ? (
              <ActivityIndicator color={Blood.primary} />
            ) : (
              <Feather name="wifi-off" size={26} color={Surface.textMuted} />
            )}

            <Text style={styles.qrPlaceholderText}>
              {isLoading ? "Creating your pass…" : "Your pass is unavailable"}
            </Text>
          </View>
        ) : (
          <View
            style={styles.qr}
            accessible
            accessibilityRole="image"
            accessibilityLabel={`Identity pass for ${fullName ?? "this account"}`}
          >
            <QRCode
              value={pass.payload}
              size={196}
              color={Surface.text}
              backgroundColor="#FFFFFF"
              ecl="M"
            />
          </View>
        )}
      </View>

      {pass !== null ? (
        <View style={styles.expiryRow}>
          <Feather
            name={isExpired ? "alert-circle" : "clock"}
            size={13}
            color={isExpired ? Blood.primary : Surface.textSecondary}
          />

          <Text style={[styles.expiryText, isExpired && styles.expiryTextExpired]}>
            {expiryLabel(seconds)}
          </Text>
        </View>
      ) : null}

      {/* The QR is the primary way in, but a camera that cannot focus, a
          scratched screen or a dim ward leaves the person holding the phone
          with nothing. Exposing the payload as selectable text makes the pass
          readable out loud, which is what the desk actually does when the
          camera gives up. */}
      {pass !== null ? (
        <View style={styles.disclosure}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Show pass code"
            accessibilityHint="Reveals the payload so it can be read or typed in"
            accessibilityState={{ expanded: isCodeVisible }}
            onPress={() => {
              haptics.light();
              setIsCodeVisible((current) => !current);
            }}
            style={({ pressed }) => [styles.disclosureToggle, pressed && styles.pressed]}
          >
            <Feather name={isCodeVisible ? "eye-off" : "eye"} size={14} color={Blood.primary} />
            <Text style={styles.disclosureToggleText}>
              {isCodeVisible ? "Hide pass code" : "Show pass code"}
            </Text>
          </Pressable>

          {isCodeVisible ? (
            <Text style={styles.code} selectable accessibilityLabel="Pass code">
              {pass.payload}
            </Text>
          ) : null}
        </View>
      ) : null}

      {error !== null ? (
        <View style={styles.error} accessibilityLiveRegion="polite">
          <Feather name="alert-triangle" size={14} color={Blood.primary} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Rotate pass"
        accessibilityHint="Creates a new code and retires the current one"
        accessibilityState={{ disabled: isRotating }}
        disabled={isRotating}
        onPress={() => {
          haptics.medium();
          void handleRotate();
        }}
        style={({ pressed }) => [
          styles.secondary,
          pressed && styles.pressed,
          isRotating && styles.secondaryDisabled,
        ]}
      >
        <Feather name="refresh-cw" size={15} color={Blood.primary} />
        <Text style={styles.secondaryText}>
          {isRotating ? "Rotating…" : "Rotate pass"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 16,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  head: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  headIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  headText: {
    flex: 1,
    gap: 2,
  },

  title: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  identity: {
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
    borderWidth: 1,
    borderColor: Surface.border,
  },

  avatarText: {
    ...Typography.label,
    fontWeight: "700",
    color: Surface.text,
  },

  identityText: {
    flex: 1,
    gap: 2,
  },

  name: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  meta: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  qrFrame: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: Radius.field,
    backgroundColor: Surface.background,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  qr: {
    padding: 12,
    borderRadius: Radius.sm,
    backgroundColor: "#FFFFFF",
  },

  qrPlaceholder: {
    alignItems: "center",
    gap: 10,
    minHeight: 120,
    justifyContent: "center",
  },

  qrPlaceholderText: {
    ...Typography.small,
    color: Surface.textMuted,
  },

  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  expiryText: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  expiryTextExpired: {
    fontWeight: "600",
    color: Blood.primary,
  },

  /* ------------------------------- show code ------------------------------- */

  disclosure: {
    gap: 8,
  },

  disclosureToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 30,
  },

  disclosureToggleText: {
    ...Typography.small,
    fontWeight: "600",
    color: Blood.primary,
  },

  code: {
    ...Typography.micro,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Surface.iconWash,
    borderWidth: 1,
    borderColor: Surface.border,
    color: Surface.text,
    lineHeight: 15,
  },

  error: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  errorText: {
    flex: 1,
    ...Typography.small,
    fontWeight: "600",
    color: Blood.primary,
  },

  secondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 46,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
    ...Elevation.button,
  },

  secondaryDisabled: {
    opacity: 0.6,
  },

  secondaryText: {
    ...Typography.small,
    fontWeight: "700",
    color: Blood.primary,
  },

  pressed: {
    opacity: 0.75,
  },
});
