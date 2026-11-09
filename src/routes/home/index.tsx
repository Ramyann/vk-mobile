import { useState } from "react";
import {
  Image,
  ImageBackground,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Text } from "../../components/ui/Text";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SectionHeading, TextAction } from "../../components/SectionHeader";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";
import { useExploreData } from "../../hooks/useExploreData";
import type { ContentItem, ContentType, HeroBanner } from "../../api/content";
import { t, isRtl, type AppLocale } from "../../i18n/locale";
import { webT } from "../../i18n/web";
import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { dateBlock, untilLabel } from "../../lib/dates";
import { formatNumber } from "../../lib/localized";
import { colors, gutter, radius, topSpace } from "../../styles/tokens";
import { fonts, type } from "../../styles/typography";
import { useTabBarSpace } from "../../components/ui/TabBar";
import { ta } from "../../i18n/app-messages";
import { Rail } from "../../components/ui/Rail";

const HERO_HEIGHT = 560;
/** The square-ish photos in the plan card's route preview. */
const ROUTE_PHOTO = 92;
/** Height over width of the exported map illustration (305 x 287 in Figma). */
const MAP_ART_RATIO = 287 / 305;

const OF: Record<AppLocale, string> = { en: "of", ar: "من", ckb: "لە" };

/** Website pages a hero banner can point at, and the app list that shows them. */
const BANNER_ROUTES: Array<[RegExp, ContentType]> = [
  [/\/packages\/?$/, "package"],
  [/\/events\/?$/, "event"],
  [/\/destinations\/?$/, "destination"],
  [/\/stories\/?$/, "story"],
  [/\/(places|things-to-do)\/?$/, "place"],
];

