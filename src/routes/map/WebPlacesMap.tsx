import { useEffect, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { MapPin } from "./NativeMap";
import { webPlacesMapHtml, type WebMapMessage } from "./webPlacesMapHtml";
import { useStateMessages, type WebMapCamera } from "./useWebMapState";

/**
 * The places map in a WebView, for Expo Go and Android builds without a
 * Google Maps key. The web preview uses WebPlacesMap.web.tsx instead.
 */
export function WebPlacesMap({
  pins,
  selectedId,
  camera,
  insets,
  onPick,
}: {
  pins: MapPin[];
  selectedId: string | null;
  camera: WebMapCamera;
  /** Room the floating controls take, so a picked pin stays visible. */
  insets: { top: number; bottom: number };
  onPick: (id: string) => void;
}) {
  const ref = useRef<WebView>(null);
  const ready = useRef(false);
  const html = useMemo(() => webPlacesMapHtml(), []);
  const send = (message: WebMapMessage) => {
    if (!ready.current) return;
    ref.current?.injectJavaScript(
      `window.receive(${JSON.stringify(message)}); true;`,
    );
  };
  const state = useStateMessages(pins, selectedId, camera, insets);
  useEffect(() => state.forEach(send), [state]);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        id?: string;
      };
      if (message.type === "ready") {
        ready.current = true;
        state.forEach(send);
      } else if (message.type === "pick" && message.id) onPick(message.id);
    } catch {
      // Not one of the map's messages.
    }
  };

  return (
    <WebView
      javaScriptEnabled
      onMessage={onMessage}
      originWhitelist={["*"]}
      ref={ref}
      // A real origin, not about:blank, so MapLibre's tile worker can fetch.
      source={{ baseUrl: "https://visitkurdistan.krd/", html }}
      style={StyleSheet.absoluteFill}
    />
  );
}
