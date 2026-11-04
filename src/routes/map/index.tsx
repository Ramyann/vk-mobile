import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Location from "expo-location";
import { AppleMaps, GoogleMaps } from "expo-maps";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { getContentDetail, type ContentItem } from "../../api/content";
import {
  getMapPins,
  resolveMapPins,
  type MapPlace,
  type Season,
} from "../../api/map";
import { WEBSITE_URL } from "../../config/environment";
import type { AppLocale } from "../../i18n/locale";
import { webT } from "../../i18n/web";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { formatNumber } from "../../lib/localized";
import {
  distanceKm,
  EMPTY_MAP_FILTERS,
  facetOptions,
  filterMapPlaces,
  formatDistance,
  isInRegion,
  toggleValue,
  type MapFilters,
} from "../../lib/map-filters";
import { openingStatus } from "../../lib/opening-hours";
import { colors, radius } from "../../styles/tokens";
import { categoryIonicon, categorySymbol } from "./categoryIcons";

type Coordinates = { latitude: number; longitude: number };
const REGION_CENTER: Coordinates = { latitude: 36.3, longitude: 44.4 };

/** Meteorological seasons on Kurdistan time, as the website highlights them. */
function currentSeason(now = new Date()): Season {
  const month = new Date(now.getTime() + 3 * 3600_000).getUTCMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

const toContentItem = (place: MapPlace): ContentItem => ({
  id: place.slug,
  slug: place.slug,
  type: "place",
  title: place.name,
  excerpt: "",
  image: place.image,
  label: place.category,
  latitude: place.latitude,
  longitude: place.longitude,
});

/**
 * The website's /map page: every published place on one map, searchable by
 * name in any language and filterable by governorate and category, with a
 * details card for the picked place.
 */
export function PlacesMapScreen({
  locale,
  onBack,
  onOpen,
  onPlanTrip,
}: {
  locale: AppLocale;
  onBack: () => void;
  onOpen: (item: ContentItem) => void;
  onPlanTrip?: () => void;
}) {
  const t = webT(locale);
  const pins = useQuery({ queryKey: ["map-pins"], queryFn: getMapPins });
  const places = useMemo(
    () => resolveMapPins(pins.data ?? [], locale),
    [locale, pins.data],
  );
  const [filters, setFilters] = useState<MapFilters>(EMPTY_MAP_FILTERS);
  const query = useDebouncedValue(filters.query, 150);
  const applied = useMemo(() => ({ ...filters, query }), [filters, query]);
  const visible = useMemo(
    () => filterMapPlaces(places, applied),
    [applied, places],
  );
  const governorates = useMemo(
    () => facetOptions(places, applied, "governorates"),
    [applied, places],
  );
  const categories = useMemo(
    () => facetOptions(places, applied, "categories"),
    [applied, places],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = visible.find((place) => place.id === selectedId) ?? null;
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const listRef = useRef<FlatList<MapPlace>>(null);

  const distanceTo = (place: MapPlace) =>
    position && isInRegion(position) ? distanceKm(position, place) : undefined;

  const sorted = useMemo(
    () =>
      position && isInRegion(position)
        ? [...visible].sort(
            (left, right) =>
              distanceKm(position, left) - distanceKm(position, right),
          )
        : visible,
    [position, visible],
  );

  const locate = async () => {
    setLocating(true);
    setNotice(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setNotice("Location permission is needed to sort places by distance.");
        return;
      }
      const recent = await Location.getLastKnownPositionAsync({
        maxAge: 5 * 60 * 1000,
      });
      const current =
        recent ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }));
      setPosition({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
    } catch {
      setNotice("We could not get your current location.");
    } finally {
      setLocating(false);
    }
  };

  const isInternalBuild =
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
  const androidMapConfigured = Boolean(
    (
      Constants.expoConfig?.android as
        | { config?: { googleMaps?: { apiKey?: string } } }
        | undefined
    )?.config?.googleMaps?.apiKey,
  );
  const canShowNativeMap =
    isInternalBuild &&
    Platform.OS !== "web" &&
    (Platform.OS === "ios" || androidMapConfigured);

  const camera = selected
    ? { coordinates: selected, zoom: 13 }
    : { coordinates: position ?? REGION_CENTER, zoom: position ? 9 : 6.6 };
  const markers = visible.map((place) => ({
    id: place.id,
    title: place.name,
    coordinates: { latitude: place.latitude, longitude: place.longitude },
  }));
  const pick = ({ id }: { id?: string }) => {
    if (id) setSelectedId(id);
  };
  const hasFilters =
    Boolean(filters.query.trim()) ||
    filters.governorates.length > 0 ||
    filters.categories.length > 0;

  const header = (
    <View>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        onPress={onBack}
        style={styles.back}
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.eyebrow}>
        {t("exploreMap.eyebrow").toUpperCase()}
      </Text>
      <Text style={styles.title}>{t("exploreMap.title")}</Text>
      <Text style={styles.intro}>{t("exploreMap.intro")}</Text>

      <View style={styles.search}>
        <Ionicons color={colors.primary} name="search" size={18} />
        <TextInput
          accessibilityLabel={t("exploreMap.searchLabel")}
          onChangeText={(value) =>
            setFilters((current) => ({ ...current, query: value }))
          }
          placeholder={t("exploreMap.searchPlaceholder")}
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.searchInput}
          value={filters.query}
        />
        {filters.query ? (
          <Pressable
            accessibilityLabel={t("exploreMap.clearSearch")}
            hitSlop={8}
            onPress={() => setFilters((current) => ({ ...current, query: "" }))}
          >
            <Ionicons color={colors.muted} name="close-circle" size={18} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.chips}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <Chip
          active={!filters.governorates.length}
          label={t("exploreMap.allGovernorates")}
          onPress={() =>
            setFilters((current) => ({ ...current, governorates: [] }))
          }
        />
        {governorates.map((option) => (
          <Chip
            active={filters.governorates.includes(option.value)}
            count={formatNumber(option.count, locale)}
            key={option.value}
            label={option.label}
            onPress={() =>
              setFilters((current) => ({
                ...current,
                governorates: toggleValue(current.governorates, option.value),
              }))
            }
          />
        ))}
      </ScrollView>
      <ScrollView
        contentContainerStyle={styles.chips}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <Chip
          active={!filters.categories.length}
          label={t("exploreMap.all")}
          onPress={() =>
            setFilters((current) => ({ ...current, categories: [] }))
          }
        />
        {categories.map((option) => (
          <Chip
            active={filters.categories.includes(option.value)}
            color={option.color}
            count={formatNumber(option.count, locale)}
            icon={categoryIonicon(option.icon)}
            key={option.value}
            label={option.label}
            onPress={() =>
              setFilters((current) => ({
                ...current,
                categories: toggleValue(current.categories, option.value),
              }))
            }
          />
        ))}
      </ScrollView>

      {canShowNativeMap ? (
        <View style={styles.map}>
          {Platform.OS === "ios" ? (
            <AppleMaps.View
              cameraPosition={camera}
              markers={markers.map((marker, index) => ({
                ...marker,
                systemImage: categorySymbol(visible[index].categoryIcon),
                tintColor: visible[index].color,
              }))}
              onMarkerClick={pick}
              properties={{ isMyLocationEnabled: Boolean(position) }}
              style={StyleSheet.absoluteFill}
              uiSettings={{ compassEnabled: true }}
            />
          ) : (
            <GoogleMaps.View
              cameraPosition={camera}
              markers={markers.map((marker, index) => ({
                ...marker,
                snippet: visible[index].category,
              }))}
              onMarkerClick={pick}
              properties={{ isMyLocationEnabled: Boolean(position) }}
              style={StyleSheet.absoluteFill}
              uiSettings={{
                compassEnabled: true,
                myLocationButtonEnabled: true,
                zoomControlsEnabled: true,
              }}
            />
          )}
        </View>
      ) : (
        <View style={styles.mapFallback}>
          <Ionicons color={colors.primary} name="map-outline" size={26} />
          <Text style={styles.mapFallbackText}>
            {t("exploreMap.mapUnavailable")}
          </Text>
        </View>
      )}

      {selected ? (
        <PlaceCard
          distance={distanceTo(selected)}
          index={visible.indexOf(selected)}
          locale={locale}
          onClose={() => setSelectedId(null)}
          onOpen={() => onOpen(toContentItem(selected))}
          onStep={(step) => {
            const next =
              visible[
                (visible.indexOf(selected) + step + visible.length) %
                  visible.length
              ];
            if (next) setSelectedId(next.id);
          }}
          place={selected}
          total={visible.length}
        />
      ) : null}

      <View style={styles.listHeader}>
        <View style={styles.listHeaderCopy}>
          <Text style={styles.listHeading}>{t("exploreMap.results")}</Text>
          <Text style={styles.count}>
            {t("exploreMap.count", {
              count: visible.length,
              total: formatNumber(visible.length, locale),
            })}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={locating}
          onPress={() => void locate()}
          style={styles.locate}
        >
          {locating ? (
            <ActivityIndicator color={colors.dark} size="small" />
          ) : (
            <Ionicons color={colors.dark} name="locate" size={18} />
          )}
        </Pressable>
      </View>
      {hasFilters ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setFilters(EMPTY_MAP_FILTERS)}
          style={styles.clearAll}
        >
          <Text style={styles.clearAllText}>{t("exploreMap.clearAll")}</Text>
        </Pressable>
      ) : null}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {pins.isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : null}
    </View>
  );

  return (
    <FlatList
      ListEmptyComponent={
        pins.isLoading ? null : (
          <Text style={styles.empty}>{t("exploreMap.noPlaces")}</Text>
        )
      }
      ListFooterComponent={
        onPlanTrip ? (
          <View style={styles.cta}>
            <Text style={styles.ctaTitle}>{t("exploreMap.ctaTitle")}</Text>
            <Text style={styles.ctaBody}>{t("exploreMap.ctaSubtitle")}</Text>
            <Pressable onPress={onPlanTrip} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>
                {t("exploreMap.ctaPrimaryLabel")}
              </Text>
            </Pressable>
          </View>
        ) : null
      }
      ListHeaderComponent={header}
      contentContainerStyle={styles.content}
      data={sorted}
      keyExtractor={(place) => place.id}
      keyboardShouldPersistTaps="handled"
      ref={listRef}
      renderItem={({ item }) => (
        <PlaceRow
          distance={distanceTo(item)}
          locale={locale}
          onPress={() => {
            setSelectedId(item.id);
            listRef.current?.scrollToOffset({ animated: true, offset: 0 });
          }}
          place={item}
          selected={item.id === selectedId}
        />
      )}
      style={styles.page}
    />
  );
}

