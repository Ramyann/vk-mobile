import { API_URL } from "../config/environment";
import type { AppLocale } from "../i18n/locale";
import {
  parseOpeningHours,
  type OpeningHoursEntry,
} from "../lib/opening-hours";

export type ContentType =
  | "destination"
  | "place"
  | "event"
  | "story"
  | "package";

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  excerpt: string;
  image: string | null;
  slug: string;
  label?: string;
  date?: string;
  /** Original CMS image URL when the on-device copy is used offline. */
  remoteImage?: string | null;
  latitude?: number;
  longitude?: number;
}

export interface ContentDetail extends ContentItem {
  body: string;
  latitude?: number;
  longitude?: number;
  destination?: string;
  links: Array<{ label: string; url: string }>;
  openingHours: string[];
  /** The raw rows, for today's open/closed status. */
  openingHoursRaw?: OpeningHoursEntry[];
  /** Packages: where the trip starts and ends. */
  arrivalAirport?: string;
  departureAirport?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ContentPage {
  items: ContentItem[];
  page: number;
  hasNextPage: boolean;
}

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const unwrap = (payload: unknown): unknown => {
  if (!isRecord(payload)) return payload;
  const nested = payload.data ?? payload.items ?? payload.results;
  return nested === undefined ? payload : unwrap(nested);
};

const asList = (payload: unknown, keys: string[] = []): RecordValue[] => {
  const raw = unwrap(payload);
  if (Array.isArray(raw)) return raw.filter(isRecord);
  if (!isRecord(raw)) return [];
  for (const key of keys) {
    if (Array.isArray(raw[key])) return raw[key].filter(isRecord);
  }
  return [];
};

const text = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return "";
  const candidates = [
    value.en,
    value.ar,
    value.ckb,
    value.name,
    value.title,
    value.label,
  ];
  return candidates.map(text).find(Boolean) ?? "";
};

const imageUrl = (value: string): string => {
  if (/^(https?:)?\/\//.test(value)) return value;
  if (value.startsWith("/")) return `${API_URL}${value}`;
  return `${API_URL}/images/${encodeURIComponent(value)}`;
};

const image = (record: RecordValue | unknown[]): string | null => {
  if (Array.isArray(record)) {
    for (const item of record) {
      const found = image(isRecord(item) ? item : { value: item });
      if (found) return found;
    }
    return null;
  }
  const raw =
    record.featuredImage ??
    record.coverImage ??
    record.heroImage ??
    record.mediaUrl ??
    record.media ??
    record.posterImage ??
    record.images ??
    record.image ??
    record.imageUrl ??
    record.mediaUrl;
  if (typeof raw === "string" && raw.trim()) return imageUrl(raw);
  if (Array.isArray(raw)) return image(raw);
  if (isRecord(raw)) return image(raw);
  if (typeof record.value === "string") return imageUrl(record.value);
  return null;
};

const mapItem = (record: RecordValue, type: ContentType): ContentItem => ({
  id: String(record.id ?? record.slug ?? `${type}-${Math.random()}`),
  type,
  title:
    text(
      type === "story"
        ? (record.title ?? record.name)
        : (record.name ?? record.title ?? record.displayTitle),
    ) || "Untitled",
  excerpt: text(record.excerpt ?? record.overview ?? record.description),
  image: image(record),
  slug: String(record.slug ?? record.id ?? ""),
  label: text(record.category ?? record.type),
  date:
    typeof record.startDate === "string"
      ? record.startDate
      : typeof record.startAt === "string"
        ? record.startAt
        : undefined,
  latitude: number(record.latitude ?? record.lat),
  longitude: number(record.longitude ?? record.lng),
});

const number = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() &&
    Number.isFinite(Number(value))
  )
    return Number(value);
  return undefined;
};