export function ExploreScreen({
  onOpen,
  onBrowse,
  onOpenMap,
  onPlanTrip,
  onSearch,
  locale,
}: {
  onOpen: (item: ContentItem) => void;
  onDiscover: () => void;
  onBrowse: (type: ContentType) => void;
  onOpenMap: () => void;
  onPlanTrip: () => void;
  onSearch: () => void;
  locale: AppLocale;
}) {
  const tw = webT(locale);
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const { width } = useWindowDimensions();
  // The card's inner width: the page gutter and the card's own padding.
  const mapArtWidth = width - gutter * 2 - 48;
  const { data, loading, refreshing, error, refresh } = useExploreData(locale);
  // Past the hero, the page is white under the status bar, so it turns dark.
  const [pastHero, setPastHero] = useState(false);
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = event.nativeEvent.contentOffset.y > HERO_HEIGHT - insets.top;
    if (next !== pastHero) setPastHero(next);
  };
  if (loading || (error && !data))
    return (
      <View style={[styles.page, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        {loading ? (
          <LoadingState label={ta(locale, "loading")} />
        ) : (
          <ErrorState
            locale={locale}
            detail={t(locale, "connectionError")}
            onRetry={() => void refresh()}
          />
        )}
      </View>
    );

  const openBanner = (banner: HeroBanner) => {
    const route = BANNER_ROUTES.find(([pattern]) => pattern.test(banner.url));
    if (route) onBrowse(route[1]);
    else if (banner.url) void Linking.openURL(banner.url);
  };

  return (
    <View style={styles.page}>
      <StatusBar style={pastHero ? "dark" : "light"} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarSpace }}
        onScroll={onScroll}
        scrollEventThrottle={32}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.white}
            progressViewOffset={insets.top}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Hero
          banners={data?.heroes ?? []}
          locale={locale}
          topInset={insets.top}
          onSearch={onSearch}
          onOpenBanner={openBanner}
        />

        <View style={styles.whereToGo}>
          <SectionHeading
            inset
            title={t(locale, "whereToGo")}
            action={
              <TextAction
                label={t(locale, "browseAll")}
                onPress={() => onBrowse("destination")}
              />
            }
          />
          {data?.destinations.length ? (
            <Rail contentContainerStyle={styles.rail}>
              {data.destinations.map((item) => (
                <DestinationCard
                  key={item.id}
                  item={item}
                  onPress={() => onOpen(item)}
                />
              ))}
            </Rail>
          ) : (
            <View style={styles.gutter}>
              <EmptyState
                compact
                title={ta(locale, "nothingHere")}
                detail={ta(locale, "emptyList")}
              />
            </View>
          )}
        </View>

        <View style={styles.mapSection}>
          <View style={styles.mapCard}>
            <Text style={styles.sectionTitle}>
              {tw("destinations.mapCtaTitle")}
            </Text>
            <Text style={styles.bodyText}>
              {tw("destinations.mapCtaSubtitle")}
            </Text>
            <Pressable
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              onPress={onOpenMap}
            >
              <Image
                source={require("../../../assets/images/home-map.png")}
                style={{
                  height: mapArtWidth * MAP_ART_RATIO,
                  width: mapArtWidth,
                }}
                resizeMode="contain"
              />
            </Pressable>
            <Button label={tw("destinations.openMap")} onPress={onOpenMap} />
          </View>
        </View>

        <View style={styles.whatsOn}>
          <SectionHeading
            inset
            title={t(locale, "events")}
            action={
              <TextAction
                label={t(locale, "allEvents")}
                onPress={() => onBrowse("event")}
              />
            }
          />
          <View style={styles.gutter}>
            {data?.events.length ? (
              data.events
                .slice(0, 4)
                .map((item, index) => (
                  <EventRow
                    key={item.id}
                    item={item}
                    locale={locale}
                    divider={index > 0}
                    onPress={() => onOpen(item)}
                  />
                ))
            ) : (
              <EmptyState
                compact
                title={ta(locale, "nothingHere")}
                detail={ta(locale, "noEvents")}
              />
            )}
          </View>
        </View>

        <View style={styles.planSection}>
          <PlanCard
            dayLabel={tw("tripPlanner.day")}
            intro={tw("tripPlanner.intro")}
            locale={locale}
            onPress={onPlanTrip}
            stops={(data?.destinations ?? []).slice(0, 3)}
            title={tw("tripPlanner.title")}
            action={tw("exploreMap.ctaPrimaryLabel")}
          />
        </View>

        {data?.stories.length ? (
          <View style={styles.stories}>
            <SectionHeading
              inset
              title={t(locale, "storiesTitle")}
              action={
                <TextAction
                  label={t(locale, "browseAll")}
                  onPress={() => onBrowse("story")}
                />
              }
            />
            <View style={styles.gutter}>
              <FeatureStory
                item={data.stories[0]}
                onPress={() => onOpen(data.stories[0])}
              />
              {data.stories.length > 1 ? (
                <View style={styles.storyList}>
                  {data.stories.slice(1, 4).map((item, index) => (
                    <StoryRow
                      divider={index > 0}
                      key={item.id}
                      item={item}
                      onPress={() => onOpen(item)}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {data?.packages.length ? (
          <View style={styles.packages}>
            <SectionHeading
              inset
              title={t(locale, "travelPackages")}
              action={
                <TextAction
                  label={t(locale, "browseAll")}
                  onPress={() => onBrowse("package")}
                />
              }
            />
            <Rail contentContainerStyle={styles.rail}>
              {data.packages.map((item) => (
                <PackageCard
                  key={item.id}
                  item={item}
                  onPress={() => onOpen(item)}
                />
              ))}
            </Rail>
          </View>
        ) : null}
      </ScrollView>
      {/* Keeps scrolled content from showing through the status bar. */}
      {pastHero ? (
        <View style={[styles.statusBackdrop, { height: insets.top }]} />
      ) : null}
    </View>
  );
}

function Hero({
  banners,
  locale,
  topInset,
  onSearch,
  onOpenBanner,
}: {
  banners: HeroBanner[];
  locale: AppLocale;
  topInset: number;
  onSearch: () => void;
  onOpenBanner: (banner: HeroBanner) => void;
}) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const slides: HeroBanner[] = banners.length
    ? banners
    : [
        {
          id: "fallback",
          title: "Kurdistan is calling",
          image: null,
          ctaLabel: "",
          url: "",
        },
      ];
  const onPage = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    // Right to left, browsers count the offset down from 0 to a negative
    // number, while phones start at the far end and count down to 0.
    const offset = !isRtl(locale)
      ? contentOffset.x
      : Platform.OS === "web"
        ? Math.abs(contentOffset.x)
        : contentSize.width - layoutMeasurement.width - contentOffset.x;
    const page = Math.round(offset / width);
    setIndex(Math.min(Math.max(page, 0), slides.length - 1));
  };
  return (
    <View style={styles.hero}>
      <Rail pagingEnabled onMomentumScrollEnd={onPage}>
        {slides.map((banner) => (
          <ImageBackground
            key={banner.id}
            source={banner.image ? { uri: banner.image } : undefined}
            style={[
              styles.heroSlide,
              { width },
              !banner.image && styles.heroFallback,
            ]}
          >
            <LinearGradient
              colors={[
                "rgba(20,20,20,0.5)",
                "rgba(20,20,20,0)",
                "rgba(20,20,20,0.05)",
                "rgba(20,20,20,0.82)",
              ]}
              locations={[0, 0.24, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.heroCopy,
                { paddingTop: topInset + topSpace + 104 },
              ]}
            >
              <Text numberOfLines={3} style={styles.heroTitle}>
                {banner.title}
              </Text>
              <View style={styles.heroActions}>
                {banner.ctaLabel ? (
                  <Button
                    kind="lime"
                    label={banner.ctaLabel}
                    onPress={() => onOpenBanner(banner)}
                  />
                ) : (
                  <View />
                )}
                {slides.length > 1 ? (
                  <Text style={styles.heroPosition}>
                    {`${formatNumber(index + 1, locale)} ${OF[locale]} ${formatNumber(slides.length, locale)}`}
                  </Text>
                ) : null}
              </View>
            </View>
          </ImageBackground>
        ))}
      </Rail>
      <View style={[styles.topBar, { top: topInset + topSpace }]}>
        <Logo color={colors.white} height={48} />
        <Pressable
          accessibilityLabel={t(locale, "search")}
          accessibilityRole="search"
          onPress={onSearch}
          style={({ pressed }) => [
            styles.searchPill,
            pressed && styles.searchPillPressed,
          ]}
        >
          <Ionicons color={colors.white} name="search-outline" size={18} />
          <Text style={styles.searchPillText}>{t(locale, "search")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DestinationCard({
  item,
  onPress,
}: {
  item: ContentItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      onPress={onPress}
      style={({ pressed }) => [styles.destination, pressed && styles.pressed]}
    >
      <ImageBackground
        source={item.image ? { uri: item.image } : undefined}
        style={[styles.destinationImage, !item.image && styles.heroFallback]}
      >
        <LinearGradient
          colors={["rgba(20,20,20,0)", "rgba(20,20,20,0.7)"]}
          style={StyleSheet.absoluteFill}
        />
        <Text numberOfLines={2} style={styles.destinationName}>
          {item.title}
        </Text>
      </ImageBackground>
    </Pressable>
  );
}

function EventRow({
  item,
  locale,
  divider,
  onPress,
}: {
  item: ContentItem;
  locale: AppLocale;
  divider: boolean;
  onPress: () => void;
}) {
  const block = dateBlock(item.date, locale);
  const meta = untilLabel(item.date, item.endDate, locale) ?? item.excerpt;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.eventRow,
        divider && styles.divider,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.dateBlock}>
        {block ? (
          <>
            <Text style={styles.dateDay}>{block.day}</Text>
            <Text numberOfLines={2} style={styles.dateMonth}>
              {block.month}
            </Text>
          </>
        ) : (
          <Ionicons color={colors.primary} name="calendar-outline" size={24} />
        )}
      </View>
      <View style={styles.eventCopy}>
        <Text numberOfLines={2} style={styles.itemTitle}>
          {item.title}
        </Text>
        {meta ? (
          <Text numberOfLines={1} style={styles.meta}>
            {meta}
          </Text>
        ) : null}
      </View>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.eventThumb} />
      ) : null}
    </Pressable>
  );
}

function FeatureStory({
  item,
  onPress,
}: {
  item: ContentItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.featureStory, pressed && styles.pressed]}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.featureImage} />
      ) : (
        <View style={[styles.featureImage, styles.heroFallback]} />
      )}
      {item.label ? <Text style={styles.category}>{item.label}</Text> : null}
      <Text numberOfLines={3} style={styles.sectionTitle}>
        {item.title}
      </Text>
    </Pressable>
  );
}

