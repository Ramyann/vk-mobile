import { useMemo } from "react";
import type { MapPin } from "./NativeMap";
import type { WebMapMessage } from "./webPlacesMapHtml";

export interface WebMapCamera {
  coordinates: { latitude: number; longitude: number };
  zoom: number;
}

/** The messages that bring the page in line with the app's current state. */
export function useStateMessages(
  pins: MapPin[],
  selectedId: string | null,
  camera: WebMapCamera,
  insets: { top: number; bottom: number },
): WebMapMessage[] {
  const pinKey = pins.map((pin) => pin.id).join(",");
  const { latitude, longitude } = camera.coordinates;
  return useMemo(
    () => [
      {
        type: "pins",
        pins: pins.map((pin) => ({
          id: pin.id,
          latitude: pin.latitude,
          longitude: pin.longitude,
          color: pin.color,
        })),
      },
      { type: "select", id: selectedId },
      {
        type: "camera",
        latitude,
        longitude,
        zoom: camera.zoom,
        top: insets.top,
        bottom: insets.bottom,
      },
    ],
    // Pins are compared by id so a re-render with the same places is free.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      pinKey,
      selectedId,
      latitude,
      longitude,
      camera.zoom,
      insets.top,
      insets.bottom,
    ],
  );
}
