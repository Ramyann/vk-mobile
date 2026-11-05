import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
import { colors, gutter, radius } from "../../styles/tokens";
import { fonts, type } from "../../styles/typography";
import { NativeMap, nativeMapsAvailable } from "./NativeMap";

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
  const showList = listOpen || !nativeMapsAvailable;

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
          accessibilityLabel="Go back"
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
      <ScrollView
        contentContainerStyle={styles.chips}
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
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
            label={`${option.label} ${formatNumber(option.count, locale)}`}
            selected={filters.categories.includes(option.value)}
            onPress={() =>
              setFilters((current) => ({
                ...current,
                categories: toggleValue(current.categories, option.value),
              }))
            }
          />
        ))}
      </ScrollView>
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
      <View style={[styles.listPage, { paddingTop: insets.top + 4 }]}>
        <StatusBar style="dark" />
        {controls}
        <FlatList
          contentContainerStyle={styles.list}
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
              <View style={styles.listActions}>
                {hasFilters ? (
                  <Button
                    kind="quiet"
                    label={t("exploreMap.clearAll")}
                    onPress={() => setFilters(EMPTY_MAP_FILTERS)}
                  />
                ) : null}
                {nativeMapsAvailable ? (
                  <Button
                    kind="quiet"
                    label={t("exploreMap.hideList")}
                    onPress={() => setListOpen(false)}
                  />
                ) : (
                  <LocateButton
                    locating={locating}
                    onPress={() => void locate()}
                  />
                )}
              </View>
              {notice ? <Text style={styles.notice}>{notice}</Text> : null}
              {!nativeMapsAvailable ? (
                <Text style={styles.notice}>
                  {t("exploreMap.mapUnavailable")}
                </Text>
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
              onPress={() => {
                if (nativeMapsAvailable) {
                  setSelectedId(item.id);
                  setListOpen(false);
                } else onOpen(toContentItem(item));
              }}
            />
          )}
        />
      </View>
    );

  return (
    <View style={styles.mapPage}>
      <StatusBar style="dark" />
      <View style={StyleSheet.absoluteFill}>
        <NativeMap
          camera={camera}
          onPick={setSelectedId}
          pins={visible.map((place) => ({
            id: place.id,
            title: place.name,
            category: place.category,
            categoryIcon: place.categoryIcon,
            color: place.color,
            latitude: place.latitude,
            longitude: place.longitude,
          }))}
          showsLocation={Boolean(position)}
        />
      </View>
      <View style={{ paddingTop: insets.top + 8 }}>{controls}</View>
      <View pointerEvents="box-none" style={styles.bottom}>
        <View pointerEvents="box-none" style={styles.locateWrap}>
          {notice ? (
            <Text style={[styles.toast, floating]}>{notice}</Text>
          ) : null}
          <LocateButton locating={locating} onPress={() => void locate()} />
        </View>
        <View
          style={[
            styles.sheet,
            floating,
            { paddingBottom: insets.bottom + 12 },
          ]}
        >
          <View style={styles.handle} />
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
            />
          ) : (
            <View style={styles.summary}>
              <Text style={styles.summaryCount}>
                {pins.isLoading
                  ? " "
                  : t("exploreMap.count", {
                      count: visible.length,
                      total: formatNumber(visible.length, locale),
                    })}
              </Text>
              <Button
                kind="secondary"
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
  onPress,
}: {
  locating: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel="Use my location"
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
  onPress,
}: {
  place: MapPlace;
  distance?: number;
  divider: boolean;
  locale: AppLocale;
  onPress: () => void;
}) {
  const t = webT(locale);
  const meta = place.governorate?.name;
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
      {place.image ? (
        <Image source={{ uri: place.image }} style={styles.rowImage} />
      ) : (
        <View
          style={[styles.rowImage, { backgroundColor: colors.primaryTint }]}
        />
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
        {meta ? (
          <Text numberOfLines={1} style={styles.meta}>
            {meta}
          </Text>
        ) : null}
        {distance !== undefined ? (
          <Text numberOfLines={1} style={styles.meta}>
            {t("exploreMap.distanceAway", {
              distance: formatDistance(distance),
            })}
          </Text>
        ) : null}
      </View>
    </Pressable>
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
}: {
  place: MapPlace;
  distance?: number;
  index: number;
  total: number;
  locale: AppLocale;
  onOpen: () => void;
  onStep: (step: 1 | -1) => void;
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
  chips: { gap: 8 },
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
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 5,
    width: 40,
  },
  summary: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCount: { ...type.item, color: colors.dark },
  sheetBody: { gap: 16 },
  sheetPlace: { flexDirection: "row", gap: 14 },
  sheetImage: { borderRadius: 16, height: 96, width: 96 },
  sheetTitle: { ...type.section, color: colors.dark },
  sheetActions: { flexDirection: "row", gap: 10 },
  grow: { flex: 1 },
  pager: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  status: { ...type.smallStrong },
  list: { paddingBottom: 32, paddingHorizontal: gutter },
  listHeader: { gap: 4, paddingTop: 12 },
  listActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
    position: "absolute",
    right: 0,
    top: 4,
  },
  count: { ...type.item, color: colors.dark, minHeight: 44, paddingTop: 10 },
  notice: { ...type.small, color: colors.muted, paddingBottom: 8 },
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
    gap: 14,
    paddingVertical: 12,
  },
  divider: { borderTopColor: colors.border, borderTopWidth: 1 },
  rowPressed: { backgroundColor: colors.soft },
  rowImage: { borderRadius: radius.thumb, height: 76, width: 76 },
  rowCopy: { flex: 1, gap: 3 },
  category: { ...type.caption, color: colors.primary },
  rowTitle: { ...type.item, color: colors.dark },
  meta: { ...type.small, color: colors.muted },
});
