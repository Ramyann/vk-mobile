import type { AppLocale } from "../i18n/locale";

/** A CMS field returned with `?lang=all`: one string per locale, any may be missing. */
export type LocalizedText = Partial<Record<AppLocale, string>>;

const LOCALE_KEYS = new Set(["en", "ar", "ckb"]);

export const isLocalizedText = (value: unknown): value is LocalizedText =>
  Boolean(value) &&
  typeof value === "object" &&
  !Array.isArray(value) &&
  Object.keys(value as object).length > 0 &&
  Object.keys(value as object).every((key) => LOCALE_KEYS.has(key));

/**
 * Picks the visitor's language, falling back to English — the same rule the
 * website and the backend's locale interceptor apply.
 */
export function resolveLocalized(value: unknown, locale: AppLocale): string {
  if (typeof value === "string") return value.trim();
  if (!isLocalizedText(value)) return "";
  const picked = value[locale]?.trim();
  return picked || value.en?.trim() || "";
}

/** Every non-empty translation, so search can match a name in any language. */
export const allTranslations = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : isLocalizedText(value)
      ? Object.values(value).filter(
          (entry): entry is string => typeof entry === "string" && !!entry,
        )
      : [];

/**
 * Folds Arabic and Sorani spelling variants and diacritics so "Hawler",
 * "هەولێر" and "هه‌ولێر" style queries match. Mirrors the website's map search.
 */
export function foldForSearch(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ًͯ-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ك/g, "ک")
    .replace(/[يى]/g, "ی")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Arabic-Indic digits for ar and ckb, as the website formats numbers. */
export const formatNumber = (value: number, locale: AppLocale): string =>
  locale === "en"
    ? value.toLocaleString("en")
    : String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