function Chip({
  label,
  active,
  count,
  color,
  icon,
  onPress,
}: {
  label: string;
  active: boolean;
  count?: string;
  color?: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon ? (
        <View style={[styles.chipDot, { backgroundColor: color }]}>
          <Ionicons color={colors.white} name={icon} size={11} />
        </View>
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
      {count !== undefined ? (
        <Text style={[styles.chipCount, active && styles.chipTextActive]}>
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}

function PlaceRow({
  place,
  distance,
  locale,
  selected,
  onPress,
}: {
  place: MapPlace;
  distance?: number;
  locale: AppLocale;
  selected: boolean;
  onPress: () => void;
}) {
  const t = webT(locale);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
    >
      {place.image ? (
        <Image source={{ uri: place.image }} style={styles.rowImage} />
      ) : (
        <View style={[styles.rowImage, { backgroundColor: place.color }]} />
      )}
      <View style={styles.rowCopy}>
        {place.category ? (
          <View style={styles.rowCategory}>
            <Ionicons
              color={place.color}
              name={categoryIonicon(place.categoryIcon)}
              size={13}
            />
            <Text
              numberOfLines={1}
              style={[styles.rowLabel, { color: place.color }]}
            >
              {place.category}
            </Text>
          </View>
        ) : null}
        <Text numberOfLines={2} style={styles.rowTitle}>
          {place.name}
        </Text>
        <Text numberOfLines={1} style={styles.rowMeta}>
          {[
            place.governorate?.name,
            distance !== undefined
              ? t("exploreMap.distanceAway", {
                  distance: formatDistance(distance),
                })
              : undefined,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      </View>
    </Pressable>
  );
}

function PlaceCard({
  place,
  distance,
  index,
  total,
  locale,
  onClose,
  onOpen,
  onStep,
}: {
  place: MapPlace;
  distance?: number;
  index: number;
  total: number;
  locale: AppLocale;
  onClose: () => void;
  onOpen: () => void;
  onStep: (step: 1 | -1) => void;
}) {
  const t = webT(locale);
  const detail = useQuery({
    queryKey: ["content-detail", "place", place.slug, locale],
    queryFn: () => getContentDetail(toContentItem(place), locale),
  });
  const status = openingStatus(detail.data?.openingHoursRaw ?? []);
  const season = currentSeason();
  const statusText = !status
    ? null
    : status.kind === "open24"
      ? t("places.open24Hours")
      : status.kind === "open"
        ? `${t("exploreMap.openNow")} · ${t("exploreMap.closesAt", { time: status.closesAt })}`
        : status.kind === "closed"
          ? `${t("exploreMap.closedNow")} · ${t("exploreMap.opensAt", { time: status.opensAt })}`
          : t("exploreMap.closedToday");
  const about = detail.data?.body?.split("\n\n")[0]?.trim();
  const website = detail.data?.links.find((link) => link.label === "Website");
  const placeUrl = `${WEBSITE_URL}${locale === "en" ? "" : `/${locale}`}/place/${encodeURIComponent(place.slug)}`;

  return (
    <View style={styles.card}>
      {place.image ? (
        <Image source={{ uri: place.image }} style={styles.cardImage} />
      ) : null}
      <Pressable
        accessibilityLabel={t("exploreMap.closeCard")}
        accessibilityRole="button"
        onPress={onClose}
        style={styles.cardClose}
      >
        <Ionicons color={colors.primary} name="close" size={20} />
      </Pressable>
      <View style={styles.cardBody}>
        {place.category ? (
          <View style={[styles.badge, { backgroundColor: place.color }]}>
            <Ionicons
              color={colors.white}
              name={categoryIonicon(place.categoryIcon)}
              size={12}
            />
            <Text style={styles.badgeText}>{place.category}</Text>
          </View>
        ) : null}
        <Text style={styles.cardTitle}>{place.name}</Text>
        <Text style={styles.cardMeta}>
          {[
            place.governorate?.name,
            distance !== undefined
              ? t("exploreMap.distanceAway", {
                  distance: formatDistance(distance),
                })
              : undefined,
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        {statusText ? (
          <Text
            style={[
              styles.status,
              status?.kind === "open" || status?.kind === "open24"
                ? styles.statusOpen
                : styles.statusClosed,
            ]}
          >
            {statusText}
          </Text>
        ) : null}
        {place.seasons.length ? (
          <>
            <Text style={styles.cardSection}>{t("exploreMap.bestTime")}</Text>
            <View style={styles.seasons}>
              {(place.allSeasons ? ["all" as const] : place.seasons).map(
                (value) => (
                  <View
                    key={value}
                    style={[
                      styles.season,
                      (value === "all" || value === season) &&
                        styles.seasonCurrent,
                    ]}
                  >
                    <Text style={styles.seasonText}>
                      {t(`exploreMap.seasons.${value}`)}
                    </Text>
                  </View>
                ),
              )}
            </View>
          </>
        ) : null}
        {about ? (
          <>
            <Text style={styles.cardSection}>{t("exploreMap.about")}</Text>
            <Text numberOfLines={4} style={styles.about}>
              {about}
            </Text>
          </>
        ) : null}
        <View style={styles.actions}>
          <Action
            icon="navigate-outline"
            label={t("exploreMap.directions")}
            onPress={() =>
              void Linking.openURL(
                `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`,
              )
            }
          />
          <Action
            icon="share-outline"
            label={t("exploreMap.share")}
            onPress={() =>
              void Share.share({ message: `${place.name}\n${placeUrl}` })
            }
          />
          {website ? (
            <Action
              icon="globe-outline"
              label={t("destinations.website")}
              onPress={() => void Linking.openURL(website.url)}
            />
          ) : null}
        </View>
        <Pressable onPress={onOpen} style={styles.viewPlace}>
          <Text style={styles.viewPlaceText}>{t("exploreMap.viewPlace")}</Text>
        </Pressable>
        {total > 1 ? (
          <View style={styles.pager}>
            <Pressable
              accessibilityLabel={t("exploreMap.previous")}
              hitSlop={8}
              onPress={() => onStep(-1)}
            >
              <Ionicons color={colors.primary} name="chevron-back" size={22} />
            </Pressable>
            <Text style={styles.pagerText}>
              {t("exploreMap.position", {
                current: formatNumber(index + 1, locale),
                total: formatNumber(total, locale),
              })}
            </Text>
            <Pressable
              accessibilityLabel={t("exploreMap.next")}
              hitSlop={8}
              onPress={() => onStep(1)}
            >
              <Ionicons
                color={colors.primary}
                name="chevron-forward"
                size={22}
              />
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Action({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={styles.action}
    >
      <Ionicons color={colors.primary} name={icon} size={18} />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  back: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    marginBottom: 14,
    width: 44,
  },
  backText: { color: colors.primary, fontSize: 35, lineHeight: 36 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    color: colors.dark,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 37,
    marginTop: 6,
  },
  intro: { color: colors.body, fontSize: 15, lineHeight: 22, marginTop: 10 },
  search: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 16,
  },
  searchInput: {
    color: colors.dark,
    flex: 1,
    fontSize: 15,
    paddingVertical: 13,
  },
  chips: { gap: 8, paddingTop: 10 },
  chip: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipDot: {
    alignItems: "center",
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    width: 18,
  },
  chipText: { color: colors.dark, fontSize: 13, fontWeight: "700" },
  chipCount: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: colors.white },
  map: {
    borderRadius: radius.card,
    height: 320,
    marginTop: 14,
    overflow: "hidden",
  },
  mapFallback: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    gap: 8,
    marginTop: 14,
    padding: 24,
  },
  mapFallbackText: {
    color: colors.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    marginTop: 14,
    overflow: "hidden",
  },
  cardImage: { height: 170, width: "100%" },
  cardClose: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    width: 36,
  },
  cardBody: { padding: 16 },
  badge: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: "800" },
  cardTitle: {
    color: colors.dark,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 10,
  },
  cardMeta: { color: colors.body, fontSize: 13, marginTop: 4 },
  status: { fontSize: 13, fontWeight: "800", marginTop: 8 },
  statusOpen: { color: colors.teal },
  statusClosed: { color: colors.danger },
  cardSection: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 14,
  },
  seasons: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  season: {
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seasonCurrent: { backgroundColor: colors.lime },
  seasonText: { color: colors.dark, fontSize: 12, fontWeight: "700" },
  about: { color: colors.body, fontSize: 14, lineHeight: 21, marginTop: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  action: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  viewPlace: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: 12,
    paddingVertical: 14,
  },
  viewPlaceText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  pager: {
    alignItems: "center",
    flexDirection: "row",
    gap: 18,
    justifyContent: "center",
    marginTop: 12,
  },
  pagerText: { color: colors.body, fontSize: 13, fontWeight: "700" },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 8,
    marginTop: 22,
  },
  listHeaderCopy: { flex: 1 },
  listHeading: { color: colors.dark, fontSize: 20, fontWeight: "900" },
  count: { color: colors.body, fontSize: 13, marginTop: 2 },
  locate: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  clearAll: { alignSelf: "flex-start", paddingVertical: 6 },
  clearAllText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  notice: { color: colors.body, fontSize: 13, lineHeight: 19, marginBottom: 6 },
  loading: { marginVertical: 30 },
  empty: {
    color: colors.body,
    fontSize: 14,
    paddingVertical: 24,
    textAlign: "center",
  },
  row: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    padding: 8,
  },
  rowSelected: { borderColor: colors.primary, borderWidth: 2 },
  rowImage: { borderRadius: 14, height: 72, width: 72 },
  rowCopy: { flex: 1 },
  rowCategory: { alignItems: "center", flexDirection: "row", gap: 4 },
  rowLabel: { fontSize: 12, fontWeight: "800" },
  rowTitle: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  rowMeta: { color: colors.body, fontSize: 12, marginTop: 3 },
  cta: {
    backgroundColor: colors.lime,
    borderRadius: radius.cardLarge,
    marginTop: 18,
    padding: 22,
  },
  ctaTitle: { color: colors.dark, fontSize: 22, fontWeight: "900" },
  ctaBody: { color: colors.dark, fontSize: 14, lineHeight: 21, marginTop: 8 },
  ctaButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  ctaButtonText: { color: colors.white, fontSize: 14, fontWeight: "800" },
});