function StoryRow({
  item,
  divider,
  onPress,
}: {
  item: ContentItem;
  divider: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.storyRow,
        divider && styles.divider,
        pressed && styles.pressed,
      ]}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.storyThumb} />
      ) : (
        <View style={[styles.storyThumb, styles.heroFallback]} />
      )}
      <View style={styles.storyCopy}>
        {item.label ? <Text style={styles.category}>{item.label}</Text> : null}
        <Text numberOfLines={2} style={styles.storyTitle}>
          {item.title}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * The trip planner's card: a three-day route preview from real destinations
 * (numbered stops joined by a dashed line), then the pitch and the action.
 */
function PlanCard({
  title,
  intro,
  action,
  dayLabel,
  stops,
  locale,
  onPress,
}: {
  title: string;
  intro: string;
  action: string;
  dayLabel: string;
  stops: ContentItem[];
  locale: AppLocale;
  onPress: () => void;
}) {
  return (
    <View style={styles.planCard}>
      {stops.length === 3 ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.route}
        >
          <View style={styles.routeLine} />
          {stops.map((stop, index) => (
            <View key={stop.id} style={styles.routeStop}>
              <View style={styles.routePhotoWrap}>
                {stop.image ? (
                  <Image
                    source={{ uri: stop.image }}
                    style={styles.routePhoto}
                  />
                ) : (
                  <View
                    style={[styles.routePhoto, styles.routePhotoFallback]}
                  />
                )}
              </View>
              <View style={styles.routeNumber}>
                <Text style={styles.routeNumberText}>
                  {formatNumber(index + 1, locale)}
                </Text>
              </View>
              <Text style={styles.routeDay}>
                {`${dayLabel} ${formatNumber(index + 1, locale)}`}
              </Text>
              <Text numberOfLines={1} style={styles.routePlace}>
                {stop.title}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.planCopy}>
        <Text style={styles.planTitle}>{title}</Text>
        <Text style={styles.planIntro}>{intro}</Text>
      </View>
      <Button fill kind="lime" label={action} onPress={onPress} />
    </View>
  );
}

function PackageCard({
  item,
  onPress,
}: {
  item: ContentItem;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.packageCard, pressed && styles.pressed]}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.packageImage} />
      ) : (
        <View style={[styles.packageImage, styles.heroFallback]} />
      )}
      <Text numberOfLines={2} style={styles.itemTitle}>
        {item.title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  gutter: { paddingHorizontal: gutter },
  pressed: { opacity: 0.85 },
  rowPressed: { backgroundColor: colors.soft },
  hero: { height: HERO_HEIGHT },
  heroSlide: { height: HERO_HEIGHT },
  heroFallback: { backgroundColor: colors.primary },
  heroCopy: {
    flex: 1,
    gap: 20,
    justifyContent: "flex-end",
    paddingBottom: 28,
    paddingHorizontal: gutter,
  },
  heroTitle: { ...type.hero, color: colors.white },
  heroActions: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroPosition: { ...type.caption, color: colors.white },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    left: gutter,
    position: "absolute",
    right: gutter,
  },
  searchPill: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    borderColor: "rgba(255,255,255,0.32)",
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: "row",
    gap: 8,
    height: 44,
    paddingHorizontal: 16,
  },
  searchPillPressed: { backgroundColor: "rgba(255,255,255,0.3)" },
  searchPillText: { ...type.smallStrong, color: colors.white },
  whereToGo: { gap: 16, paddingBottom: 8, paddingTop: 36 },
  rail: { gap: 12, paddingHorizontal: gutter },
  destination: { borderRadius: radius.card, overflow: "hidden" },
  destinationImage: {
    height: 320,
    justifyContent: "flex-end",
    padding: 20,
    width: 248,
  },
  destinationName: { ...type.title, color: colors.white },
  mapSection: { paddingHorizontal: gutter, paddingVertical: 28 },
  mapCard: {
    backgroundColor: colors.cream,
    borderRadius: radius.panel,
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  sectionTitle: { ...type.section, color: colors.dark },
  bodyText: { ...type.body, color: colors.body },
  whatsOn: { gap: 8, paddingBottom: 24, paddingTop: 20 },
  eventRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    paddingVertical: 16,
  },
  divider: { borderTopColor: colors.border, borderTopWidth: 1 },
  dateBlock: { alignItems: "center", width: 56 },
  dateDay: { ...type.numeral, color: colors.primary },
  dateMonth: { ...type.caption, color: colors.primary, textAlign: "center" },
  eventCopy: { flex: 1, gap: 4 },
  itemTitle: { ...type.item, color: colors.dark },
  meta: { ...type.small, color: colors.muted },
  eventThumb: {
    backgroundColor: colors.soft,
    borderRadius: radius.thumb,
    height: 64,
    width: 64,
  },
  planSection: { paddingHorizontal: gutter, paddingVertical: 28 },
  planCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.panel,
    gap: 22,
    overflow: "hidden",
    padding: 20,
    paddingTop: 24,
  },
  route: { flexDirection: "row", gap: 10 },
  // Runs through the stop numbers, from the first column's centre to the last.
  routeLine: {
    borderColor: "rgba(237,255,129,0.55)",
    borderStyle: "dashed",
    borderTopWidth: 2,
    left: "16%",
    position: "absolute",
    right: "16%",
    top: ROUTE_PHOTO + 1,
  },
  routeStop: { alignItems: "center", flex: 1 },
  routePhotoWrap: {
    borderRadius: 18,
    height: ROUTE_PHOTO,
    overflow: "hidden",
    width: "100%",
  },
  routePhoto: { height: "100%", width: "100%" },
  routePhotoFallback: { backgroundColor: "rgba(255,255,255,0.12)" },
  routeNumber: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 30,
    justifyContent: "center",
    marginTop: -14,
    width: 30,
  },
  routeNumberText: {
    ...type.smallStrong,
    color: colors.primary,
    lineHeight: 18,
  },
  routeDay: { ...type.caption, color: "rgba(255,255,255,0.7)", marginTop: 6 },
  routePlace: { ...type.smallStrong, color: colors.white },
  planCopy: { gap: 10 },
  planTitle: { ...type.title, color: colors.white },
  planIntro: { ...type.body, color: "rgba(255,255,255,0.8)" },
  stories: { gap: 16, paddingBottom: 8, paddingTop: 36 },
  storyList: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: 28,
  },
  featureStory: { gap: 10 },
  featureImage: {
    backgroundColor: colors.soft,
    borderRadius: radius.media,
    height: 220,
    width: "100%",
  },
  category: { ...type.caption, color: colors.primary },
  storyRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    paddingVertical: 16,
  },
  storyTitle: {
    color: colors.dark,
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 23,
  },
  storyThumb: {
    backgroundColor: colors.soft,
    borderRadius: radius.thumb,
    height: 80,
    width: 80,
  },
  storyCopy: { flex: 1, gap: 4 },
  packages: { gap: 16, paddingBottom: 36, paddingTop: 36 },
  packageCard: { gap: 10, width: 236 },
  packageImage: {
    backgroundColor: colors.soft,
    borderRadius: radius.media,
    height: 168,
    width: 236,
  },
  statusBackdrop: {
    backgroundColor: colors.white,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
