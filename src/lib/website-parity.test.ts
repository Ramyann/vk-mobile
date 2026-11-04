import { parseMapPins, resolveMapPins } from "../api/map";
import { tw } from "../i18n/web";
import { parseChatMarkdown } from "./chat-markdown";
import { foldForSearch, formatNumber, resolveLocalized } from "./localized";
import {
  EMPTY_MAP_FILTERS,
  facetOptions,
  filterMapPlaces,
  formatDistance,
} from "./map-filters";
import { openingStatus, parseOpeningHours } from "./opening-hours";
import { isStrongPassword } from "./password";
import {
  applyCategory,
  applyDates,
  applyParty,
  applyTravelStyle,
  canBuild,
  EMPTY_ANSWERS,
  nextQuestion,
  rewindTo,
  routeDays,
  toCreateInput,
  toggleInterest,
} from "./trip-planner-script";
import { parseSseFrame } from "../api/chat";
import type { TripPlannerOptions } from "../api/trip-planner";

jest.mock("expo/fetch", () => ({ fetch: jest.fn() }));

const pin = (overrides: Record<string, unknown>) => ({
  id: "1",
  slug: "citadel",
  name: { en: "Erbil Citadel", ar: "قلعة أربيل", ckb: "قەڵای هەولێر" },
  latitude: 36.19,
  longitude: 44.01,
  imageSrc: "",
  category: {
    id: "c1",
    name: { en: "Sights" },
    icon: "landmark",
    color: "#005E53",
    showInMapFilter: true,
  },
  governorate: { id: "g1", slug: "erbil", name: { en: "Erbil", ar: "أربيل" } },
  seasons: ["summer", "spring", "monsoon"],
  allSeasons: false,
  ...overrides,
});

describe("map pins", () => {
  const pins = parseMapPins({
    count: 3,
    data: [
      pin({}),
      pin({
        id: "2",
        slug: "dukan",
        name: { en: "Dukan Lake" },
        category: { id: "c2", name: { en: "Nature" }, icon: null, color: null },
        governorate: {
          id: "g2",
          slug: "slemani",
          name: { en: "Sulaymaniyah" },
        },
      }),
      pin({ id: "3", latitude: "not a number" }),
    ],
  });

  it("keeps valid rows, known seasons in calendar order, and a fallback colour", () => {
    expect(pins).toHaveLength(2);
    expect(pins[0].seasons).toEqual(["spring", "summer"]);
    expect(pins[0].image).toBeNull();
    const places = resolveMapPins(pins, "en");
    expect(places.find((place) => place.slug === "dukan")?.color).toBe(
      "#36196D",
    );
  });

  it("resolves the visitor's language and falls back to English", () => {
    const places = resolveMapPins(pins, "ar");
    expect(places.map((place) => place.name)).toContain("قلعة أربيل");
    expect(places.map((place) => place.name)).toContain("Dukan Lake");
  });

  it("searches every language, ORs within a facet and ANDs across them", () => {
    const places = resolveMapPins(pins, "en");
    expect(
      filterMapPlaces(places, { ...EMPTY_MAP_FILTERS, query: "قەڵا" }),
    ).toHaveLength(1);
    expect(
      filterMapPlaces(places, {
        ...EMPTY_MAP_FILTERS,
        governorates: ["erbil", "slemani"],
      }),
    ).toHaveLength(2);
    expect(
      filterMapPlaces(places, {
        ...EMPTY_MAP_FILTERS,
        governorates: ["erbil"],
        categories: ["c2"],
      }),
    ).toHaveLength(0);
  });

  it("counts each facet with the other facets applied, keeping zero options", () => {
    const places = resolveMapPins(pins, "en");
    const options = facetOptions(
      places,
      { ...EMPTY_MAP_FILTERS, categories: ["c2"] },
      "governorates",
    );
    expect(options).toEqual([
      expect.objectContaining({ value: "erbil", count: 0 }),
      expect.objectContaining({ value: "slemani", count: 1 }),
    ]);
  });
});

describe("localisation helpers", () => {
  it("folds Arabic spelling variants and diacritics", () => {
    expect(foldForSearch("  أربيلُ ")).toBe(foldForSearch("اربیل"));
  });
  it("falls back to English for a missing locale", () => {
    expect(resolveLocalized({ en: "Erbil", ckb: "" }, "ckb")).toBe("Erbil");
  });
  it("formats numbers with Arabic-Indic digits outside English", () => {
    expect(formatNumber(158, "ckb")).toBe("١٥٨");
    expect(formatDistance(4.26)).toBe("4.3");
    expect(formatDistance(12.6)).toBe("13");
  });
  it("interpolates and pluralises the website's strings", () => {
    expect(tw("en", "exploreMap.count", { count: 1, total: "1" })).toBe(
      "1 place",
    );
    expect(tw("en", "exploreMap.count", { count: 4, total: "4" })).toBe(
      "4 places",
    );
    expect(tw("ar", "exploreMap.directions")).toBe("الاتجاهات");
  });
});

