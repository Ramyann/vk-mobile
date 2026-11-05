import type { AppLocale } from "../i18n/locale";
import { formatNumber } from "./localized";

/**
 * Event dates as the Home "What's on" list shows them: a day number, a short
 * month and an "Until …" line. Dates are read on Kurdistan time (UTC+3), the
 * same clock the opening hours use, so an evening event never slips a day.
 */
const KURDISTAN_OFFSET_MS = 3 * 60 * 60 * 1000;

const MONTHS: Record<AppLocale, string[]> = {
  en: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  ar: [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ],
  ckb: [
    "کانوونی دووەم",
    "شوبات",
    "ئازار",
    "نیسان",
    "ئایار",
    "حوزەیران",
    "تەممووز",
    "ئاب",
    "ئەیلوول",
    "تشرینی یەکەم",
    "تشرینی دووەم",
    "کانوونی یەکەم",
  ],
};

const UNTIL: Record<AppLocale, string> = {
  en: "Until",
  ar: "حتى",
  ckb: "تا",
};

interface CalendarDay {
  year: number;
  month: number;
  day: number;
}

export function kurdistanDay(iso: string | undefined): CalendarDay | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  const local = new Date(time + KURDISTAN_OFFSET_MS);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
  };
}

const sameDay = (a: CalendarDay, b: CalendarDay) =>
  a.year === b.year && a.month === b.month && a.day === b.day;

/** The day number and short month for an event's date block. */
export function dateBlock(
  iso: string | undefined,
  locale: AppLocale,
): { day: string; month: string } | null {
  const date = kurdistanDay(iso);
  if (!date) return null;
  return {
    day: formatNumber(date.day, locale),
    month: MONTHS[locale][date.month],
  };
}

/** "14 Nov", in the visitor's language. */
export function shortDate(iso: string | undefined, locale: AppLocale): string {
  const date = kurdistanDay(iso);
  if (!date) return "";
  return `${formatNumber(date.day, locale)} ${MONTHS[locale][date.month]}`;
}

/** "Until 14 Nov" for an event that ends on a later day, otherwise null. */
export function untilLabel(
  start: string | undefined,
  end: string | undefined,
  locale: AppLocale,
): string | null {
  const from = kurdistanDay(start);
  const to = kurdistanDay(end);
  if (!to || (from && sameDay(from, to))) return null;
  return `${UNTIL[locale]} ${shortDate(end, locale)}`;
}
