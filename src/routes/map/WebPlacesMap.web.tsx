import { createElement, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import type { MapPin } from "./NativeMap";
import { useStateMessages, type WebMapCamera } from "./useWebMapState";
import { webPlacesMapHtml, type WebMapMessage } from "./webPlacesMapHtml";

/**
 * The web preview's places map: the same page in an iframe, loaded from a
 * blob URL (MapLibre's tile worker stalls in a `srcdoc` frame).
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
  insets: { top: number; bottom: number };
  onPick: (id: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const ready = useRef(false);
  const url = useMemo(
    () =>
      URL.createObjectURL(
        new Blob([webPlacesMapHtml()], { type: "text/html" }),
      ),
    [],
  );
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const state = useStateMessages(pins, selectedId, camera, insets);
  const latest = useRef(state);
  latest.current = state;
  const send = (message: WebMapMessage) => {
    if (!ready.current) return;
    frame.current?.contentWindow?.postMessage(
      { vkMapIn: JSON.stringify(message) },
      "*",
    );
  };
  useEffect(() => state.forEach(send), [state]);

  const pick = useRef(onPick);
  pick.current = onPick;
  useEffect(() => {
    const listen = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const text = (event.data as { vkMapOut?: string } | null)?.vkMapOut;
      if (!text) return;
      const message = JSON.parse(text) as { type?: string; id?: string };
      if (message.type === "ready") {
        ready.current = true;
        latest.current.forEach(send);
      } else if (message.type === "pick" && message.id)
        pick.current(message.id);
    };
    window.addEventListener("message", listen);
    return () => window.removeEventListener("message", listen);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {createElement("iframe", {
        ref: frame,
        src: url,
        style: { border: 0, height: "100%", width: "100%" },
        title: "Places map",
      })}
    </View>
  );
}
