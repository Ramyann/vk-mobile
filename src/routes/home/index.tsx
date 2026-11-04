import {
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ContentCard } from "../../components/ContentCard";
import { FaqAccordion } from "../../components/FaqAccordion";
import { SectionHeading, TextAction } from "../../components/SectionHeader";
import { useExploreData } from "../../hooks/useExploreData";
import type { ContentItem, ContentType } from "../../api/content";
import { t, type AppLocale } from "../../i18n/locale";
import { webT } from "../../i18n/web";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { colors, radius } from "../../styles/tokens";

export function ExploreScreen({
  onOpen,
  onDiscover,
  onBrowse,
  onOpenMap,
  onPlanTrip,
  locale,
}: {
  onOpen: (item: ContentItem) => void;
  onDiscover: () => void;
  onBrowse: (type: ContentType) => void;
  onOpenMap: () => void;
  onPlanTrip: () => void;
  locale: AppLocale;
}) {
  const tw = webT(locale);
  const { data, loading, refreshing, error, refresh } = useExploreData(locale);
  if (loading) return <LoadingState label="Finding extraordinary places…" />;
  if (error && !data)
    return (
      <ErrorState
        detail="Check your connection and try again."
        onRetry={() => void refresh()}
      />
    );
  const hero = data?.hero;
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.greeting}>VISIT KURDISTAN</Text>
      <Text style={styles.title}>Find your next{`\n`}great story.</Text>
      <Pressable onPress={() => hero && onOpen(hero)} style={styles.hero}>
        {hero?.image ? (
          <ImageBackground
            source={{ uri: hero.image }}
            style={styles.heroImage}
            imageStyle={styles.heroImageStyle}
          />
        ) : (
          <View style={styles.heroFallback} />
        )}
        <View style={styles.scrim} />
        <View style={styles.heroContent}>
          <Text style={styles.heroEyebrow}>DISCOVER THE REGION</Text>
          <Text style={styles.heroTitle}>
            {hero?.title ?? "Kurdistan is calling"}
          </Text>
          <Text numberOfLines={2} style={styles.heroSubtitle}>
            {hero?.excerpt ||
              "Ancient cities, mountain roads and welcoming places await."}
          </Text>
          <View style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Explore now ↗</Text>
          </View>
        </View>
      </Pressable>
      <ContentRail
        heading={t(locale, "featuredDestinations")}
        eyebrow="Where to go"
        action={t(locale, "browseAll")}
        items={data?.destinations ?? []}
        empty="Destinations will appear here once added in the dashboard."
        onOpen={onOpen}
        onBrowse={() => onBrowse("destination")}
      />
      <Pressable
        accessibilityRole="button"
        onPress={onOpenMap}
        style={styles.mapBand}
      >
        <Text style={styles.mapBandEyebrow}>
          {tw("exploreMap.eyebrow").toUpperCase()}
        </Text>
        <Text style={styles.mapBandTitle}>
          {tw("destinations.mapCtaTitle")}
        </Text>
        <Text style={styles.mapBandBody}>
          {tw("destinations.mapCtaSubtitle")}
        </Text>
        <View style={styles.heroButton}>
          <Text style={styles.heroButtonText}>
            {tw("destinations.openMap")} ↗
          </Text>
        </View>
      </Pressable>
      <View style={styles.tinted}>
        <ContentRail
          heading={t(locale, "travelPackages")}
          eyebrow="Where to go"
          action={t(locale, "browseAll")}
          items={data?.packages ?? []}
          empty="Travel packages will appear here once added in the dashboard."
          onOpen={onOpen}
          onBrowse={() => onBrowse("package")}
        />
      </View>
      <ContentRail
        heading={t(locale, "events")}
        eyebrow="Plan your visit"
        action={t(locale, "allEvents")}
        items={data?.events ?? []}
        empty="There are no upcoming events right now."
        onOpen={onOpen}
        onBrowse={() => onBrowse("event")}
      />
      <View style={styles.tinted}>
        <ContentRail
          heading={t(locale, "stories")}
          eyebrow="Travel ideas"
          action={t(locale, "readMore")}
          items={data?.stories ?? []}
          empty="Fresh stories and guides will appear here."
          onOpen={onOpen}
          onBrowse={() => onBrowse("story")}
        />
      </View>
      {(data?.faqs.length ?? 0) > 0 ? (
        <View style={styles.section}>
          <SectionHeading
            eyebrow="Need to know"
            title="Frequently asked questions"
          />
          <FaqAccordion items={data?.faqs ?? []} />
        </View>
      ) : null}
      <View style={styles.limeCard}>
        <Text style={styles.limeOverline}>MAKE IT YOUR OWN</Text>
        <Text style={styles.limeTitle}>{tw("exploreMap.ctaTitle")}</Text>
        <Text style={styles.limeBody}>{tw("exploreMap.ctaSubtitle")}</Text>
        <View style={styles.pillRow}>
          <Pressable onPress={onPlanTrip} style={styles.darkPill}>
            <Text style={styles.darkPillText}>
              {tw("exploreMap.ctaPrimaryLabel")}
            </Text>
          </Pressable>
          <Pressable onPress={onDiscover} style={styles.outlinePill}>
            <Text style={styles.outlinePillText}>Start exploring</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

