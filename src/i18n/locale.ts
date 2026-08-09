/** The supported CMS locales and app-shell labels. */
export const LOCALE_OPTIONS = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية" },
  { code: "ckb", label: "Kurdish (Sorani)", nativeLabel: "کوردی" },
] as const;

export type AppLocale = (typeof LOCALE_OPTIONS)[number]["code"];

export const isAppLocale = (value: unknown): value is AppLocale =>
  typeof value === "string" &&
  LOCALE_OPTIONS.some((option) => option.code === value);

export const languageName = (locale: AppLocale): string =>
  LOCALE_OPTIONS.find((option) => option.code === locale)?.nativeLabel ??
  "English";

export const navLabels: Record<
  AppLocale,
  Record<"explore" | "discover" | "ask" | "saved" | "more", string>
> = {
  en: {
    explore: "Explore",
    discover: "Discover",
    ask: "Ask",
    saved: "Saved",
    more: "More",
  },
  ar: {
    explore: "استكشف",
    discover: "اكتشف",
    ask: "اسأل",
    saved: "المحفوظات",
    more: "المزيد",
  },
  ckb: {
    explore: "گەڕان",
    discover: "دۆزینەوە",
    ask: "پرسیار بکە",
    saved: "پاشەکەوتکراوەکان",
    more: "زیاتر",
  },
};

const messages = {
  en: {
    search: "Search",
    closeSearch: "Close search",
    searchPlaceholder: "Search places, events and stories",
    searchHint:
      "Type at least two characters to search destinations, places, events, packages and stories.",
    searching: "Searching Visit Kurdistan…",
    noResults: "No results found",
    matchingResults: "matching results",
    featuredDestinations: "Featured destinations",
    travelPackages: "Travel packages",
    events: "What's on",
    stories: "Stories & guides",
    browseAll: "Browse all",
    allEvents: "All events",
    readMore: "Read more",
    retry: "Try again",
    connectionError: "Check your connection and try again.",
  },
  ar: {
    search: "بحث",
    closeSearch: "إغلاق البحث",
    searchPlaceholder: "ابحث عن الأماكن والفعاليات والقصص",
    searchHint:
      "اكتب حرفين على الأقل للبحث في الوجهات والأماكن والفعاليات والباقات والقصص.",
    searching: "جارٍ البحث في زيارة كردستان…",
    noResults: "لا توجد نتائج",
    matchingResults: "نتائج مطابقة",
    featuredDestinations: "وجهات مميزة",
    travelPackages: "باقات السفر",
    events: "ما الجديد",
    stories: "قصص وأدلة",
    browseAll: "عرض الكل",
    allEvents: "كل الفعاليات",
    readMore: "اقرأ المزيد",
    retry: "حاول مرة أخرى",
    connectionError: "تحقق من الاتصال وحاول مرة أخرى.",
  },
  ckb: {
    search: "گەڕان",
    closeSearch: "داخستنی گەڕان",
    searchPlaceholder: "گەڕان بۆ شوێن و ڕووداو و چیرۆک",
    searchHint:
      "بەلایەنی کەم دوو پیت بنووسە بۆ گەڕان لە ناو شوێن و ڕووداو و پاکێج و چیرۆکدا.",
    searching: "گەڕان لە ڤیزیتی کوردستان…",
    noResults: "هیچ ئەنجامێک نەدۆزرایەوە",
    matchingResults: "ئەنجامی گونجاو",
    featuredDestinations: "شوێنە دیارەکان",
    travelPackages: "پاکێجەکانی گەشت",
    events: "چی نوێیە",
    stories: "چیرۆک و ڕێبەر",
    browseAll: "هەمووی ببینە",
    allEvents: "هەموو ڕووداوەکان",
    readMore: "زیاتر بخوێنەوە",
    retry: "دوبارە هەوڵ بدە",
    connectionError: "پەیوەندییەکەت بپشکنە و دوبارە هەوڵ بدە.",
  },
} as const;

export type MessageKey = keyof typeof messages.en;
export const t = (locale: AppLocale, key: MessageKey) => messages[locale][key];
export const isRtl = (locale: AppLocale) => locale === "ar" || locale === "ckb";
