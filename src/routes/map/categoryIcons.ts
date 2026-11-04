import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

/**
 * The dashboard's category icon names (backend LOCATION_CATEGORY_ICONS) as
 * the nearest Ionicons glyph for chips and lists, and SF Symbol for Apple Maps
 * pins. The website draws the same names with Lucide icons.
 */
const ICONS: Record<string, { ionicon: IoniconName; symbol: string }> = {
  landmark: { ionicon: "business-outline", symbol: "building.columns.fill" },
  castle: { ionicon: "business-outline", symbol: "building.columns.fill" },
  mosque: { ionicon: "moon-outline", symbol: "moon.stars.fill" },
  church: { ionicon: "add-outline", symbol: "cross.fill" },
  heritage: { ionicon: "library-outline", symbol: "scroll.fill" },
  memorial: { ionicon: "flag-outline", symbol: "flag.fill" },
  nature: { ionicon: "leaf-outline", symbol: "tree.fill" },
  park: { ionicon: "leaf-outline", symbol: "leaf.fill" },
  mountain: { ionicon: "triangle-outline", symbol: "mountain.2.fill" },
  snow: { ionicon: "snow-outline", symbol: "snowflake" },
  water: { ionicon: "water-outline", symbol: "water.waves" },
  waterfall: { ionicon: "water-outline", symbol: "drop.fill" },
  camping: { ionicon: "bonfire-outline", symbol: "tent.fill" },
  viewpoint: { ionicon: "binoculars-outline", symbol: "binoculars.fill" },
  restaurant: { ionicon: "restaurant-outline", symbol: "fork.knife" },
  cafe: { ionicon: "cafe-outline", symbol: "cup.and.saucer.fill" },
  sweets: { ionicon: "ice-cream-outline", symbol: "birthday.cake.fill" },
  nightlife: { ionicon: "wine-outline", symbol: "wineglass.fill" },
  shopping: { ionicon: "bag-handle-outline", symbol: "bag.fill" },
  bazaar: { ionicon: "storefront-outline", symbol: "storefront.fill" },
  hotel: { ionicon: "bed-outline", symbol: "bed.double.fill" },
  art: { ionicon: "color-palette-outline", symbol: "paintpalette.fill" },
  culture: { ionicon: "happy-outline", symbol: "theatermasks.fill" },
  music: { ionicon: "musical-notes-outline", symbol: "music.note" },
  family: {
    ionicon: "people-outline",
    symbol: "figure.2.and.child.holdinghands",
  },
  sports: { ionicon: "trophy-outline", symbol: "trophy.fill" },
  photo: { ionicon: "camera-outline", symbol: "camera.fill" },
  library: { ionicon: "book-outline", symbol: "book.fill" },
  wellness: { ionicon: "sparkles-outline", symbol: "sparkles" },
  village: { ionicon: "home-outline", symbol: "house.fill" },
  city: { ionicon: "business-outline", symbol: "building.2.fill" },
  adventure: { ionicon: "compass-outline", symbol: "safari.fill" },
  airport: { ionicon: "airplane-outline", symbol: "airplane" },
  highlight: { ionicon: "star-outline", symbol: "star.fill" },
};

export const categoryIonicon = (icon?: string): IoniconName =>
  (icon && ICONS[icon]?.ionicon) || "location-outline";

export const categorySymbol = (icon?: string): string =>
  (icon && ICONS[icon]?.symbol) || "mappin";