function ContentRail({
  heading,
  eyebrow,
  action,
  items,
  empty,
  onOpen,
  onBrowse,
}: {
  heading: string;
  eyebrow: string;
  action: string;
  items: ContentItem[];
  empty: string;
  onOpen: (item: ContentItem) => void;
  onBrowse: () => void;
}) {
  return (
    <View style={styles.section}>
      <SectionHeading
        eyebrow={eyebrow}
        title={heading}
        action={<TextAction label={action} onPress={onBrowse} />}
      />
      {items.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
        >
          {items.map((item) => (
            <ContentCard
              key={`${item.type}-${item.id}`}
              item={item}
              onPress={() => onOpen(item)}
            />
          ))}
        </ScrollView>
      ) : (
        <EmptyState title="Nothing here yet" detail={empty} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: { paddingBottom: 118 },
  greeting: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginHorizontal: 20,
    marginTop: 22,
  },
  title: {
    color: colors.dark,
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1.5,
    lineHeight: 41,
    marginHorizontal: 20,
    marginTop: 8,
  },
  hero: {
    borderRadius: radius.cardLarge,
    height: 440,
    margin: 20,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: { height: "100%", width: "100%" },
  heroImageStyle: { borderRadius: radius.cardLarge },
  heroFallback: {
    backgroundColor: colors.primary,
    height: "100%",
    width: "100%",
  },
  scrim: {
    backgroundColor: "rgba(20,20,20,0.34)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  heroContent: { bottom: 22, left: 22, position: "absolute", right: 22 },
  heroEyebrow: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.9,
    lineHeight: 35,
    marginTop: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  heroButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  heroButtonText: { color: colors.dark, fontSize: 14, fontWeight: "800" },
  section: { paddingHorizontal: 20, paddingVertical: 24 },
  tinted: { backgroundColor: colors.cream },
  rail: { paddingRight: 20 },
  limeCard: {
    backgroundColor: colors.lime,
    borderRadius: radius.cardLarge,
    marginHorizontal: 20,
    padding: 24,
  },
  limeOverline: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  limeTitle: {
    color: colors.dark,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 30,
    marginTop: 10,
  },
  limeBody: { color: colors.dark, fontSize: 14, lineHeight: 21, marginTop: 10 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 },
  darkPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  outlinePill: {
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  outlinePillText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  mapBand: {
    backgroundColor: colors.primary,
    borderRadius: radius.cardLarge,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 24,
  },
  mapBandEyebrow: {
    color: colors.lime,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  mapBandTitle: {
    color: colors.white,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.6,
    lineHeight: 30,
    marginTop: 8,
  },
  mapBandBody: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  darkPillText: { color: colors.white, fontSize: 14, fontWeight: "800" },
});
