import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Location from "expo-location";
import { AppleMaps, GoogleMaps } from "expo-maps";
import { getContentPage, type ContentItem } from "../../api/content";
import { ContentCard } from "../../components/ContentCard";
import { EmptyState } from "../../components/EmptyState";
import type { AppLocale } from "../../i18n/locale";
import { colors, radius } from "../../styles/tokens";

type Coordinates = { latitude: number; longitude: number };
const KURDISTAN_CENTER: Coordinates = { latitude: 36.1911, longitude: 44.0092 };

const toRadians = (value: number) => (value * Math.PI) / 180;
const distanceKm = (from: Coordinates, to: Coordinates) => {
  const radius = 6371;
  const latitude = toRadians(to.latitude - from.latitude);
  const longitude = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitude / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const coordinatesFor = (item: ContentItem): Coordinates | null =>
  item.latitude !== undefined && item.longitude !== undefined
    ? { latitude: item.latitude, longitude: item.longitude }
    : null;

export function NearbyPlacesScreen({
  locale,
  onBack,
  onOpen,
}: {
  locale: AppLocale;
  onBack: () => void;
  onOpen: (item: ContentItem) => void;
}) {
  const [places, setPlaces] = useState<ContentItem[]>([]);
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void getContentPage("place", locale, 1, 100)
      .then((page) => setPlaces(page.items.filter(coordinatesFor)))
      .catch(() =>
        setNotice("Nearby places are unavailable while content is offline."),
      )
      .finally(() => setLoading(false));
  }, [locale]);

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
      setNotice(
        "We could not get your current location. You can still browse the map.",
      );
    } finally {
      setLocating(false);
    }
  };

  const visible = useMemo(() => {
    const origin = position ?? KURDISTAN_CENTER;
    return [...places]
      .map((item) => ({
        item,
        distance: distanceKm(origin, coordinatesFor(item)!),
      }))
      .sort((left, right) => left.distance - right.distance);
  }, [places, position]);
  const camera = position ?? KURDISTAN_CENTER;
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
  const markers = visible.slice(0, 80).map(({ item }) => ({
    id: `${item.type}-${item.id}`,
    title: item.title,
    snippet: item.label,
    coordinates: coordinatesFor(item)!,
  }));
  const openMarker = ({ id }: { id?: string }) => {
    const item = places.find((entry) => `${entry.type}-${entry.id}` === id);
    if (item) onOpen(item);
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Pressable
        onPress={onBack}
        accessibilityLabel="Go back"
        style={styles.back}
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.eyebrow}>EXPLORE NEARBY</Text>
      <Text style={styles.title}>Places around you</Text>
      <Text style={styles.intro}>
        Use your location only while this screen is open to sort published
        places by distance.
      </Text>
      <Pressable
        disabled={locating}
        onPress={() => void locate()}
        style={styles.locationButton}
      >
        {locating ? (
          <ActivityIndicator color={colors.dark} />
        ) : (
          <Text style={styles.locationButtonText}>⌖ Use my location</Text>
        )}
      </Pressable>
      {canShowNativeMap ? (
        <View style={styles.map}>
          {Platform.OS === "ios" ? (
            <AppleMaps.View
              annotations={markers.map((marker) => ({
                ...marker,
                tintColor: colors.primary,
              }))}
              cameraPosition={{ coordinates: camera, zoom: position ? 9 : 6 }}
              onMarkerClick={openMarker}
              properties={{ isMyLocationEnabled: Boolean(position) }}
              style={StyleSheet.absoluteFill}
              uiSettings={{
                compassEnabled: true,
                myLocationButtonEnabled: true,
              }}
            />
          ) : (
            <GoogleMaps.View
              cameraPosition={{ coordinates: camera, zoom: position ? 9 : 6 }}
              markers={markers}
              onMarkerClick={openMarker}
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
          <Text style={styles.mapFallbackTitle}>
            Native map available in the installed app
          </Text>
          <Text style={styles.mapFallbackText}>
            {Platform.OS === "android" && isInternalBuild
              ? "Add the restricted Google Maps Android key, then create a new internal build."
              : "Install an internal development or preview build to use the native map."}
          </Text>
        </View>
      )}
      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      <Text style={styles.listHeading}>
        {position ? "Nearest places" : "Places in Kurdistan"}
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : visible.length ? (
        visible.map(({ item, distance }) => (
          <View key={`${item.type}-${item.id}`}>
            <ContentCard
              item={item}
              variant="list"
              onPress={() => onOpen(item)}
            />
            <Text style={styles.distance}>{Math.round(distance)} km away</Text>
          </View>
        ))
      ) : (
        <EmptyState
          title="No mapped places yet"
          detail="Locations appear here once they have coordinates in the dashboard."
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: colors.white, flex: 1 },
  content: { gap: 12, padding: 20, paddingBottom: 48 },
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
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.1,
  },
  intro: { color: colors.body, fontSize: 15, lineHeight: 22 },
  locationButton: {
    alignItems: "center",
    backgroundColor: colors.lime,
    borderRadius: radius.pill,
    justifyContent: "center",
    minHeight: 50,
    paddingHorizontal: 20,
  },
  locationButtonText: { color: colors.dark, fontSize: 15, fontWeight: "800" },
  map: {
    borderRadius: radius.card,
    height: 280,
    marginTop: 8,
    overflow: "hidden",
  },
  mapFallback: {
    alignItems: "center",
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    gap: 8,
    marginTop: 8,
    padding: 28,
  },
  mapFallbackTitle: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  mapFallbackText: {
    color: colors.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  notice: { color: colors.body, fontSize: 13, lineHeight: 19 },
  listHeading: {
    color: colors.dark,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 14,
  },
  loading: { marginVertical: 30 },
  distance: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 12,
    marginTop: -4,
  },
});
