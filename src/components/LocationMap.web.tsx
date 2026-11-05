import { createElement, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { locationMapHtml } from "./locationMapHtml";

/**
 * The web preview's version of LocationMap: the same page in an iframe. It
 * loads from a blob URL rather than `srcdoc`, because MapLibre's tile worker
 * stalls in a `srcdoc` frame and the map stays blank.
 */
export function LocationMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const url = useMemo(
    () =>
      URL.createObjectURL(
        new Blob([locationMapHtml({ latitude, longitude })], {
          type: "text/html",
        }),
      ),
    [latitude, longitude],
  );
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {createElement("iframe", {
        src: url,
        style: { border: 0, height: "100%", width: "100%" },
        tabIndex: -1,
        title: "Location map",
      })}
    </View>
  );
}