const plainHtml = (value: string): string =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|div|blockquote)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const contentText = (value: unknown): string => {
  if (typeof value === "string") return plainHtml(value);
  if (Array.isArray(value))
    return value.map(contentText).filter(Boolean).join("\n\n");
  if (!isRecord(value)) return "";
  return [value.html, value.text, value.content, value.description, value.body]
    .map(contentText)
    .filter(Boolean)
    .join("\n\n");
};

const link = (
  value: unknown,
  label: string,
): { label: string; url: string } | null => {
  if (typeof value !== "string" || !value.trim()) return null;
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return { label, url };
};

const openingHoursText = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (
      !isRecord(entry) ||
      entry.isActive === false ||
      typeof entry.dayName !== "string"
    )
      return [];
    const start = [entry.startHour, entry.startMinute, entry.startPeriod]
      .filter((part) => typeof part === "string" && part.trim())
      .join(":")
      .replace(/:(am|pm)$/i, " $1");
    const end = [entry.endHour, entry.endMinute, entry.endPeriod]
      .filter((part) => typeof part === "string" && part.trim())
      .join(":")
      .replace(/:(am|pm)$/i, " $1");
    return [`${entry.dayName}: ${start && end ? `${start} – ${end}` : "Open"}`];
  });
};

const REQUEST_TIMEOUT_MS = 8_000;

export class ContentRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ContentRequestError";
  }
}

/**
 * Public content must fail into the app's usable empty state, rather than
 * leaving a physical-device preview on a spinner when an API host is wrong or
 * a captive Wi-Fi network drops the request.
 */
