import type { ReactElement } from "react";
import { Platform, StyleSheet } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { categorySymbol } from "./categoryIcons";

/**
 * Native maps need a development or store build (Expo Go has no expo-maps),
 * and on Android a Google Maps key in app.json.
 */
export const nativeMapsAvailable =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
  (Platform.OS === "ios" ||
    Boolean(
      (
        Constants.expoConfig?.android as
          | { config?: { googleMaps?: { apiKey?: string } } }
          | undefined
      )?.config?.googleMaps?.apiKey,
    ));

/**
 * expo-maps is loaded only where it exists: importing it in Expo Go throws
 * "Cannot find native module 'ExpoMaps'" before the app can start.
 */
const maps: typeof import("expo-maps") | null = nativeMapsAvailable
  ? (require("expo-maps") as typeof import("expo-maps"))
  : null;

export interface MapPin {
  id: string;
  title: string;
  category?: string;
  categoryIcon?: string;
  color: string;
  latitude: number;
  longitude: number;
}

/**
 * Apple Maps on iOS, Google Maps on Android. Kept in its own module so the
 * web preview, which has no expo-maps, loads NativeMap.web.tsx instead.
 */
export function NativeMap({
  pins,
  camera,
  showsLocation,
  onPick,
}: {
  pins: MapPin[];
  camera: {
    coordinates: { latitude: number; longitude: number };
    zoom: number;
  };
  showsLocation: boolean;
  onPick: (id: string) => void;
}): ReactElement | null {
  const markers = pins.map((pin) => ({
    id: pin.id,
    title: pin.title,
    coordinates: { latitude: pin.latitude, longitude: pin.longitude },
  }));
  const pick = ({ id }: { id?: string }) => {
    if (id) onPick(id);
  };
  if (!maps) return null;
  const { AppleMaps, GoogleMaps } = maps;
  if (Platform.OS === "ios")
    return (
      <AppleMaps.View
        cameraPosition={camera}
        markers={markers.map((marker, index) => ({
          ...marker,
          systemImage: categorySymbol(pins[index].categoryIcon),
          tintColor: pins[index].color,
        }))}
        onMarkerClick={pick}
        properties={{ isMyLocationEnabled: showsLocation }}
        style={StyleSheet.absoluteFill}
        uiSettings={{ compassEnabled: true }}
      />
    );
  return (
    <GoogleMaps.View
      cameraPosition={camera}
      markers={markers.map((marker, index) => ({
        ...marker,
        snippet: pins[index].category,
      }))}
      onMarkerClick={pick}
      properties={{ isMyLocationEnabled: showsLocation }}
      style={StyleSheet.absoluteFill}
      uiSettings={{
        compassEnabled: true,
        myLocationButtonEnabled: true,
        zoomControlsEnabled: true,
      }}
    />
  );
}
