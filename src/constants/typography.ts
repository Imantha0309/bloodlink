import { Platform, type TextStyle } from "react-native";

/**
 * Type scale for BloodLink screens.
 *
 * Sizes are intentionally restrained: the reference design is dense, and the
 * largest element on screen is the screen title at 22pt.
 */
export const FontSize = {
  hero: 22,
  title: 18,
  cardTitle: 15.5,
  label: 13,
  body: 13.5,
  button: 15,
  small: 11.5,
  micro: 10,
  stat: 16,
} as const;

export const FontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  heavy: "800",
} as const;

/**
 * Android has no true `600` in many bundled system faces, so `600` is snapped
 * to `700` there. Everything else renders the weight as authored.
 */
function normalizeWeight(weight: string): TextStyle["fontWeight"] {
  const resolved = Platform.OS === "android" && weight === "600" ? "700" : weight;

  return resolved as TextStyle["fontWeight"];
}

export const Typography = {
  /** Screen title in the top header. */
  screenTitle: {
    fontSize: FontSize.hero,
    lineHeight: 28,
    fontWeight: normalizeWeight(FontWeight.bold),
    letterSpacing: -0.4,
  },

  /** Card heading, e.g. "Sign In to BloodLink". */
  cardTitle: {
    fontSize: FontSize.cardTitle,
    lineHeight: 21,
    fontWeight: normalizeWeight(FontWeight.bold),
    letterSpacing: -0.2,
  },

  /** Standalone page heading on placeholder / destination screens. */
  title: {
    fontSize: FontSize.title,
    lineHeight: 24,
    fontWeight: normalizeWeight(FontWeight.bold),
    letterSpacing: -0.2,
  },

  /** Form field labels. */
  label: {
    fontSize: FontSize.label,
    lineHeight: 18,
    fontWeight: normalizeWeight(FontWeight.semibold),
  },

  /** Running copy inside cards. */
  body: {
    fontSize: FontSize.body,
    lineHeight: 20,
    fontWeight: FontWeight.regular,
  },

  /** Input text. */
  input: {
    fontSize: FontSize.body,
    lineHeight: 20,
    fontWeight: FontWeight.medium,
  },

  /** Primary button text. */
  button: {
    fontSize: FontSize.button,
    lineHeight: 20,
    fontWeight: normalizeWeight(FontWeight.bold),
    letterSpacing: 0.1,
  },

  /** Helper / secondary copy. */
  small: {
    fontSize: FontSize.small,
    lineHeight: 16,
    fontWeight: FontWeight.regular,
  },

  /** Uppercase micro-labels and pills. */
  micro: {
    fontSize: FontSize.micro,
    lineHeight: 13,
    fontWeight: normalizeWeight(FontWeight.bold),
    letterSpacing: 0.4,
  },
} as const;