async function request(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ContentRequestError(
        `Request failed (${response.status})`,
        response.status,
      );
    }
    return response.json();
  } catch (error) {
    if ((error as { name?: string }).name === "AbortError") {
      throw new ContentRequestError(
        "The content service took too long to respond.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getExploreData(locale: AppLocale = "en"): Promise<{
  hero: ContentItem | null;
  destinations: ContentItem[];
  packages: ContentItem[];
  events: ContentItem[];
  stories: ContentItem[];
  faqs: FaqItem[];
}> {
  const home = await request(`/home?lang=${locale}`);
  const raw = unwrap(home);
  const source = isRecord(raw) ? raw : {};
  const hero =
    asList(source.heroBanners ?? source.banners).map((item) => ({
      ...mapItem(item, "destination"),
      title: text(item.name ?? item.title) || "Kurdistan is calling",
      excerpt: text(item.title ?? item.subtitle),
    }))[0] ?? null;
  return {
    hero,
    destinations: asList(
      source.featuredDestinations ?? source.destinations,
    ).map((item) => mapItem(item, "destination")),
    packages: asList(
      source.featuredPackages ?? source.travelPackages ?? source.packages,
    ).map((item) => mapItem(item, "package")),
    events: asList(source.upcomingEvents ?? source.events).map((item) =>
      mapItem(item, "event"),
    ),
    stories: asList(source.latestStories ?? source.stories).map((item) =>
      mapItem(item, "story"),
    ),
    faqs: asList(source.faqs)
      .map((item) => ({
        id: String(item.id ?? item.question),
        question: text(item.question),
        answer: text(item.answer),
      }))
      .filter((item) => item.question && item.answer),
  };
}

export async function getFaqs(locale: AppLocale = "en"): Promise<FaqItem[]> {
  const payload = await request(`/faqs?limit=100&lang=${locale}`);
  return asList(payload)
    .map((item) => ({
      id: String(item.id ?? item.question),
      question: text(item.question),
      answer: text(item.answer),
    }))
    .filter((item) => item.question && item.answer);
}

export async function getDiscoverData(
  locale: AppLocale = "en",
): Promise<ContentItem[]> {
  const [destinations, places, events, packages, stories] = await Promise.all([
    request(`/destinations?lang=${locale}&limit=100`),
    request(`/locations?lang=${locale}&limit=100`),
    request(`/events?lang=${locale}&limit=100`),
    request(`/packages?lang=${locale}&limit=100`),
    request(`/stories?lang=${locale}&limit=100`),
  ]);
  return [
    ...asList(destinations).map((item) => mapItem(item, "destination")),
    ...asList(places).map((item) => mapItem(item, "place")),
    ...asList(events).map((item) => mapItem(item, "event")),
    ...asList(packages).map((item) => mapItem(item, "package")),
    ...asList(stories).map((item) => mapItem(item, "story")),
  ];
}

/** Searches each existing public CMS endpoint on the server. */
export async function searchContent(
  query: string,
  locale: AppLocale = "en",
): Promise<ContentItem[]> {
  const search = query.trim();
  if (!search) return [];
  const encoded = encodeURIComponent(search);
  const [destinations, places, events, packages, stories] = await Promise.all([
    request(`/destinations?lang=${locale}&limit=12&search=${encoded}`),
    request(`/locations?lang=${locale}&limit=12&search=${encoded}`),
    request(`/events?lang=${locale}&limit=12&search=${encoded}`),
    request(`/packages?lang=${locale}&limit=12&search=${encoded}`),
    request(`/stories?lang=${locale}&limit=12&search=${encoded}`),
  ]);
  return [
    ...asList(destinations).map((item) => mapItem(item, "destination")),
    ...asList(places).map((item) => mapItem(item, "place")),
    ...asList(events).map((item) => mapItem(item, "event")),
    ...asList(packages).map((item) => mapItem(item, "package")),
    ...asList(stories).map((item) => mapItem(item, "story")),
  ];
}

/** A paginated catalogue request for native browse pages. */
export async function getContentPage(
  type: ContentType,
  locale: AppLocale = "en",
  page = 1,
  limit = 20,
): Promise<ContentPage> {
  const endpoint: Record<ContentType, string> = {
    destination: "destinations",
    place: "locations",
    event: "events",
    package: "packages",
    story: "stories",
  };
  const payload = await request(
    `/${endpoint[type]}?lang=${locale}&limit=${limit}&page=${page}`,
  );
  const root = isRecord(payload) ? payload : {};
  const meta = isRecord(root.meta)
    ? root.meta
    : isRecord(root.pagination)
      ? root.pagination
      : {};
  const pageCount = number(meta.pageCount ?? meta.totalPages);
  const itemCount = number(meta.itemCount ?? meta.total);
  const items = asList(payload).map((item) => mapItem(item, type));
  return {
    items,
    page,
    hasNextPage: pageCount
      ? page < pageCount
      : itemCount
        ? page * limit < itemCount
        : items.length === limit,
  };
}

const detailPath: Record<ContentType, string> = {
  destination: "destinations",
  place: "locations",
  event: "events",
  package: "packages",
  story: "stories",
};

/** Fetches the public CMS record on demand, keeping list loads lightweight. */
export async function getContentDetail(
  item: ContentItem,
  locale: AppLocale = "en",
): Promise<ContentDetail> {
  const raw = unwrap(
    await request(
      `/${detailPath[item.type]}/${encodeURIComponent(item.slug || item.id)}?lang=${locale}`,
    ),
  );
  const record = isRecord(raw) ? raw : {};
  const destination = text(record.destination);
  const links = [
    link(record.website, "Website"),
    link(record.facebook, "Facebook"),
    link(record.instagram, "Instagram"),
    link(record.youtube, "YouTube"),
    link(record.twitter, "X"),
    link(record.tiktok, "TikTok"),
  ].filter((entry): entry is { label: string; url: string } => Boolean(entry));
  return {
    ...mapItem(record, item.type),
    body:
      contentText(record.content) ||
      contentText(record.description ?? record.overview ?? record.excerpt),
    latitude: number(record.latitude ?? record.lat),
    longitude: number(record.longitude ?? record.lng),
    destination: destination || undefined,
    links,
    openingHours: openingHoursText(record.openingHours),
    openingHoursRaw: parseOpeningHours(record.openingHours),
    arrivalAirport: text(record.arrivalAirport) || undefined,
    departureAirport: text(record.departureAirport) || undefined,
  };
}
