import { useEffect, type ComponentProps } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../../components/ui/Text";
import { useTabBarSpace } from "../../components/ui/TabBar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ContentItem } from "../../api/content";
import { contentTypeLabel, metaLine } from "../../components/ContentCard";
import { Button } from "../../components/ui/Button";
import { BackButton, RoundAction } from "../../components/ui/ScreenHeader";
import { useContentDetail } from "../../hooks/useContentDetail";
import { isRtl, type AppLocale } from "../../i18n/locale";
import { webT } from "../../i18n/web";
import { cacheSavedDetail } from "../../lib/offline-content";
import { openingStatus, summariseHours } from "../../lib/opening-hours";
import { NativeMap, nativeMapsAvailable } from "../map/NativeMap";
import { LocationMap } from "../../components/LocationMap";
import { colors, gutter, radius, topSpace } from "../../styles/tokens";
import { type } from "../../styles/typography";
import { ta } from "../../i18n/app-messages";

type IconName = ComponentProps<typeof Ionicons>["name"];

const PHOTO_HEIGHT = 440;

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
  const t = webT(locale);
  const rtl = isRtl(locale);
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const { detail, loading } = useContentDetail(item, locale, saved);
  const display = detail ?? item;
  useEffect(() => {
    if (saved && detail) void cacheSavedDetail(item, detail);
  }, [detail, item, saved]);

  const coordinates =
    detail?.latitude !== undefined && detail.longitude !== undefined
      ? { latitude: detail.latitude, longitude: detail.longitude }
      : null;
  const directionsUrl = coordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`
    : null;

  const status = detail?.openingHoursRaw?.length
    ? openingStatus(detail.openingHoursRaw)
    : null;
  const statusLine = !status
    ? null
    : status.kind === "open24"
      ? { open: true, label: t("places.open24Hours"), detail: "" }
      : status.kind === "open"
        ? {
            open: true,
            label: t("exploreMap.openNow"),
            detail: t("exploreMap.closesAt", { time: status.closesAt }),
          }
        : status.kind === "closed"
          ? {
              open: false,
              label: t("exploreMap.closedNow"),
              detail: t("exploreMap.opensAt", { time: status.opensAt }),
            }
          : { open: false, label: t("exploreMap.closedToday"), detail: "" };

  const facts: Array<{ icon: IconName; label: string; value: string }> = [];
  if (display.type === "event" && display.date)
    facts.push({
      icon: "calendar-outline",
      label: ta(locale, "date"),
      value: metaLine(display, locale),
    });
  if (detail?.openingHours.length)
    facts.push({
      icon: "time-outline",
      label: t("destinations.openingHours"),
      value: summariseHours(
        detail.openingHours,
        t("places.open24Hours"),
        (hours) => ta(locale, "everyDay", { hours }),
        (hours) => ta(locale, "everyDayFrom", { hours }),
      ),
    });
  if (detail?.destination)
    facts.push({
      icon: "location-outline",
      label: ta(locale, "governorate"),
      value: detail.destination,
    });
  if (detail?.arrivalAirport)
    facts.push({
      icon: "airplane-outline",
      label: ta(locale, "arrivalAirport"),
      value: detail.arrivalAirport,
    });
  if (detail?.departureAirport)
    facts.push({
      icon: "airplane-outline",
      label: ta(locale, "departureAirport"),
      value: detail.departureAirport,
    });

  const about = detail?.body || display.excerpt;

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarSpace }}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={display.image ? { uri: display.image } : undefined}
          style={[styles.photo, !display.image && styles.photoFallback]}
        >
          <LinearGradient
            colors={["rgba(20,20,20,0.45)", "rgba(20,20,20,0)"]}
            style={styles.topScrim}
          />
          <View style={[styles.photoActions, { top: insets.top + topSpace }]}>
            <BackButton onPress={onBack} rtl={rtl} tone="glass" />
          </View>
        </ImageBackground>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.category}>
                {display.label || contentTypeLabel(display.type, locale)}
              </Text>
              <Text accessibilityRole="header" style={styles.title}>
                {display.title}
              </Text>
              {statusLine ? (
                <View style={styles.statusRow}>
                  <Ionicons
                    color={statusLine.open ? colors.teal : colors.danger}
                    name="time-outline"
                    size={18}
                  />
                  <Text
                    style={[
                      styles.status,
                      { color: statusLine.open ? colors.teal : colors.danger },
                    ]}
                  >
                    {statusLine.label}
                  </Text>
                  {statusLine.detail ? (
                    <Text style={styles.statusDetail}>{statusLine.detail}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
            {/* Directions and saving sit beside the title, a little above
                it, instead of in a bar at the bottom. */}
            <View style={styles.titleActions}>
              {directionsUrl ? (
                <RoundAction
                  label={ta(locale, "getDirections")}
                  onPress={() => void Linking.openURL(directionsUrl)}
                >
                  <Ionicons
                    color={colors.primary}
                    name="navigate-outline"
                    size={21}
                  />
                </RoundAction>
              ) : null}
              <RoundAction
                active={saved}
                label={ta(locale, saved ? "savedToJourney" : "saveToJourney")}
                onPress={onToggleSaved}
              >
                <Ionicons
                  color={saved ? colors.lime : colors.primary}
                  name={saved ? "bookmark" : "bookmark-outline"}
                  size={21}
                />
              </RoundAction>
            </View>
          </View>

          {facts.length ? (
            <View>
              {facts.map((fact, index) => (
                <View
                  key={fact.label}
                  style={[styles.fact, index > 0 && styles.divider]}
                >
                  <Ionicons color={colors.primary} name={fact.icon} size={22} />
                  <View style={styles.factCopy}>
                    <Text style={styles.factLabel}>{fact.label}</Text>
                    <Text style={styles.factValue}>{fact.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}

          {about ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{ta(locale, "about")}</Text>
              <Text style={styles.about}>{about}</Text>
            </View>
          ) : null}

          {coordinates ? (
            <View style={styles.sectionWide}>
              <Text style={styles.sectionTitle}>{ta(locale, "location")}</Text>
              <Pressable
                accessibilityLabel={ta(locale, "getDirections")}
                accessibilityRole="button"
                onPress={() =>
                  directionsUrl && void Linking.openURL(directionsUrl)
                }
                style={styles.mapBox}
              >
                {nativeMapsAvailable ? (
                  <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                    <NativeMap
                      camera={{ coordinates, zoom: 12 }}
                      onPick={() => undefined}
                      pins={[
                        {
                          id: display.id,
                          title: display.title,
                          color: colors.primary,
                          ...coordinates,
                        },
                      ]}
                      showsLocation={false}
                    />
                  </View>
                ) : (
                  <LocationMap {...coordinates} />
                )}
              </Pressable>
            </View>
          ) : null}

          {detail?.links.length ? (
            <View style={styles.links}>
              {detail.links.map((entry) => (
                <Button
                  key={entry.url}
                  kind="quiet"
                  label={entry.label}
                  onPress={() => void Linking.openURL(entry.url)}
                />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  photo: { height: PHOTO_HEIGHT, width: "100%" },
  photoFallback: { backgroundColor: colors.primary },
  topScrim: { height: 160, left: 0, position: "absolute", right: 0, top: 0 },
  photoActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    left: gutter,
    position: "absolute",
    right: gutter,
  },
  content: {
    gap: 20,
    paddingBottom: 32,
    paddingHorizontal: gutter,
    paddingTop: 24,
  },
  titleRow: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
  titleBlock: { flex: 1, gap: 8 },
  titleActions: { flexDirection: "row", gap: 8, marginTop: -6 },
  category: { ...type.caption, color: colors.primary },
  title: { ...type.title, color: colors.dark },
  statusRow: { alignItems: "center", flexDirection: "row", gap: 6 },
  status: { ...type.smallStrong },
  statusDetail: { ...type.small, color: colors.muted },
  fact: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 14,
    paddingVertical: 14,
  },
  divider: { borderTopColor: colors.border, borderTopWidth: 1 },
  factCopy: { flex: 1, gap: 2, marginTop: -2 },
  factLabel: { ...type.caption, color: colors.muted },
  factValue: { ...type.bodyStrong, color: colors.dark },
  loading: { alignItems: "flex-start" },
  section: { gap: 10 },
  sectionWide: { gap: 12 },
  sectionTitle: { ...type.section, color: colors.dark },
  about: { ...type.bodyLarge, color: colors.body },
  mapBox: {
    backgroundColor: colors.mapOutside,
    borderRadius: radius.media,
    height: 200,
    overflow: "hidden",
  },
  links: { alignItems: "flex-start" },
});
