import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { locationMapHtml } from "./locationMapHtml";

/**
 * A still, one-pin map for a detail screen where native maps are not
 * available. Taps fall through to the parent, which opens directions.
 */
export function LocationMap({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <WebView
        javaScriptEnabled
        originWhitelist={["*"]}
        scrollEnabled={false}
        // A real origin, not about:blank, so MapLibre's tile worker can fetch.
        source={{
          baseUrl: "https://visitkurdistan.krd/",
          html: locationMapHtml({ latitude, longitude }),
        }}
        style={styles.map}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  map: { backgroundColor: "transparent", flex: 1 },
});
