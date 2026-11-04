/**
 * Fast, local feedback for the chat and trip-planner text fields.
 *
 * The backend is the canonical, non-bypassable policy. This deliberately
 * mirrors its conservative baseline so a visitor is told before an HTTP
 * request is made, while the server still protects direct API callers and any
 * additional server-only rules.
 */
function normaliseInput(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[إأآٱ]/gu, "ا")
    .replace(/ى/gu, "ي")
    .replace(/ك/gu, "ک");
}

const EXPLICIT_ARABIC_OR_SORANI =
  /(?:اباحي|دعارة|قحبة|پۆرن|سێکس|فاحشە|اقتل\s*نفسي|اقتل\s*نفسك|خۆت\s*بکوژە)/u;
const AMBIGUOUS_ARABIC_OR_SORANI_TERMS = [
  "جنس",
  "جنسي",
  "کس",
  "زب",
  "عاري",
  "کۆس",
  "کیر",
  "عوری",
];
const AMBIGUOUS_TERMS = AMBIGUOUS_ARABIC_OR_SORANI_TERMS.join("|");
/**
 * App note: the website builds this with Unicode property escapes. Should a
 * JavaScript engine reject them, fall back to the Arabic-script blocks plus
 * Latin word characters for the "not inside a word" boundary, rather than
 * failing to load the chat.
 */
const AMBIGUOUS_ARABIC_OR_SORANI = (() => {
  try {
    return new RegExp(
      `(?<![\\p{L}\\p{M}])(?:ال|لل|و|ب|ل)?(?:${AMBIGUOUS_TERMS})(?![\\p{L}\\p{M}])`,
      "u",
    );
  } catch {
    const letter = "\\w\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF";
    return new RegExp(
      `(?:^|[^${letter}])(?:ال|لل|و|ب|ل)?(?:${AMBIGUOUS_TERMS})(?![${letter}])`,
      "u",
    );
  }
})();

const BLOCKED_INPUT_PATTERNS = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu,
  /(?:\+|00)\s*\d(?:[\s().-]*\d){6,14}\b/u,
  /\b(?:\d[ -]?){13,19}\b/u,
  /\b\d{1,5}\s+[A-Z][A-Z .'-]{2,}\s+(?:street|st|road|rd|avenue|ave|lane|ln|boulevard|blvd)\b/iu,
  /\b(?:porn(?:ography)?|nudes?|onlyfans|escort|sex(?:ual)?|masturbat(?:e|ion)|prostitut(?:e|ion))\b/iu,
  EXPLICIT_ARABIC_OR_SORANI,
  AMBIGUOUS_ARABIC_OR_SORANI,
  /\b(?:fuck(?:ing)?|shit|bitch|asshole|fag(?:got)?|retard(?:ed)?)\b/iu,
  /\b(?:go\s+back\s+to\s+your\s+country|you\s+people\s+are\s+(?:animals|vermin))\b/iu,
  /\b(?:kill|shoot|stab|bomb)\s+(?:yourself|myself|you|him|her|them|everyone|all\s+of\s+you)\b/iu,
  /\b(?:i(?:'m|\s+am)|we(?:'re|\s+are)|going\s+to|will)\s+(?:kill|shoot|stab|bomb)\b/iu,
  /(?:اقتل|سأقتل|راح\s+اقتل)\s*(?:نفسي|نفسك|ك|ه|ها|هم)/u,
  /(?:دەتکوژم|دەیکوژم|بکوژم)\s*(?:تۆ|خۆم|خۆت|ئەوان)/u,
  /\b(?:buy|sell|deal|traffic|make)\s+(?:cocaine|heroin|meth(?:amphetamine)?|illegal\s+drugs?|drugs?)\b/iu,
  /\b(?:how\s+(?:do|can)\s+i\s+(?:make|build)|where\s+can\s+i\s+(?:buy|get))\s+(?:a\s+)?(?:bomb|weapon|gun)\b/iu,
  /(?:اشتري|بيع|تجارة|صنع)\s+(?:مخدرات|قنبلة|سلاح)/u,
  /\b(?:join|support|pledge|promote|recruit(?:ment)?)\s+(?:isis|daesh|al[-\s]?qaeda)\b/iu,
  /(?:انضم|دعم|تأييد|دعاية|تجنيد)\s+(?:لداعش|داعش|القاعدة)/u,
] as const;

/** True when a visitor's free text must not be submitted to the AI services. */
export function hasProhibitedInput(value: string): boolean {
  const text = normaliseInput(value);
  return (
    Boolean(text) &&
    BLOCKED_INPUT_PATTERNS.some((pattern) => pattern.test(text))
  );
}
