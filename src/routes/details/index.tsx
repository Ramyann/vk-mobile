import { useEffect, type ComponentProps } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type ContentItem } from "../../api/content";
import { CONTENT_TYPE_LABEL, metaLine } from "../../components/ContentCard";
import { Button } from "../../components/ui/Button";
import { BackButton, RoundAction } from "../../components/ui/ScreenHeader";
import { useContentDetail } from "../../hooks/useContentDetail";
import { isRtl, type AppLocale } from "../../i18n/locale";
import { webT } from "../../i18n/web";
import { cacheSavedDetail } from "../../lib/offline-content";
import { openingStatus, summariseHours } from "../../lib/opening-hours";
import { NativeMap, nativeMapsAvailable } from "../map/NativeMap";
import { colors, gutter, radius } from "../../styles/tokens";
import { type } from "../../styles/typography";

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
      label: "Dates",
      value: metaLine(display, locale),
    });
  if (detail?.openingHours.length)
    facts.push({
      icon: "time-outline",
      label: t("destinations.openingHours"),
      value: summariseHours(detail.openingHours, t("places.open24Hours")),
    });
  if (detail?.destination)
    facts.push({
      icon: "location-outline",
      label: "Governorate",
      value: detail.destination,
    });
  if (detail?.arrivalAirport)
    facts.push({
      icon: "airplane-outline",
      label: "Arrival airport",
      value: detail.arrivalAirport,
    });
  if (detail?.departureAirport)
    facts.push({
      icon: "airplane-outline",
      label: "Departure airport",
      value: detail.departureAirport,
    });

  const about = detail?.body || display.excerpt;

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={display.image ? { uri: display.image } : undefined}
          style={[styles.photo, !display.image && styles.photoFallback]}
        >
          <LinearGradient
            colors={["rgba(20,20,20,0.45)", "rgba(20,20,20,0)"]}
            style={styles.topScrim}
          />
          <View style={[styles.photoActions, { top: insets.top + 8 }]}>
            <BackButton onPress={onBack} rtl={rtl} tone="glass" />
            <RoundAction
              label={saved ? "Remove from saved" : "Save"}
              onPress={onToggleSaved}
              tone="glass"
            >
              <Ionicons
                color={colors.primary}
                name={saved ? "heart" : "heart-outline"}
                size={22}
              />
            </RoundAction>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          <View style={styles.titleBlock}>
            <Text style={styles.category}>
              {display.label || CONTENT_TYPE_LABEL[display.type]}
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
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.about}>{about}</Text>
            </View>
          ) : null}

          {coordinates ? (
            <View style={styles.sectionWide}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Pressable
                accessibilityLabel="Get directions"
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
                  <View style={styles.mapFallback}>
                    <View style={styles.pin} />
                    <Text style={styles.coordinates}>
                      {`${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`}
                    </Text>
                  </View>
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

      <View style={styles.actionBar}>
        {directionsUrl ? (
          <Button
            kind="secondary"
            label={t("exploreMap.directions")}
            onPress={() => void Linking.openURL(directionsUrl)}
          />
        ) : null}
        <Button
          kind="primary"
          label={saved ? "Saved to your journey" : "Save to your journey"}
          onPress={onToggleSaved}
          style={styles.saveButton}
        />
      </View>
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
  titleBlock: { gap: 8 },
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
  mapFallback: {
    alignItems: "center",
    backgroundColor: colors.mapLand,
    flex: 1,
    gap: 10,
    justifyContent: "center",
  },
  pin: {
    backgroundColor: colors.lime,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 18,
    width: 18,
  },
  coordinates: { ...type.small, color: colors.muted },
  links: { alignItems: "flex-start" },
  actionBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: gutter,
    paddingVertical: 12,
  },
  saveButton: { flex: 1 },
});
