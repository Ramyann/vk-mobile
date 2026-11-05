/**
 * The /map page's map for places where native maps are not available (Expo
 * Go, the web preview): MapLibre with OpenFreeMap's Positron style, the
 * website's own basemap, free and without a key.
 *
 * The page and the app talk in small JSON messages. The app sends
 * `pins`, `select` and `camera`; the page answers `ready` once the map has
 * loaded and `pick` when a pin is tapped. Written in ES5 for older WebViews.
 */
const MAPLIBRE = "https://unpkg.com/maplibre-gl@4.7.1/dist";
const STYLE = "https://tiles.openfreemap.org/styles/positron";

export type WebMapMessage =
  | {
      type: "pins";
      pins: Array<{
        id: string;
        latitude: number;
        longitude: number;
        color: string;
      }>;
    }
  | { type: "select"; id: string | null }
  | {
      type: "camera";
      latitude: number;
      longitude: number;
      zoom: number;
      top: number;
      bottom: number;
    };

export function webPlacesMapHtml({
  lime = "#EDFF81",
  purple = "#36196D",
}: { lime?: string; purple?: string } = {}): string {
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${MAPLIBRE}/maplibre-gl.css">
<style>
  html,body,#map{margin:0;height:100%;width:100%;background:#E9E7E0}
  .maplibregl-ctrl-attrib{font:10px/1.4 system-ui,sans-serif}
</style>
</head><body>
<div id="map"></div>
<script src="${MAPLIBRE}/maplibre-gl.js"></script>
<script>
  var map = new maplibregl.Map({
    container: "map",
    style: "${STYLE}",
    center: [44.4, 36.3],
    zoom: 6.6,
    attributionControl: { compact: true },
    dragRotate: false
  });
  map.touchZoomRotate.disableRotation();
  var ready = false;
  var queue = [];

  function send(message) {
    var text = JSON.stringify(message);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    else if (window.parent) window.parent.postMessage({ vkMapOut: text }, "*");
  }

  function handle(message) {
    if (message.type === "pins") {
      map.getSource("places").setData({
        type: "FeatureCollection",
        features: message.pins.map(function (pin) {
          return {
            type: "Feature",
            properties: { id: pin.id, color: pin.color },
            geometry: { type: "Point", coordinates: [pin.longitude, pin.latitude] }
          };
        })
      });
    } else if (message.type === "select") {
      map.setFilter("selected", ["==", ["get", "id"], message.id || ""]);
    } else if (message.type === "camera") {
      map.easeTo({
        center: [message.longitude, message.latitude],
        zoom: message.zoom,
        duration: 600,
        padding: { top: message.top, bottom: message.bottom, left: 0, right: 0 }
      });
    }
  }

  window.receive = function (message) {
    if (ready) handle(message);
    else queue.push(message);
  };
  window.addEventListener("message", function (event) {
    if (event.data && event.data.vkMapIn) window.receive(JSON.parse(event.data.vkMapIn));
  });

  map.on("load", function () {
    map.addSource("places", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addLayer({
      id: "places",
      type: "circle",
      source: "places",
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 5, 12, 9],
        "circle-color": ["get", "color"],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FFFFFF"
      }
    });
    map.addLayer({
      id: "selected",
      type: "circle",
      source: "places",
      filter: ["==", ["get", "id"], ""],
      paint: {
        "circle-radius": 11,
        "circle-color": "${lime}",
        "circle-stroke-width": 4,
        "circle-stroke-color": "${purple}"
      }
    });
    map.on("click", "places", function (event) {
      var feature = event.features && event.features[0];
      if (feature) send({ type: "pick", id: String(feature.properties.id) });
    });
    map.on("mouseenter", "places", function () { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "places", function () { map.getCanvas().style.cursor = ""; });
    var credits = document.querySelector(".maplibregl-ctrl-attrib");
    if (credits) credits.classList.remove("maplibregl-compact-show");
    ready = true;
    queue.forEach(handle);
    queue = [];
    send({ type: "ready" });
  });
</script>
</body></html>`;
}
