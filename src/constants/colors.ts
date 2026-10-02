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
  primary: "#D7193F",
  dark: "#B71C1C",
  light: "#EF5350",
  glow: "rgba(215, 25, 63, 0.30)",
  ripple: "rgba(215, 25, 63, 0.35)",
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
