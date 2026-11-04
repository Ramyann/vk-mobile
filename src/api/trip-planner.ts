import type { AppLocale } from "../i18n/locale";
import { authorizedFetch } from "./auth";
import { ApiError, apiErrorFrom, unwrapData } from "./http";

export type TravellerType = "solo" | "couple" | "family" | "friends";
export type TravelStyle = "single-base" | "touring";

export interface PlannerOption {
  id: string;
  name: string;
  slug?: string;
}

export interface TripPlannerOptions {
  destinations: PlannerOption[];
  arrivalDestinations: PlannerOption[];
  locationCategories: Array<PlannerOption & { tags: PlannerOption[] }>;
  travellerTypes: TravellerType[];
  travelStyles: TravelStyle[];
  groupSize: { min: number; max: number };
  maxRefinements: number;
}

export interface ParsedTripRequest {
  understood: {
    startDate?: string;
    endDate?: string;
    destinationId?: string;
    locationCategoryId?: string;
    arrivalDestinationId?: string;
    recommendationTagIds?: string[];
    travellerType?: TravellerType;
    groupSize?: number;
    travelStyle?: TravelStyle;
    includeEvents?: boolean;
  };
  unmatched: string[];
  notes?: string;
}

export interface CreateTripPlanInput {
  startDate: string;
  endDate: string;
  destinationId?: string;
  locationCategoryId?: string;
  arrivalDestinationId?: string;
  recommendationTagIds?: string[];
  travellerType: TravellerType;
  groupSize: number;
  travelStyle: TravelStyle;
  includeEvents: boolean;
  notes?: string;
  locale: AppLocale;
}

export interface TripStop {
  id: string;
  kind: "location";
  name: string;
  description: string;
  /** "/place/<slug>" — the slug is the last segment. */
  href: string;
  image?: string | null;
  latitude?: number;
  longitude?: number;
  destination?: string;
  tags: string[];
  why?: string;
}

export interface TripRecommendation {
  id: string;
  kind: "package" | "event";
  name: string;
  description: string;
  href: string;
  image?: string | null;
  destination?: string;
  tags: string[];
  date?: string;
  nights?: number;
  close?: boolean;
}

export interface TripPlan {
  title: string;
  summary: string;
  startDate?: string;
  endDate?: string;
  days: Array<{
    day: number;
    title: string;
    summary: string;
    stops: TripStop[];
  }>;
  recommendations: TripRecommendation[];
  packages?: TripRecommendation[];
  shareToken?: string | null;
}

export interface SavedTripSummary {
  shareToken: string;
  title: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  locale: AppLocale;
  createdAt: string;
}

const FALLBACK = "We could not create your trip just now.";

async function call<T>(
  path: string,
  init: RequestInit & { session?: string } = {},
): Promise<T> {
  const { session, ...rest } = init;
  const response = await authorizedFetch(`/trip-planner${path}`, {
    ...rest,
    headers: {
      ...(rest.headers as Record<string, string> | undefined),
      ...(session ? { "X-Trip-Planner-Session": session } : {}),
    },
  });
  if (!response.ok) throw await apiErrorFrom(response, FALLBACK);
  return unwrapData<T>(await response.json());
}

/** The verification token has lapsed (1 hour) and must be renewed. */
export const isVerificationRequired = (error: unknown) =>
  error instanceof ApiError &&
  error.code === "TRIP_PLANNER_VERIFICATION_REQUIRED";

export const getPlannerOptions = (locale: AppLocale) =>
  call<TripPlannerOptions>(`/options?locale=${locale}`);

/** Trades one Turnstile pass for a reusable, hour-long planner session. */
export const startPlannerSession = async (turnstileToken?: string) =>
  (
    await call<{ sessionToken: string }>("/session", {
      method: "POST",
      body: JSON.stringify(turnstileToken ? { turnstileToken } : {}),
    })
  ).sessionToken;

export const parseTripRequest = (
  session: string,
  text: string,
  locale: AppLocale,
) =>
  call<ParsedTripRequest>("/parse", {
    method: "POST",
    session,
    body: JSON.stringify({ text, locale }),
  });

/** Synchronous and slow (around 20 seconds): the plan is written and saved. */
export const createTripPlan = (session: string, input: CreateTripPlanInput) =>
  call<TripPlan>("/plans", {
    method: "POST",
    session,
    body: JSON.stringify(input),
  });

export const listTripPlans = () => call<SavedTripSummary[]>("/plans");

export const getTripPlan = (shareToken: string) =>
  call<TripPlan>(`/plans/${encodeURIComponent(shareToken)}`);

export const deleteTripPlan = (shareToken: string) =>
  call<{ deleted: boolean }>(`/plans/${encodeURIComponent(shareToken)}`, {
    method: "DELETE",
  });

/** "/place/dolma" → "dolma". */
export const slugFromHref = (href: string): string =>
  decodeURIComponent(href.split("?")[0].split("/").filter(Boolean).pop() ?? "");
