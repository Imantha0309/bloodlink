/**
 * BloodLink brand palette.
 */

export const Colors = {
  light: {
    text: "#18212D",
    background: "#FFFFFF",
    backgroundElement: "#F7F8F9",
    backgroundSelected: "#FFF0F3",
    textSecondary: "#737C88",
  },

  dark: {
    text: "#FFFFFF",
    background: "#121212",
    backgroundElement: "#242424",
    backgroundSelected: "#3A1017",
    textSecondary: "#B8B8B8",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Blood = {
  primary: "#C8102E",
  dark: "#B51224",
  light: "#E5566B",
  glow: "rgba(200, 16, 46, 0.30)",
  ripple: "rgba(200, 16, 46, 0.35)",
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;

/**
 * Neutral surface palette for application screens (splash excluded).
 *
 * Every value here is a plain token so the whole light UI can be re-themed by
 * editing this object. `Blood.primary` stays the single source of truth for
 * red, so accent colour is changed in exactly one place.
 */
export const Surface = {
  /** Page background — pale blue-grey. */
  background: "#F7F9FC",

  /** Raised cards and inputs. */
  card: "#FFFFFF",

  /** Hairline borders and dividers. */
  border: "#E4E8ED",

  /** Slightly stronger border, used for pressed / focused inputs. */
  borderStrong: "#D0D5DD",

  /** Primary readable text. */
  text: "#18212B",

  /** Supporting copy — labels, subtitles. */
  textSecondary: "#687586",

  /** Placeholders and decorative meta text. */
  textMuted: "#929AA6",

  /** Text on top of `Blood.primary`. */
  onPrimary: "#FFFFFF",

  /** Tinted red panel background (emergency card). */
  softRed: "#FFF0F1",

  /** Border for tinted red panels. */
  softRedBorder: "#FECDCA",

  /** Tinted green panel background (donor card). */
  softGreen: "#EAF8EF",

  /** Border for tinted green panels. */
  softGreenBorder: "#ABEFC6",

  /** Tinted blue panel background (hospital card, information cards). */
  softBlue: "#EAF2FF",

  /** Border for tinted blue panels. */
  softBlueBorder: "#C7D7FE",

  /** Low-emphasis icon wash (header back button, intro icon badge). */
  iconWash: "#F1F3F9",

  /** Water body inside the decorative map preview. */
  mapWater: "#8FD7E8",

  /** Secondary accent for informational iconography (quick actions, info cards). */
  accentBlue: "#4D73B8",

  /**
   * Readable green for text and pills on `softGreen`.
   *
   * `online` is the bright dot colour and is too light to read as text on a pale
   * green fill, so success copy uses this darker green instead.
   */
  successText: "#16834A",

  /** Destructive / validation messages. */
  danger: "#B51224",

  /** "Online now" dot on donor avatars. */
  online: "#12B76A",
} as const;

/**
 * Shadows are kept deliberately shallow — one subtle card shadow and one
 * button shadow, defined once so no screen invents its own.
 */
export const Elevation = {
  card: {
    shadowColor: "#101828",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  button: {
    shadowColor: Blood.primary,
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
} as const;