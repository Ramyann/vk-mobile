import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text, TextInput } from "../../components/ui/Text";
import { useTabBarHeight } from "../../components/ui/TabBar";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getContentDetail, type ContentItem } from "../../api/content";
import { getMapPins, resolveMapPins, type MapPlace } from "../../api/map";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { isRtl, type AppLocale } from "../../i18n/locale";
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
import { colors, gutter, radius, topSpace } from "../../styles/tokens";
import { fonts, type } from "../../styles/typography";
import { NativeMap, nativeMapsAvailable } from "./NativeMap";
import { WebPlacesMap } from "./WebPlacesMap";
import { ta } from "../../i18n/app-messages";
import { Rail } from "../../components/ui/Rail";
import { categoryIonicon } from "./categoryIcons";

type Coordinates = { latitude: number; longitude: number };
const REGION_CENTER: Coordinates = { latitude: 36.3, longitude: 44.4 };

/** The floating controls' shadow from the Figma frame (28 blur, 8 down). */
const floating = {
  elevation: 6,
  shadowColor: "#141414",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.16,
  shadowRadius: 14,
} as const;

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
 * The website's /map page as a full-screen map: search and a governorate
 * picker float at the top, category chips under them, and the picked place
 * opens in a sheet at the bottom. Where native maps are not available (Expo
 * Go, the web preview), and whenever the visitor asks for it, the same
 * results show as a list.
 */
