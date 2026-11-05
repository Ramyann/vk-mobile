import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ContentItem, ContentType } from "../api/content";
import type { AppLocale } from "../i18n/locale";
import { shortDate } from "../lib/dates";
import { colors, radius } from "../styles/tokens";
import { type } from "../styles/typography";

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  destination: "Destination",
  place: "Place",
  event: "Event",
  package: "Package",
  story: "Story",
};

const TO: Record<AppLocale, string> = { en: "to", ar: "إلى", ckb: "تا" };

/** The meta line under a title: an event's dates, otherwise its category. */
export function metaLine(item: ContentItem, locale: AppLocale): string {
  if (item.type === "event" && item.date) {
    const from = shortDate(item.date, locale);
    const to = item.endDate ? shortDate(item.endDate, locale) : "";
    return to && to !== from ? `${from} ${TO[locale]} ${to}` : from;
  }
  if (item.type === "destination") return "";
  return item.label ?? "";
}

/**
 * A content item in one of the redesign's two shapes:
 * "list" is the Discover and Saved row (76pt photo, type, title, meta);
 * "rail" is the photo-over-title card used in horizontal rails.
 */
export function ContentCard({
  item,
  variant = "rail",
  locale = "en",
  divider = false,
  trailing,
  onPress,
}: {
  item: ContentItem;
  variant?: "rail" | "list";
  locale?: AppLocale;
  /** Draw the hairline above this row (every row but the first). */
  divider?: boolean;
  /** An action at the row's end, e.g. Saved's heart. */
  trailing?: ReactNode;
  onPress: () => void;
}) {
  if (variant === "list") {
    const meta = metaLine(item, locale);
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          divider && styles.divider,
          pressed && styles.rowPressed,
        ]}
      >
        <Thumb uri={item.image} style={styles.rowImage} />
        <View style={styles.rowCopy}>
          <Text style={styles.typeLabel}>{CONTENT_TYPE_LABEL[item.type]}</Text>
          <Text numberOfLines={2} style={styles.title}>
            {item.title}
          </Text>
          {meta ? (
            <Text numberOfLines={1} style={styles.meta}>
              {meta}
            </Text>
          ) : null}
        </View>
        {trailing}
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Thumb uri={item.image} style={styles.cardImage} />
      <Text numberOfLines={2} style={styles.title}>
        {item.title}
      </Text>
    </Pressable>
  );
}

function Thumb({ uri, style }: { uri: string | null; style: object }) {
  return uri ? (
    <Image source={{ uri }} style={[styles.imageBase, style]} />
  ) : (
    <View style={[styles.imageBase, styles.imageFallback, style]} />
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    paddingVertical: 12,
  },
  divider: { borderTopColor: colors.border, borderTopWidth: 1 },
  rowPressed: { backgroundColor: colors.soft },
  rowImage: { borderRadius: radius.thumb, height: 76, width: 76 },
  rowCopy: { flex: 1, gap: 3 },
  typeLabel: { ...type.caption, color: colors.primary },
  title: { ...type.item, color: colors.dark },
  meta: { ...type.small, color: colors.muted },
  card: { gap: 10, width: 236 },
  pressed: { opacity: 0.85 },
  cardImage: { borderRadius: radius.media, height: 168, width: 236 },
  imageBase: { backgroundColor: colors.soft },
  imageFallback: { backgroundColor: colors.primaryTint },
});
