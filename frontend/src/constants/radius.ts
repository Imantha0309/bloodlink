/**
 * Corner radius scale. Cards use `card`, inputs use `field`, buttons use
 * `button`, and pills use `pill`.
 */
export const Radius = {
  /** Circular elements: avatar, icon badge, icon button. */
  full: 999,

  /** Large rounded panels — intro card, donor card. */
  card: 18,

  /** Form inputs and the sign-in button. */
  field: 14,

  /** Small elements — badges, error chips. */
  sm: 10,

  /** Fully rounded pills — "Zero Login". */
  pill: 999,

  /** Back button hit area is square with a circular visual inside. */
  iconButton: 14,
} as const;

/**
 * Minimum accessible touch target. Anything interactive must be at least this
 * tall and this wide even when its visual box is smaller.
 */
export const HIT_SLOP_MIN = 44;

/** Standard control heights, shared so inputs and buttons stay aligned. */
export const ControlHeight = {
  input: 52,
  button: 54,
  iconButton: 44,
} as const;