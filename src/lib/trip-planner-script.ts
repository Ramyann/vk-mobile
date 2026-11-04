import type {
  CreateTripPlanInput,
  ParsedTripRequest,
  TravellerType,
  TravelStyle,
  TripPlannerOptions,
} from "../api/trip-planner";
import type { AppLocale } from "../i18n/locale";

/**
 * The trip planner's conversation, mirrored from the website's
 * `routes/trip-planner/script.ts` and `answers.ts`: the same questions, in the
 * same order, with the same skip rules and the same request it builds.
 */
export type QuestionId =
  | "dates"
  | "travelStyle"
  | "destination"
  | "travellerType"
  | "arrival"
  | "locationCategory"
  | "interests"
  | "events"
  | "notes";

export interface Answers {
  startDate: string;
  endDate: string;
  travelStyle?: TravelStyle;
  destinationId?: string;
  travellerType?: TravellerType;
  groupSize?: number;
  arrivalDestinationId?: string;
  locationCategoryId?: string;
  recommendationTagIds: string[];
  includeEvents?: boolean;
  notes: string;
  answered: QuestionId[];
  skipped: QuestionId[];
}

export const MAX_INTERESTS = 6;
export const MAX_TRIP_DAYS = 14;

export const DATE_PRESETS = [
  { value: "weekend", nights: 2, startsIn: 5 },
  { value: "week", nights: 6, startsIn: 7 },
  { value: "tenDays", nights: 9, startsIn: 14 },
] as const;

export const EMPTY_ANSWERS: Answers = {
  startDate: "",
  endDate: "",
  recommendationTagIds: [],
  notes: "",
  answered: [],
  skipped: [],
};

const pad = (value: number) => String(value).padStart(2, "0");
const iso = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function isoDaysFromToday(days: number, today = new Date()): string {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  date.setDate(date.getDate() + days);
  return iso(date);
}

export const addDays = (isoDate: string, days: number): string => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return iso(new Date(year, month - 1, day + days));
};

