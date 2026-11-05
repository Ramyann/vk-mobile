import { StyleSheet } from "react-native";

/**
 * Gilroy, the website's typeface, bundled in assets/fonts. The keys are the
 * fonts' PostScript names, which is also how iOS and Android name them once
 * the expo-font plugin embeds them in a build.
 *
 * Arabic and Kurdish text has no Gilroy glyphs; the system Arabic font fills
 * them in, as on the website before its Arabic fallbacks load.
 */
export const fontFiles = {
  "Gilroy-Regular": require("../../assets/fonts/Gilroy-Regular.ttf"),
  "Gilroy-Medium": require("../../assets/fonts/Gilroy-Medium.ttf"),
  "Gilroy-SemiBold": require("../../assets/fonts/Gilroy-SemiBold.ttf"),
  "Gilroy-Bold": require("../../assets/fonts/Gilroy-Bold.ttf"),
};

export const fonts = {
  regular: "Gilroy-Regular",
  medium: "Gilroy-Medium",
  semibold: "Gilroy-SemiBold",
  bold: "Gilroy-Bold",
} as const;

/**
 * The redesign's 13 text styles. Each sets a weight through its font file,
 * never through fontWeight, which Android would ignore for a custom font.
 */
export const type = StyleSheet.create({
  /** Display/Hero: Home hero headline. */
  hero: { fontFamily: fonts.bold, fontSize: 36, lineHeight: 43 },
  /** Display/Title: screen titles, destination names on photos. */
  title: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 38 },
  /** Heading/Section: section headings, the wordmark. */
  section: { fontFamily: fonts.bold, fontSize: 24, lineHeight: 29 },
  /** Heading/Item: card and list titles. */
  item: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 24 },
  /** Body/Large: lead paragraphs. */
  bodyLarge: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 27 },
  /** Body/Default: paragraphs. */
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  /** Body/Strong: emphasised body, row labels. */
  bodyStrong: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24 },
  /** Text/Small: meta lines. */
  small: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  /** Text/Small strong: chips, field labels. */
  smallStrong: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  /** Text/Caption: categories, dates, fine print. */
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 20 },
  /** Label/Button. */
  button: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24 },
  /** Label/Tab: tab bar labels. */
  tab: { fontFamily: fonts.medium, fontSize: 11, lineHeight: 14 },
  /** Date/Numeral: the day number in date blocks. */
  numeral: { fontFamily: fonts.bold, fontSize: 32, lineHeight: 32 },
});
