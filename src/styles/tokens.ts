/**
 * Visit Kurdistan's mobile tokens, from the "VK colour" variables in the
 * 2026 app redesign (Figma "Visit Kurdistan app redesign 2026", Foundations).
 * The brand colours are the website's; the greys and surfaces are the app's.
 */
export const colors = {
  /** brand/purple: primary actions, links, active states. */
  primary: "#36196D",
  primaryPressed: "#2A1356",
  /** brand/purple-tint: pressed quiet and secondary buttons, selected rows. */
  primaryTint: "#F0ECF6",
  lime: "#EDFF81",
  limePressed: "#DCEE6A",
  cream: "#FFFDEB",
  /** state/success, also the website's teal. */
  teal: "#005E53",
  /** ink/strong: headings and primary text. */
  dark: "#141414",
  /** ink/body: paragraphs. */
  body: "#4A4A4A",
  /** ink/muted: meta lines, placeholders, inactive tabs. */
  muted: "#6B6B6B",
  white: "#FFFFFF",
  /** surface/sunken: inputs, search fields, assistant replies. */
  soft: "#F6F5F0",
  /** line/default: dividers, outlines, chip borders. */
  border: "#E7E4D8",
  danger: "#CC1D2C",
  mapLand: "#F2EDD8",
  mapOutside: "#E9E7E0",
} as const;

export const radius = {
  pill: 999,
  /** Photo cards in rails (destinations). */
  card: 24,
  /** Cream and lime panels (map card, assistant replies). */
  panel: 28,
  /** Photos inside a card or a list (stories, packages, place hero). */
  media: 20,
  /** Small thumbnails in lists. */
  thumb: 14,
  input: 16,
} as const;

/** The 20pt page gutter every screen uses. */
export const gutter = 20;

/**
 * Space between the status bar (or the top of the window) and a screen's
 * first row: its header, title or the controls floating on a photo.
 */
export const topSpace = 16;

/** Shared elevation, kept for sheets and floating map controls. */
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
