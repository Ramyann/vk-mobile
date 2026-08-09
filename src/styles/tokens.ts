/**
 * Visit Kurdistan's mobile tokens, carried over from the 2026 website redesign.
 * The app deliberately uses the same deep purple, ivory cream, lime accents,
 * rounded cards and generous editorial spacing as the public website.
 */
export const colors = {
  primary: "#36196D",
  cream: "#FFFDEB",
  lime: "#EDFF81",
  teal: "#005E53",
  dark: "#141414",
  body: "#5C5C5C",
  soft: "#F5F5F5",
  border: "#E8E8E8",
  white: "#FFFFFF",
  muted: "#A3A3A3",
  danger: "#CC1D2C",
} as const;

export const radius = {
  pill: 999,
  card: 28,
  cardLarge: 36,
  input: 18,
} as const;

/** Shared elevation for floating navigation and the raised assistant action. */
export const shadows = {
  dock: {
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 14,
  },
  floatingAction: {
    elevation: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 13,
  },
} as const;