describe("opening status on Kurdistan time", () => {
  const hours = parseOpeningHours([
    {
      dayName: "Monday",
      isActive: true,
      startHour: "9",
      startMinute: "00",
      startPeriod: "am",
      endHour: "5",
      endMinute: "30",
      endPeriod: "pm",
    },
    {
      dayName: "Tuesday",
      isActive: true,
      startHour: "0",
      startMinute: "00",
      endHour: "0",
      endMinute: "00",
    },
  ]);
  // 2026-11-02 is a Monday. 10:00 UTC is 13:00 in Kurdistan.
  it("is open with a closing time", () => {
    expect(openingStatus(hours, new Date("2026-11-02T10:00:00Z"))).toEqual({
      kind: "open",
      closesAt: "17:30",
    });
  });
  it("is closed before opening", () => {
    expect(openingStatus(hours, new Date("2026-11-02T04:00:00Z"))).toEqual({
      kind: "closed",
      opensAt: "09:00",
    });
  });
  it("knows a 24-hour day and a closed day", () => {
    expect(openingStatus(hours, new Date("2026-11-03T10:00:00Z"))).toEqual({
      kind: "open24",
    });
    expect(openingStatus(hours, new Date("2026-11-05T10:00:00Z"))).toEqual({
      kind: "closedToday",
    });
  });
});

describe("chat", () => {
  it("parses chunk and complete frames and ignores comments", () => {
    expect(parseSseFrame(": Visit Kurdistan chat stream")).toBeNull();
    expect(parseSseFrame('event: chunk\ndata: {"text":"Hello "}')).toEqual({
      event: "chunk",
      data: { text: "Hello " },
    });
  });
  it("renders the website's Markdown subset", () => {
    expect(
      parseChatMarkdown(
        "## Erbil\n- **Citadel** daily\n- Bazaar\n\n1. One\n2. Two",
      ),
    ).toEqual([
      { kind: "heading", runs: [{ text: "Erbil", bold: false }] },
      {
        kind: "bullets",
        items: [
          [
            { text: "Citadel", bold: true },
            { text: " daily", bold: false },
          ],
          [{ text: "Bazaar", bold: false }],
        ],
      },
      {
        kind: "numbers",
        start: 1,
        items: [[{ text: "One", bold: false }], [{ text: "Two", bold: false }]],
      },
    ]);
  });
});

describe("password rules", () => {
  it("needs all five rules, with the signup endpoint's symbols", () => {
    expect(isStrongPassword("Kurdistan1!")).toBe(true);
    expect(isStrongPassword("Kurdistan1~")).toBe(false);
    expect(isStrongPassword("kurdistan1!")).toBe(false);
  });
});

describe("trip planner script", () => {
  const options: TripPlannerOptions = {
    destinations: [{ id: "d1", name: "Erbil" }],
    arrivalDestinations: [],
    locationCategories: [
      { id: "c1", name: "Nature", tags: [{ id: "t1", name: "Hiking" }] },
    ],
    travellerTypes: ["solo", "couple", "family", "friends"],
    travelStyles: ["single-base", "touring"],
    groupSize: { min: 1, max: 40 },
    maxRefinements: 12,
  };

  it("asks the essentials first and skips what does not apply", () => {
    let answers = EMPTY_ANSWERS;
    expect(nextQuestion(answers, options)).toBe("dates");
    answers = applyDates(answers, "2026-12-01", "2026-12-03");
    expect(routeDays(answers)).toBe(3);
    expect(canBuild(answers)).toBe(false);
    answers = applyTravelStyle(answers, "touring");
    expect(canBuild(answers)).toBe(true);
    // Touring has no base destination, and no airports are offered.
    expect(nextQuestion(answers, options)).toBe("travellerType");
    answers = applyParty(answers, "family");
    expect(nextQuestion(answers, options)).toBe("travellerType");
    answers = applyParty(answers, "family", 4);
    expect(nextQuestion(answers, options)).toBe("locationCategory");
  });

  it("clears dependent answers when one is changed", () => {
    let answers = applyCategory(EMPTY_ANSWERS, "c1");
    answers = toggleInterest(answers, "t1");
    expect(answers.recommendationTagIds).toEqual(["t1"]);
    answers = rewindTo(answers, "locationCategory");
    expect(answers.recommendationTagIds).toEqual([]);
    expect(answers.answered).not.toContain("interests");
  });

  it("builds the website's request with its defaults", () => {
    const answers = applyTravelStyle(
      applyDates(EMPTY_ANSWERS, "2026-12-01", "2026-12-03"),
      "single-base",
    );
    expect(toCreateInput(answers, "ckb")).toEqual({
      startDate: "2026-12-01",
      endDate: "2026-12-03",
      destinationId: undefined,
      locationCategoryId: undefined,
      arrivalDestinationId: undefined,
      recommendationTagIds: undefined,
      travellerType: "solo",
      groupSize: 1,
      travelStyle: "single-base",
      includeEvents: true,
      notes: undefined,
      locale: "ckb",
    });
  });
});
