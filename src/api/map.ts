import { API_URL } from "../config/environment";
import type { AppLocale } from "../i18n/locale";
import { allTranslations, resolveLocalized } from "../lib/localized";

export type Season = "spring" | "summer" | "autumn" | "winter";
export const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

/** One pin from `GET /locations/map?lang=all`, kept with every translation. */
export interface MapPin {
  id: string;
  slug: string;
  name: unknown;
  latitude: number;
  longitude: number;
  image: string | null;
  category: {
    id: string;
    name: unknown;
    icon: string | null;
    color: string | null;
    showInMapFilter: boolean;
  } | null;
  governorate: { id: string; slug: string; name: unknown } | null;
  seasons: Season[];
  allSeasons: boolean;
}

/** A pin resolved into the visitor's language. */
export interface MapPlace {
  id: string;
  slug: string;
  name: string;
  searchNames: string[];
  latitude: number;
  longitude: number;
  image: string | null;
  categoryId?: string;
  category?: string;
  categoryIcon?: string;
  color: string;
  categoryInFilter: boolean;
  governorate?: { slug: string; name: string };
  seasons: Season[];
  allSeasons: boolean;
}

/** Brand purple — the website's pin colour when a category has none. */
export const DEFAULT_PIN_COLOR = "#36196D";

type RecordValue = Record<string, unknown>;
const isRecord = (value: unknown): value is RecordValue =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const finite = (value: unknown): number | null => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
};

export function parseMapPins(payload: unknown): MapPin[] {
  const root = isRecord(payload) ? (payload.data ?? payload.items) : payload;
  if (!Array.isArray(root)) return [];
  return root.flatMap((row): MapPin[] => {
    if (!isRecord(row)) return [];
    const latitude = finite(row.latitude);
    const longitude = finite(row.longitude);
    if (!row.id || !row.slug || latitude === null || longitude === null)
      return [];
    const category = isRecord(row.category) ? row.category : null;
    const governorate = isRecord(row.governorate) ? row.governorate : null;
    return [
      {
        id: String(row.id),
        slug: String(row.slug),
        name: row.name,
        latitude,
        longitude,
        image:
          typeof row.imageSrc === "string" && row.imageSrc.trim()
            ? row.imageSrc
            : null,
        category: category
          ? {
              id: String(category.id ?? ""),
              name: category.name,
              icon: typeof category.icon === "string" ? category.icon : null,
              color:
                typeof category.color === "string" &&
                /^#[0-9a-f]{6}$/i.test(category.color)
                  ? category.color
                  : null,
              showInMapFilter: category.showInMapFilter !== false,
            }
          : null,
        governorate:
          governorate && typeof governorate.slug === "string"
            ? {
                id: String(governorate.id ?? governorate.slug),
                slug: governorate.slug,
                name: governorate.name,
              }
            : null,
        seasons: Array.isArray(row.seasons)
          ? SEASONS.filter((season) =>
              (row.seasons as unknown[]).includes(season),
            )
          : [],
        allSeasons: row.allSeasons === true,
      },
    ];
  });
}

export function resolveMapPins(pins: MapPin[], locale: AppLocale): MapPlace[] {
  return pins
    .flatMap((pin): MapPlace[] => {
      const name = resolveLocalized(pin.name, locale);
      if (!name) return [];
      const category = pin.category
        ? resolveLocalized(pin.category.name, locale)
        : "";
      const governorate = pin.governorate
        ? resolveLocalized(pin.governorate.name, locale)
        : "";
      return [
        {
          id: pin.id,
          slug: pin.slug,
          name,
          searchNames: allTranslations(pin.name),
          latitude: pin.latitude,
          longitude: pin.longitude,
          image: pin.image,
          categoryId: pin.category?.id || undefined,
          category: category || undefined,
          categoryIcon: pin.category?.icon ?? undefined,
          color: pin.category?.color ?? DEFAULT_PIN_COLOR,
          categoryInFilter: pin.category?.showInMapFilter !== false,
          governorate:
            pin.governorate && governorate
              ? { slug: pin.governorate.slug, name: governorate }
              : undefined,
          seasons: pin.seasons,
          allSeasons: pin.allSeasons,
        },
      ];
    })
    .sort((left, right) => left.name.localeCompare(right.name, locale));
}

/**
 * Every published place with coordinates, in one request. Fetched with
 * `lang=all` like the website so a language switch never refetches.
 */
export async function getMapPins(): Promise<MapPin[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${API_URL}/locations/map?lang=all`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error(`Map request failed (${response.status})`);
    return parseMapPins(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}
