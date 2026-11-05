/**
 * A one-pin map page, drawn with MapLibre and OpenFreeMap's Positron style:
 * the website's own basemap (vk-frontend-v2 src/components/map/mapStyle.ts),
 * free and without an account or key. Used where native maps are not
 * available, such as Expo Go and the web preview.
 */
const MAPLIBRE = "https://unpkg.com/maplibre-gl@4.7.1/dist";
const STYLE = "https://tiles.openfreemap.org/styles/positron";

export function locationMapHtml({
  latitude,
  longitude,
  zoom = 12.5,
  pin = "#EDFF81",
  ring = "#36196D",
}: {
  latitude: number;
  longitude: number;
  zoom?: number;
  pin?: string;
  ring?: string;
}): string {
  const center = JSON.stringify([longitude, latitude]);
  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${MAPLIBRE}/maplibre-gl.css">
<style>
  html,body,#map{margin:0;height:100%;width:100%;background:#E9E7E0}
  .pin{width:18px;height:18px;border-radius:50%;background:${pin};border:3px solid ${ring};box-shadow:0 2px 8px rgba(20,20,20,.25)}
  .maplibregl-ctrl-attrib{font:10px/1.4 system-ui,sans-serif}
</style>
</head><body>
<div id="map"></div>
<script src="${MAPLIBRE}/maplibre-gl.js"></script>
<script>
  var map = new maplibregl.Map({
    container: "map",
    style: "${STYLE}",
    center: ${center},
    zoom: ${zoom},
    interactive: false,
    attributionControl: { compact: true }
  });
  var el = document.createElement("div");
  el.className = "pin";
  new maplibregl.Marker({ element: el }).setLngLat(${center}).addTo(map);
  // Start the credits folded into the "i" button; a tap shows them.
  map.on("load", function () {
    var credits = document.querySelector(".maplibregl-ctrl-attrib");
    if (credits) credits.classList.remove("maplibregl-compact-show");
  });
</script>
</body></html>`;
}