/** Calendar days the trip covers, both ends included. */
export function routeDays(answers: Pick<Answers, "startDate" | "endDate">) {
  if (!answers.startDate || !answers.endDate) return 0;
  const [sy, sm, sd] = answers.startDate.split("-").map(Number);
  const [ey, em, ed] = answers.endDate.split("-").map(Number);
  const span =
    (Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86_400_000;
  return Math.max(0, Math.round(span) + 1);
}

/** Which questions apply, given what has been answered so far. */
export function isActive(
  id: QuestionId,
  answers: Answers,
  options: TripPlannerOptions | null,
): boolean {
  switch (id) {
    case "destination":
      return answers.travelStyle === "single-base";
    case "arrival":
      return Boolean(options?.arrivalDestinations.length);
    case "locationCategory":
      return Boolean(options?.locationCategories.length);
    case "interests":
      return Boolean(tagsFor(answers, options).length);
    default:
      return true;
  }
}

export const QUESTION_ORDER: QuestionId[] = [
  "dates",
  "travelStyle",
  "destination",
  "travellerType",
  "arrival",
  "locationCategory",
  "interests",
  "events",
  "notes",
];

export const ESSENTIAL: QuestionId[] = ["dates", "travelStyle"];

export const tagsFor = (answers: Answers, options: TripPlannerOptions | null) =>
  options?.locationCategories.find(
    (category) => category.id === answers.locationCategoryId,
  )?.tags ?? [];

export const activeQuestions = (
  answers: Answers,
  options: TripPlannerOptions | null,
) => QUESTION_ORDER.filter((id) => isActive(id, answers, options));

export const nextQuestion = (
  answers: Answers,
  options: TripPlannerOptions | null,
): QuestionId | null =>
  activeQuestions(answers, options).find(
    (id) => !answers.answered.includes(id) && !answers.skipped.includes(id),
  ) ?? null;

export const canBuild = (answers: Answers) =>
  ESSENTIAL.every((id) => answers.answered.includes(id));

const mark = (answers: Answers, id: QuestionId): Answers => ({
  ...answers,
  answered: answers.answered.includes(id)
    ? answers.answered
    : [...answers.answered, id],
  skipped: answers.skipped.filter((entry) => entry !== id),
});

/** Answering a question clears the ones that depended on its old answer. */
const DEPENDENTS: Partial<Record<QuestionId, QuestionId[]>> = {
  travelStyle: ["destination"],
  locationCategory: ["interests"],
};

export function rewindTo(answers: Answers, id: QuestionId): Answers {
  const cleared = [id, ...(DEPENDENTS[id] ?? [])];
  const next: Answers = {
    ...answers,
    answered: answers.answered.filter((entry) => !cleared.includes(entry)),
    skipped: answers.skipped.filter((entry) => !cleared.includes(entry)),
  };
  if (cleared.includes("destination")) next.destinationId = undefined;
  if (cleared.includes("interests")) next.recommendationTagIds = [];
  return next;
}

export const skipQuestion = (answers: Answers, id: QuestionId): Answers => ({
  ...answers,
  skipped: answers.skipped.includes(id)
    ? answers.skipped
    : [...answers.skipped, id],
});

export function applyDates(
  answers: Answers,
  startDate: string,
  endDate: string,
) {
  return mark({ ...answers, startDate, endDate }, "dates");
}

export function applyTravelStyle(answers: Answers, style: TravelStyle) {
  const next = rewindTo(answers, "travelStyle");
  return mark({ ...next, travelStyle: style }, "travelStyle");
}

export function applyDestination(answers: Answers, id: string) {
  return mark({ ...answers, destinationId: id || undefined }, "destination");
}

/** Solo and couple imply their size; family and friends ask for one. */
export function applyParty(
  answers: Answers,
  type: TravellerType,
  groupSize?: number,
) {
  const size =
    type === "solo" ? 1 : type === "couple" ? 2 : (groupSize ?? undefined);
  const next = { ...answers, travellerType: type, groupSize: size };
  return size ? mark(next, "travellerType") : next;
}

export function applyArrival(answers: Answers, id: string) {
  return mark({ ...answers, arrivalDestinationId: id || undefined }, "arrival");
}

export function applyCategory(answers: Answers, id: string) {
  const next = rewindTo(answers, "locationCategory");
  return mark({ ...next, locationCategoryId: id }, "locationCategory");
}

export function toggleInterest(answers: Answers, id: string): Answers {
  const has = answers.recommendationTagIds.includes(id);
  if (!has && answers.recommendationTagIds.length >= MAX_INTERESTS)
    return answers;
  return mark(
    {
      ...answers,
      recommendationTagIds: has
        ? answers.recommendationTagIds.filter((entry) => entry !== id)
        : [...answers.recommendationTagIds, id],
    },
    "interests",
  );
}

export const confirmNoInterests = (answers: Answers) =>
  mark({ ...answers, recommendationTagIds: [] }, "interests");

export const applyEvents = (answers: Answers, include: boolean) =>
  mark({ ...answers, includeEvents: include }, "events");

export const applyNotes = (answers: Answers, notes: string) =>
  mark({ ...answers, notes: notes.trim() }, "notes");

/** Fills what the free-text opener understood; the notes question stays open. */
export function applyParsed(
  answers: Answers,
  parsed: ParsedTripRequest,
  options: TripPlannerOptions,
): { answers: Answers; filled: QuestionId[] } {
  const { understood } = parsed;
  let next = answers;
  const filled: QuestionId[] = [];
  const has = (list: { id: string }[], id?: string) =>
    Boolean(id) && list.some((option) => option.id === id);
  if (understood.startDate && understood.endDate) {
    next = applyDates(next, understood.startDate, understood.endDate);
    filled.push("dates");
  }
  if (understood.travelStyle) {
    next = applyTravelStyle(next, understood.travelStyle);
    filled.push("travelStyle");
  }
  if (has(options.destinations, understood.destinationId)) {
    next = applyDestination(next, understood.destinationId!);
    filled.push("destination");
  }
  if (understood.travellerType) {
    next = applyParty(next, understood.travellerType, understood.groupSize);
    if (next.answered.includes("travellerType")) filled.push("travellerType");
  }
  if (has(options.arrivalDestinations, understood.arrivalDestinationId)) {
    next = applyArrival(next, understood.arrivalDestinationId!);
    filled.push("arrival");
  }
  if (has(options.locationCategories, understood.locationCategoryId)) {
    next = applyCategory(next, understood.locationCategoryId!);
    filled.push("locationCategory");
    const allowed = new Set(tagsFor(next, options).map((tag) => tag.id));
    const tags = (understood.recommendationTagIds ?? [])
      .filter((id) => allowed.has(id))
      .slice(0, MAX_INTERESTS);
    if (tags.length) {
      next = mark({ ...next, recommendationTagIds: tags }, "interests");
      filled.push("interests");
    }
  }
  if (understood.includeEvents === false) {
    next = applyEvents(next, false);
    filled.push("events");
  }
  if (parsed.notes) next = { ...next, notes: parsed.notes };
  return { answers: next, filled };
}

export function toCreateInput(
  answers: Answers,
  locale: AppLocale,
): CreateTripPlanInput {
  return {
    startDate: answers.startDate,
    endDate: answers.endDate,
    destinationId: answers.destinationId || undefined,
    locationCategoryId: answers.locationCategoryId || undefined,
    arrivalDestinationId: answers.arrivalDestinationId || undefined,
    recommendationTagIds: answers.recommendationTagIds.length
      ? answers.recommendationTagIds
      : undefined,
    travellerType: answers.travellerType ?? "solo",
    groupSize: answers.groupSize ?? 1,
    travelStyle: answers.travelStyle ?? "single-base",
    includeEvents: answers.includeEvents !== false,
    notes: answers.notes.trim() || undefined,
    locale,
  };
}