export function PlacesMapScreen({
  locale,
  onBack,
  onOpen,
}: {
  locale: AppLocale;
  onBack: () => void;
  onOpen: (item: ContentItem) => void;
  onPlanTrip?: () => void;
}) {
  const t = webT(locale);
  const rtl = isRtl(locale);
  const insets = useSafeAreaInsets();
  // The map runs under the floating tab bar; its panel sits just above it.
  const tabBarHeight = useTabBarHeight();
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
  const [picking, setPicking] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const showList = listOpen;

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
        setNotice(ta(locale, "locationPermission"));
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
      setNotice(ta(locale, "locationFailed"));
    } finally {
      setLocating(false);
    }
  };

  const mapPins = useMemo(
    () =>
      visible.map((place) => ({
        id: place.id,
        title: place.name,
        category: place.category,
        categoryIcon: place.categoryIcon,
        color: place.color,
        latitude: place.latitude,
        longitude: place.longitude,
      })),
    [visible],
  );
  const camera = selected
    ? { coordinates: selected, zoom: 13 }
    : { coordinates: position ?? REGION_CENTER, zoom: position ? 9 : 6.6 };
  const hasFilters =
    Boolean(filters.query.trim()) ||
    filters.governorates.length > 0 ||
    filters.categories.length > 0;
  const governorateLabel = filters.governorates.length
    ? (governorates.find((option) => option.value === filters.governorates[0])
        ?.label ?? t("exploreMap.allGovernorates"))
    : t("exploreMap.allGovernorates");

  const controls = (
    <View style={styles.controls}>
      <View style={styles.searchRow}>
        <Pressable
          accessibilityLabel={ta(locale, "goBack")}
          accessibilityRole="button"
          onPress={onBack}
          style={[
            styles.roundButton,
            showList ? styles.searchSunken : floating,
          ]}
        >
          <Ionicons
            color={colors.primary}
            name={rtl ? "chevron-forward" : "chevron-back"}
            size={22}
          />
        </Pressable>
        <View
          style={[
            styles.search,
            !showList && floating,
            showList && styles.searchSunken,
          ]}
        >
          <Ionicons color={colors.muted} name="search-outline" size={20} />
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
              onPress={() =>
                setFilters((current) => ({ ...current, query: "" }))
              }
            >
              <Ionicons color={colors.dark} name="close" size={18} />
            </Pressable>
          ) : null}
          <Pressable
            accessibilityLabel={t("exploreMap.governorate")}
            accessibilityRole="button"
            accessibilityState={{ expanded: picking }}
            onPress={() => setPicking((open) => !open)}
            style={[styles.picker, showList && styles.pickerOnSunken]}
          >
            <Text numberOfLines={1} style={styles.pickerText}>
              {governorateLabel}
            </Text>
            <Ionicons
              color={colors.dark}
              name={picking ? "chevron-up" : "chevron-down"}
              size={16}
            />
          </Pressable>
        </View>
      </View>
      <Rail
        contentContainerStyle={styles.chips}
        keyboardShouldPersistTaps="handled"
        style={styles.chipRail}
      >
        <Chip
          label={t("exploreMap.all")}
          selected={!filters.categories.length}
          onPress={() =>
            setFilters((current) => ({ ...current, categories: [] }))
          }
        />
        {categories.map((option) => (
          <Chip
            key={option.value}
            count={formatNumber(option.count, locale)}
            label={option.label}
            selected={filters.categories.includes(option.value)}
            onPress={() =>
              setFilters((current) => ({
                ...current,
                categories: toggleValue(current.categories, option.value),
              }))
            }
          />
        ))}
      </Rail>
      {picking ? (
        <View style={[styles.menu, floating]}>
          {[
            {
              value: "",
              label: t("exploreMap.allGovernorates"),
              count: places.length,
            },
            ...governorates,
          ].map((option) => {
            const active = option.value
              ? filters.governorates[0] === option.value
              : !filters.governorates.length;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                key={option.value || "all"}
                onPress={() => {
                  setFilters((current) => ({
                    ...current,
                    governorates: option.value ? [option.value] : [],
                  }));
                  setPicking(false);
                }}
                style={({ pressed }) => [
                  styles.menuRow,
                  (pressed || active) && styles.menuRowActive,
                ]}
              >
                <Text style={styles.menuText}>{option.label}</Text>
                <Text style={styles.menuCount}>
                  {formatNumber(option.count, locale)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );

  if (showList)
    return (
      <View style={[styles.listPage, { paddingTop: insets.top + topSpace }]}>
        <StatusBar style="dark" />
        {controls}
        <FlatList
          contentContainerStyle={[
            styles.list,
            { paddingBottom: tabBarHeight + 96 },
          ]}
          data={sorted}
          keyExtractor={(place) => place.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.count}>
                {t("exploreMap.count", {
                  count: visible.length,
                  total: formatNumber(visible.length, locale),
                })}
              </Text>
              {hasFilters ? (
                <Button
                  kind="quiet"
                  label={t("exploreMap.clearAll")}
                  onPress={() => setFilters(EMPTY_MAP_FILTERS)}
                />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            pins.isLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.loading}
              />
            ) : (
              <Text style={styles.empty}>{t("exploreMap.noPlaces")}</Text>
            )
          }
          renderItem={({ item, index }) => (
            <PlaceRow
              distance={distanceTo(item)}
              divider={index > 0}
              locale={locale}
              place={item}
              onOpen={() => onOpen(toContentItem(item))}
              onShowOnMap={() => {
                setSelectedId(item.id);
                setListOpen(false);
              }}
            />
          )}
        />
        {notice ? (
          <Text style={[styles.listNotice, floating]}>{notice}</Text>
        ) : null}
        {/* Back to the map: a floating pill above the tab bar, where the
            thumb already is, instead of a link at the top of the list. */}
        <View
          pointerEvents="box-none"
          style={[styles.mapToggleWrap, { bottom: tabBarHeight + 24 }]}
        >
          <Pressable
            accessibilityLabel={t("exploreMap.hideList")}
            accessibilityRole="button"
            onPress={() => setListOpen(false)}
            style={({ pressed }) => [
              styles.mapToggle,
              floating,
              pressed && styles.mapTogglePressed,
            ]}
          >
            <Ionicons color={colors.lime} name="map" size={18} />
            <Text style={styles.mapToggleText}>{ta(locale, "showMap")}</Text>
          </Pressable>
        </View>
      </View>
    );

  return (
    <View style={styles.mapPage}>
      <StatusBar style="dark" />
      <View style={StyleSheet.absoluteFill}>
        {nativeMapsAvailable ? (
          <NativeMap
            camera={camera}
            onPick={setSelectedId}
            pins={mapPins}
            showsLocation={Boolean(position)}
          />
        ) : (
          // Expo Go and the web preview: the website's MapLibre basemap.
          <WebPlacesMap
            camera={camera}
            insets={{
              top: insets.top + topSpace + 110,
              bottom: 280 + tabBarHeight,
            }}
            onPick={setSelectedId}
            pins={mapPins}
            selectedId={selected?.id ?? null}
          />
        )}
      </View>
      <View style={{ paddingTop: insets.top + topSpace }}>{controls}</View>
      <View pointerEvents="box-none" style={styles.bottom}>
        <View pointerEvents="box-none" style={styles.locateWrap}>
          {notice ? (
            <Text style={[styles.toast, floating]}>{notice}</Text>
          ) : null}
          <LocateButton
            label={ta(locale, "useMyLocation")}
            locating={locating}
            onPress={() => void locate()}
          />
        </View>
        {/* The sheet runs to the bottom of the screen, behind the floating
            tab bar, so no strip of map shows between them. */}
        <View
          style={[styles.sheet, floating, { paddingBottom: tabBarHeight + 4 }]}
        >
          {selected ? (
            <PlaceSheet
              distance={distanceTo(selected)}
              index={visible.indexOf(selected)}
              locale={locale}
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
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <View style={styles.summary}>
              <View style={styles.summaryCopy}>
                <Text numberOfLines={1} style={styles.summaryCount}>
                  {pins.isLoading
                    ? " "
                    : t("exploreMap.count", {
                        count: visible.length,
                        total: formatNumber(visible.length, locale),
                      })}
                </Text>
                <Text numberOfLines={1} style={styles.summaryWhere}>
                  {governorateLabel}
                </Text>
              </View>
              <Button
                icon={<Ionicons color={colors.white} name="list" size={18} />}
                label={t("exploreMap.showList")}
                onPress={() => setListOpen(true)}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function LocateButton({
  locating,
  label,
  onPress,
}: {
  locating: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={locating}
      onPress={onPress}
      style={({ pressed }) => [
        styles.locate,
        floating,
        pressed && { backgroundColor: colors.limePressed },
      ]}
    >
      {locating ? (
        <ActivityIndicator color={colors.dark} size="small" />
      ) : (
        <Ionicons color={colors.dark} name="locate" size={22} />
      )}
    </Pressable>
  );
}

function PlaceRow({
  place,
  distance,
  divider,
  locale,
  onOpen,
  onShowOnMap,
}: {
  place: MapPlace;
  distance?: number;
  divider: boolean;
  locale: AppLocale;
  onOpen: () => void;
  onShowOnMap: () => void;
}) {
  const t = webT(locale);
  const where = place.governorate?.name;
  const away =
    distance !== undefined
      ? t("exploreMap.distanceAway", { distance: formatDistance(distance) })
      : null;
  // Two buttons side by side, not one inside the other: the row opens the
  // place, the round button shows it on the map.
  return (
    <View style={[styles.row, divider && styles.divider]}>
      <Pressable
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [styles.rowMain, pressed && styles.rowPressed]}
      >
        {place.image ? (
          <Image source={{ uri: place.image }} style={styles.rowImage} />
        ) : (
          <View style={[styles.rowImage, styles.rowImageFallback]}>
            <Ionicons
              color={colors.primary}
              name={categoryIonicon(place.categoryIcon)}
              size={24}
            />
          </View>
        )}
        <View style={styles.rowCopy}>
          {place.category ? (
            <Text numberOfLines={1} style={styles.category}>
              {place.category}
            </Text>
          ) : null}
          <Text numberOfLines={2} style={styles.rowTitle}>
            {place.name}
          </Text>
          {where || away ? (
            <View style={styles.metaRow}>
              <Ionicons
                color={colors.muted}
                name="location-outline"
                size={13}
              />
              <Text numberOfLines={1} style={styles.meta}>
                {[where, away].filter(Boolean).join(", ")}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel={`${ta(locale, "showOnMap")}: ${place.name}`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={onShowOnMap}
        style={({ pressed }) => [
          styles.rowMapButton,
          pressed && styles.rowMapButtonPressed,
        ]}
      >
        <Ionicons color={colors.primary} name="map-outline" size={18} />
      </Pressable>
    </View>
  );
}

function PlaceSheet({
  place,
  distance,
  index,
  total,
  locale,
  onOpen,
  onStep,
  onClose,
}: {
  place: MapPlace;
  distance?: number;
  index: number;
  total: number;
  locale: AppLocale;
  onOpen: () => void;
  onStep: (step: 1 | -1) => void;
  /** Back to the summary, where the list is. */
  onClose: () => void;
}) {
  const t = webT(locale);
  const rtl = isRtl(locale);
  const detail = useQuery({
    queryKey: ["content-detail", "place", place.slug, locale],
    queryFn: () => getContentDetail(toContentItem(place), locale),
  });
  const status = openingStatus(detail.data?.openingHoursRaw ?? []);
  const statusText = !status
    ? null
    : status.kind === "open24"
      ? t("places.open24Hours")
      : status.kind === "open"
        ? `${t("exploreMap.openNow")}, ${t("exploreMap.closesAt", { time: status.closesAt }).toLocaleLowerCase()}`
        : status.kind === "closed"
          ? `${t("exploreMap.closedNow")}, ${t("exploreMap.opensAt", { time: status.opensAt }).toLocaleLowerCase()}`
          : t("exploreMap.closedToday");
  const open = status?.kind === "open" || status?.kind === "open24";
  return (
    <View style={styles.sheetBody}>
      <View style={styles.sheetPlace}>
        {place.image ? (
          <Image source={{ uri: place.image }} style={styles.sheetImage} />
        ) : (
          <View
            style={[styles.sheetImage, { backgroundColor: colors.primaryTint }]}
          />
        )}
        <View style={styles.rowCopy}>
          {place.category ? (
            <Text numberOfLines={1} style={styles.category}>
              {place.category}
            </Text>
          ) : null}
          <Text numberOfLines={2} style={styles.sheetTitle}>
            {place.name}
          </Text>
          {place.governorate?.name ? (
            <Text numberOfLines={1} style={styles.meta}>
              {distance !== undefined
                ? `${place.governorate.name}, ${t("exploreMap.distanceAway", { distance: formatDistance(distance) })}`
                : place.governorate.name}
            </Text>
          ) : null}
          {statusText ? (
            <Text
              numberOfLines={1}
              style={[
                styles.status,
                { color: open ? colors.teal : colors.danger },
              ]}
            >
              {statusText}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityLabel={t("exploreMap.closeCard")}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onClose}
          style={({ pressed }) => [
            styles.sheetClose,
            pressed && styles.rowMapButtonPressed,
          ]}
        >
          <Ionicons color={colors.dark} name="close" size={18} />
        </Pressable>
      </View>
      <View style={styles.sheetActions}>
        <Button
          kind="secondary"
          label={t("exploreMap.directions")}
          onPress={() =>
            void Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`,
            )
          }
        />
        <Button
          label={t("exploreMap.viewPlace")}
          onPress={onOpen}
          style={styles.grow}
        />
      </View>
      {total > 1 ? (
        <View style={styles.pager}>
          <Pressable
            accessibilityLabel={t("exploreMap.previous")}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => onStep(-1)}
          >
            <Ionicons
              color={colors.primary}
              name={rtl ? "chevron-forward" : "chevron-back"}
              size={22}
            />
          </Pressable>
          <Text style={styles.meta}>
            {t("exploreMap.position", {
              current: formatNumber(index + 1, locale),
              total: formatNumber(total, locale),
            })}
          </Text>
          <Pressable
            accessibilityLabel={t("exploreMap.next")}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => onStep(1)}
          >
            <Ionicons
              color={colors.primary}
              name={rtl ? "chevron-back" : "chevron-forward"}
              size={22}
            />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapPage: { backgroundColor: colors.mapOutside, flex: 1 },
  listPage: { backgroundColor: colors.white, flex: 1 },
  controls: { gap: 10, paddingHorizontal: 16, zIndex: 2 },
  searchRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  roundButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  search: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 48,
    paddingLeft: 16,
    paddingRight: 8,
  },
  searchSunken: { backgroundColor: colors.soft },
  searchInput: {
    color: colors.dark,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    height: "100%",
    minWidth: 60,
  },
  picker: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 4,
    height: 34,
    maxWidth: 150,
    paddingLeft: 12,
    paddingRight: 10,
  },
  pickerOnSunken: { backgroundColor: colors.white },
  pickerText: { ...type.caption, color: colors.dark, flexShrink: 1 },
  // The chips run to the screen edges, so a cut-off chip reads as "more".
  chipRail: { marginHorizontal: -16 },
  chips: { gap: 8, paddingHorizontal: 16 },
  menu: {
    alignSelf: "flex-end",
    backgroundColor: colors.white,
    borderRadius: radius.media,
    paddingVertical: 6,
    position: "absolute",
    right: 16,
    top: 58,
    width: 240,
  },
  menuRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: 16,
  },
  menuRowActive: { backgroundColor: colors.primaryTint },
  menuText: { ...type.bodyStrong, color: colors.dark },
  menuCount: { ...type.small, color: colors.muted },
  bottom: { bottom: 0, left: 0, position: "absolute", right: 0 },
  locateWrap: {
    alignItems: "flex-end",
    gap: 10,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  locate: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  toast: {
    ...type.small,
    backgroundColor: colors.white,
    borderRadius: radius.thumb,
    color: colors.dark,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.panel,
    borderTopRightRadius: radius.panel,
    gap: 16,
    paddingHorizontal: gutter,
    paddingTop: 18,
  },
  summary: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCopy: { flex: 1, gap: 2 },
  summaryCount: { ...type.item, color: colors.dark },
  summaryWhere: { ...type.small, color: colors.muted },
  sheetBody: { gap: 16 },
  sheetPlace: { flexDirection: "row", gap: 14 },
  sheetImage: { borderRadius: 16, height: 96, width: 96 },
  sheetClose: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  sheetTitle: { ...type.section, color: colors.dark },
  sheetActions: { flexDirection: "row", gap: 10 },
  grow: { flex: 1 },
  pager: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  status: { ...type.smallStrong },
  list: { paddingHorizontal: gutter },
  listHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingTop: 8,
  },
  count: { ...type.item, color: colors.dark },
  listNotice: {
    ...type.small,
    backgroundColor: colors.white,
    borderRadius: radius.thumb,
    color: colors.dark,
    left: gutter,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: "absolute",
    right: gutter,
    top: 140,
  },
  loading: { marginTop: 32 },
  empty: {
    ...type.body,
    color: colors.body,
    paddingVertical: 32,
    textAlign: "center",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
  },
  divider: { borderTopColor: colors.border, borderTopWidth: 1 },
  rowMain: { alignItems: "center", flex: 1, flexDirection: "row", gap: 12 },
  rowPressed: { opacity: 0.7 },
  rowImage: { borderRadius: radius.thumb, height: 60, width: 60 },
  rowImageFallback: {
    alignItems: "center",
    backgroundColor: colors.primaryTint,
    justifyContent: "center",
  },
  rowCopy: { flex: 1, gap: 2 },
  category: { ...type.caption, color: colors.primary, lineHeight: 16 },
  rowTitle: {
    color: colors.dark,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 21,
  },
  metaRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  meta: { ...type.small, color: colors.muted, flexShrink: 1, fontSize: 13 },
  rowMapButton: {
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  rowMapButtonPressed: { backgroundColor: colors.primaryTint },
  mapToggleWrap: {
    alignItems: "center",
    left: 0,
    position: "absolute",
    right: 0,
  },
  mapToggle: {
    alignItems: "center",
    backgroundColor: colors.dark,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 8,
    height: 44,
    paddingHorizontal: 20,
  },
  mapTogglePressed: { opacity: 0.85 },
  mapToggleText: { ...type.smallStrong, color: colors.white },
});
