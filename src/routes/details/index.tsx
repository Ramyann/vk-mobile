import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { type ContentItem } from "../../api/content";
import { useContentDetail } from "../../hooks/useContentDetail";
import type { AppLocale } from "../../i18n/locale";
import { colors, radius } from "../../styles/tokens";
export function DetailScreen({
  item,
  saved,
  onBack,
  onToggleSaved,
  locale,
}: {
  item: ContentItem;
  saved: boolean;
  onBack: () => void;
  onToggleSaved: () => void;
  locale: AppLocale;
}) {
  const { detail, loading } = useContentDetail(item, locale);
  const display = detail ?? item;
  const mapUrl =
    detail?.latitude !== undefined && detail.longitude !== undefined
      ? `https://www.google.com/maps/search/?api=1&query=${detail.latitude},${detail.longitude}`
      : null;
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.media}>
        {display.image ? (
          <ImageBackground
            source={{ uri: display.image }}
            style={styles.image}
            imageStyle={styles.imageStyle}
          />
        ) : (
          <View style={styles.fallback} />
        )}
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={saved ? "Remove from saved" : "Save this place"}
          onPress={onToggleSaved}
          style={styles.save}
        >
          <Text style={styles.saveText}>{saved ? "♥" : "♡"}</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>{display.label || display.type}</Text>
        <Text style={styles.title}>{display.title}</Text>
        {display.date ? (
          <Text style={styles.date}>
            ◷{" "}
            {new Date(display.date).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        ) : null}
        {detail?.destination ? (
          <Text style={styles.destination}>⌖ {detail.destination}</Text>
        ) : null}
        <Text style={styles.intro}>
          {display.excerpt ||
            "Explore more about this remarkable part of Kurdistan."}
        </Text>
        <View style={styles.rule} />
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading full details…</Text>
          </View>
        ) : null}
        {detail?.body ? (
          <>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.text}>{detail.body}</Text>
          </>
        ) : null}
        {detail?.openingHours.length ? (
          <>
            <Text style={styles.sectionTitle}>Opening hours</Text>
            {detail.openingHours.map((hours) => (
              <Text key={hours} style={styles.hours}>
                {hours}
              </Text>
            ))}
          </>
        ) : null}
        {mapUrl ? (
          <Pressable
            onPress={() => void Linking.openURL(mapUrl)}
            style={styles.mapButton}
          >
            <Text style={styles.mapButtonText}>Open in Maps ↗</Text>
          </Pressable>
        ) : null}
        {detail?.links.map((entry) => (
          <Pressable
            key={entry.url}
            onPress={() => void Linking.openURL(entry.url)}
            style={styles.externalButton}
          >
            <Text style={styles.externalButtonText}>{entry.label} ↗</Text>
          </Pressable>
        ))}
        <Pressable style={styles.primaryButton} onPress={onToggleSaved}>
          <Text style={styles.primaryButtonText}>
            {saved ? "Saved to your journey" : "Save to your journey"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: { paddingBottom: 40 },
  media: { height: 380, position: "relative" },
  image: { height: "100%", width: "100%" },
  imageStyle: {
    borderBottomLeftRadius: radius.cardLarge,
    borderBottomRightRadius: radius.cardLarge,
  },
  fallback: { backgroundColor: colors.primary, height: "100%" },
  back: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    left: 20,
    position: "absolute",
    top: 20,
    width: 44,
  },
  save: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    position: "absolute",
    right: 20,
    top: 20,
    width: 44,
  },
  backText: { color: colors.primary, fontSize: 35, lineHeight: 37 },
  saveText: { color: colors.primary, fontSize: 23 },
  body: { padding: 20 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.dark,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.1,
    lineHeight: 39,
    marginTop: 8,
  },
  date: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
  },
  destination: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
  },
  intro: { color: colors.body, fontSize: 17, lineHeight: 26, marginTop: 20 },
  rule: { backgroundColor: colors.lime, height: 5, marginTop: 28, width: 52 },
  loading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  loadingText: { color: colors.body, fontSize: 14 },
  sectionTitle: {
    color: colors.dark,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 20,
  },
  text: { color: colors.body, fontSize: 15, lineHeight: 23, marginTop: 8 },
  hours: { color: colors.body, fontSize: 14, lineHeight: 21, marginTop: 5 },
  mapButton: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: 24,
    minHeight: 52,
  },
  mapButtonText: { color: colors.dark, fontSize: 15, fontWeight: "800" },
  externalButton: {
    alignItems: "center",
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 50,
  },
  externalButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 52,
    paddingHorizontal: 22,
  },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: "800" },
});
