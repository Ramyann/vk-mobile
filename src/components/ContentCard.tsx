import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ContentItem } from "../api/content";
import { colors, radius } from "../styles/tokens";

export function ContentCard({
  item,
  variant = "rail",
  onPress,
}: {
  item: ContentItem;
  variant?: "rail" | "list";
  onPress: () => void;
}) {
  const compact = variant === "list";
  const cardVariants = {
    destination: styles.destinationCard,
    place: styles.placeCard,
    event: styles.eventCard,
    package: styles.packageCard,
    story: styles.storyCard,
  };
  const imageVariants = {
    destination: styles.destinationImage,
    place: styles.placeImage,
    event: styles.eventImage,
    package: styles.packageImage,
    story: styles.storyImage,
  };
  const showsExcerpt =
    !compact && (item.type === "destination" || item.type === "story");
  const dateLabel = item.date
    ? new Date(item.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : item.type === "package"
      ? "TBA"
      : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.listCard,
        !compact && cardVariants[item.type],
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.imageWrap,
          compact && styles.listImageWrap,
          !compact && imageVariants[item.type],
        ]}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.imageFallbackText}>VK</Text>
          </View>
        )}
        <View style={styles.cardArrow}>
          <Text style={styles.cardArrowText}>↗</Text>
        </View>
        {dateLabel && (item.type === "event" || item.type === "package") ? (
          <View style={styles.dateBadge}>
            <Text style={styles.dateBadgeText}>{dateLabel}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardCopy}>
        {item.label ? (
          <Text numberOfLines={1} style={styles.cardLabel}>
            {item.label}
          </Text>
        ) : null}
        <Text numberOfLines={compact ? 2 : 3} style={styles.cardTitle}>
          {item.title}
        </Text>
        {(compact || showsExcerpt) && item.excerpt ? (
          <Text numberOfLines={compact ? 2 : 3} style={styles.cardExcerpt}>
            {item.excerpt}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 226,
    overflow: "hidden",
    borderRadius: radius.card,
    backgroundColor: colors.white,
    marginRight: 14,
  },
  destinationCard: { width: 286 },
  placeCard: { width: 206 },
  eventCard: { backgroundColor: colors.cream, width: 234 },
  packageCard: { backgroundColor: colors.soft, width: 244 },
  storyCard: { width: 250 },
  listCard: {
    width: "100%",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    marginRight: 0,
    padding: 8,
    borderRadius: 22,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  imageWrap: {
    height: 248,
    backgroundColor: colors.primary,
    overflow: "hidden",
    position: "relative",
  },
  destinationImage: { height: 268 },
  placeImage: { height: 216 },
  eventImage: { height: 176 },
  packageImage: { height: 192 },
  storyImage: { height: 230 },
  listImageWrap: { height: 112, width: 112, flexShrink: 0, borderRadius: 16 },
  image: { height: "100%", width: "100%" },
  imageFallback: {
    alignItems: "center",
    backgroundColor: colors.primary,
    flex: 1,
    justifyContent: "center",
  },
  imageFallbackText: { color: colors.lime, fontSize: 26, fontWeight: "900" },
  cardArrow: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    width: 42,
  },
  cardArrowText: { color: colors.dark, fontSize: 21, fontWeight: "600" },
  dateBadge: {
    backgroundColor: colors.white,
    borderRadius: 14,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: "absolute",
    top: 12,
  },
  dateBadgeText: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  cardCopy: { flex: 1, padding: 14 },
  cardLabel: {
    color: colors.body,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 5,
    textTransform: "capitalize",
  },
  cardTitle: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  cardExcerpt: {
    color: colors.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
});
