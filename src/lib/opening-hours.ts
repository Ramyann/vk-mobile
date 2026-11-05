/** A raw `openingHours` row from the CMS: every value is a string. */
export interface OpeningHoursEntry {
  dayName: string;
  isActive: boolean;
  startHour?: string;
  startMinute?: string;
  startPeriod?: string;
  endHour?: string;
  endMinute?: string;
  endPeriod?: string;
}

export type OpeningStatus =
  | { kind: "open24" }
  | { kind: "open"; closesAt: string }
  | { kind: "closed"; opensAt: string }
  | { kind: "closedToday" };

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** Kurdistan keeps UTC+3 all year (no daylight saving). */
const KURDISTAN_OFFSET_MS = 3 * 60 * 60 * 1000;

export function parseOpeningHours(value: unknown): OpeningHoursEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row): OpeningHoursEntry[] => {
    if (!row || typeof row !== "object") return [];
    const entry = row as Record<string, unknown>;
    if (typeof entry.dayName !== "string") return [];
    const str = (key: string) =>
      typeof entry[key] === "string" || typeof entry[key] === "number"
        ? String(entry[key])
        : undefined;
    return [
      {
        dayName: entry.dayName,
        isActive: entry.isActive !== false,
        startHour: str("startHour"),
        startMinute: str("startMinute"),
        startPeriod: str("startPeriod"),
        endHour: str("endHour"),
        endMinute: str("endMinute"),
        endPeriod: str("endPeriod"),
      },
    ];
  });
}

function minutes(
  hour?: string,
  minute?: string,
  period?: string,
): number | null {
  const h = Number(hour);
  const m = Number(minute ?? 0);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const p = period?.trim().toLowerCase();
  let h24 = h;
  if (p === "pm" && h < 12) h24 = h + 12;
  if (p === "am" && h === 12) h24 = 0;
  return h24 * 60 + m;
}

const clock = (total: number): string => {
  const wrapped = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(
    wrapped % 60,
  ).padStart(2, "0")}`;
};

type Span = { start: number; end: number; allDay: boolean };

function spanFor(entries: OpeningHoursEntry[], dayIndex: number): Span | null {
  const entry = entries.find(
    (row) => row.dayName.trim().toLowerCase() === DAYS[(dayIndex + 7) % 7],
  );
  if (!entry || !entry.isActive) return null;
  const start = minutes(entry.startHour, entry.startMinute, entry.startPeriod);
  const end = minutes(entry.endHour, entry.endMinute, entry.endPeriod);
  if (start === null || end === null) return null;
  const allDay = start === 0 && (end === 0 || end >= 23 * 60 + 59);
  // An end at or before the start runs past midnight into the next day.
  return { start, end: end <= start ? end + 1440 : end, allDay };
}

/** Today's open/closed state, judged on Kurdistan time like the website. */
export function openingStatus(
  entries: OpeningHoursEntry[],
  now: Date = new Date(),
): OpeningStatus | null {
  if (!entries.length) return null;
  const local = new Date(now.getTime() + KURDISTAN_OFFSET_MS);
  const day = local.getUTCDay();
  const current = local.getUTCHours() * 60 + local.getUTCMinutes();
  const yesterday = spanFor(entries, day - 1);
  if (yesterday && !yesterday.allDay && current + 1440 < yesterday.end)
    return { kind: "open", closesAt: clock(yesterday.end) };
  const today = spanFor(entries, day);
  if (!today) return { kind: "closedToday" };
  if (today.allDay) return { kind: "open24" };
  if (current < today.start)
    return { kind: "closed", opensAt: clock(today.start) };
  if (current < today.end) return { kind: "open", closesAt: clock(today.end) };
  const tomorrow = spanFor(entries, day + 1);
  return tomorrow && !tomorrow.allDay
    ? { kind: "closed", opensAt: clock(tomorrow.start) }
    : { kind: "closedToday" };
}

/**
 * "Monday: 9:00 am – 5:00 pm" for each day, or one line when all seven days
 * share the same hours.
 */
export function summariseHours(lines: string[], open24Label: string): string {
  const ranges = lines.map((line) => line.split(": ").slice(1).join(": "));
  const same =
    lines.length === 7 && ranges.every((range) => range === ranges[0]);
  if (!same) return lines.join("\n");
  return /^12:00 am\s*[–-]\s*11:59 pm$/i.test(ranges[0])
    ? `${open24Label}, every day`
    : `Every day, ${ranges[0]}`;
}
