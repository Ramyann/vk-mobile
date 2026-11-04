import type { MapPlace } from "../api/map";
import { foldForSearch } from "./localized";

export interface MapFilters {
  query: string;
  governorates: string[];
  categories: string[];
}

export type Facet = "governorates" | "categories";

export interface FacetOption {
  value: string;
  label: string;
  count: number;
  color?: string;
  icon?: string;
}

export const EMPTY_MAP_FILTERS: MapFilters = {
  query: "",
  governorates: [],
  categories: [],
};

const facetValue = (place: MapPlace, facet: Facet): string | undefined =>
  facet === "governorates" ? place.governorate?.slug : place.categoryId;

export const matchesQuery = (place: MapPlace, query: string): boolean => {
  const folded = foldForSearch(query);
  if (!folded) return true;
  return [place.name, ...place.searchNames].some((name) =>
    foldForSearch(name).includes(folded),
  );
};

/**
 * Values in one facet are OR'd; facets and the search are AND'd. `except`
 * skips one facet, which is how each option's count is worked out — picking
 * Duhok still shows how many places Erbil has.
 */
export function filterMapPlaces(
  places: readonly MapPlace[],
  filters: MapFilters,
  except?: Facet,
): MapPlace[] {
  return places.filter((place) => {
    if (!matchesQuery(place, filters.query)) return false;
    return (["governorates", "categories"] as Facet[]).every((facet) => {
      if (facet === except || !filters[facet].length) return true;
      const value = facetValue(place, facet);
      return value !== undefined && filters[facet].includes(value);
    });
  });
}

/** Options come from the pins themselves; busiest first, never hidden at 0. */
export function facetOptions(
  places: readonly MapPlace[],
  filters: MapFilters,
  facet: Facet,
): FacetOption[] {
  const totals = new Map<string, FacetOption & { total: number }>();
  for (const place of places) {
    if (facet === "categories" && !place.categoryInFilter) continue;
    const value = facetValue(place, facet);
    const label =
      facet === "governorates" ? place.governorate?.name : place.category;
    if (!value || !label) continue;
    const entry = totals.get(value) ?? {
      value,
      label,
      count: 0,
      total: 0,
      ...(facet === "categories"
        ? { color: place.color, icon: place.categoryIcon }
        : {}),
    };
    entry.total += 1;
    totals.set(value, entry);
  }
  for (const place of filterMapPlaces(places, filters, facet)) {
    const value = facetValue(place, facet);
    const entry = value ? totals.get(value) : undefined;
    if (entry) entry.count += 1;
  }
  return [...totals.values()]
    .sort(
      (left, right) =>
        right.total - left.total || left.label.localeCompare(right.label),
    )
    .map(({ total: _total, ...option }) => option);
}

export const toggleValue = (values: string[], value: string): string[] =>
  values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];

type Coordinates = { latitude: number; longitude: number };

/** Great-circle distance in km. */
export function distanceKm(from: Coordinates, to: Coordinates): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitude = toRadians(to.latitude - from.latitude);
  const longitude = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(latitude / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) *
      Math.cos(toRadians(to.latitude)) *
      Math.sin(longitude / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** The box the backend uses for the region; distances only show inside it. */
export const isInRegion = ({ latitude, longitude }: Coordinates): boolean =>
  latitude >= 33 && latitude <= 38.5 && longitude >= 40 && longitude <= 48;

/** One decimal under 10 km, whole km from 10 up — as the website shows it. */
export const formatDistance = (km: number): string =>
  km < 10 ? km.toFixed(1) : String(Math.round(km));
