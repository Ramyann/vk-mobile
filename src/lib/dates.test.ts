import { summariseHours } from "./opening-hours";
import { dateBlock, shortDate, untilLabel } from "./dates";

describe("event dates on Kurdistan time", () => {
  it("reads the day in UTC+3, so a late-evening start keeps its date", () => {
    // 22:30 UTC on 14 Oct is 01:30 on 15 Oct in Erbil.
    expect(dateBlock("2026-10-14T22:30:00.000Z", "en")).toEqual({
      day: "15",
      month: "Oct",
    });
  });

  it("writes Arabic-Indic digits and the local month outside English", () => {
    expect(shortDate("2026-11-14T17:00:00.000Z", "ckb")).toBe(
      "١٤ تشرینی دووەم",
    );
    expect(dateBlock("2026-11-14T17:00:00.000Z", "ar")?.month).toBe("نوفمبر");
  });

  it("only says until when the event ends on a later day", () => {
    expect(
      untilLabel("2026-10-15T17:00:00.000Z", "2026-11-14T17:00:00.000Z", "en"),
    ).toBe("Until 14 Nov");
    expect(
      untilLabel("2026-10-15T09:00:00.000Z", "2026-10-15T17:00:00.000Z", "en"),
    ).toBeNull();
    expect(untilLabel("2026-10-15T09:00:00.000Z", undefined, "en")).toBeNull();
  });
});

describe("opening hours summary", () => {
  const day = (name: string, range: string) => `${name}: ${range}`;
  const week = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  it("collapses a week of round-the-clock hours", () => {
    expect(
      summariseHours(
        week.map((name) => day(name, "12:00 am – 11:59 pm")),
        "Open 24 Hours",
      ),
    ).toBe("Open 24 Hours, every day");
  });
  it("keeps the days when they differ", () => {
    const lines = week.map((name, index) =>
      day(name, index === 4 ? "Closed" : "9:00 am – 5:00 pm"),
    );
    expect(summariseHours(lines, "Open 24 Hours")).toBe(lines.join("\n"));
  });
});
