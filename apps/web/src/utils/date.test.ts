import { getRelativeTimeLabel } from "./date";

describe("getRelativeTimeLabel", () => {
  const NOW = new Date("2026-08-08T00:00:00.000Z").getTime();

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function daysAgo(days: number): string {
    return new Date(NOW - days * 24 * 60 * 60 * 1000).toISOString();
  }

  it("returns null for missing or invalid dates", () => {
    expect(getRelativeTimeLabel(null)).toBeNull();
    expect(getRelativeTimeLabel(undefined)).toBeNull();
    expect(getRelativeTimeLabel("not-a-date")).toBeNull();
  });

  it("labels same-day dates as today", () => {
    expect(getRelativeTimeLabel(daysAgo(0))).toBe("Published today");
  });

  it("labels recent dates in days", () => {
    expect(getRelativeTimeLabel(daysAgo(1))).toBe("Published 1 day ago");
    expect(getRelativeTimeLabel(daysAgo(3))).toBe("Published 3 days ago");
    expect(getRelativeTimeLabel(daysAgo(6))).toBe("Published 6 days ago");
  });

  it("labels dates in weeks between 7 and 29 days", () => {
    expect(getRelativeTimeLabel(daysAgo(7))).toBe("Published 1 week ago");
    expect(getRelativeTimeLabel(daysAgo(14))).toBe("Published 2 weeks ago");
    expect(getRelativeTimeLabel(daysAgo(29))).toBe("Published 4 weeks ago");
  });

  it("labels dates in months between 30 and 364 days", () => {
    expect(getRelativeTimeLabel(daysAgo(30))).toBe("Published 1 month ago");
    expect(getRelativeTimeLabel(daysAgo(90))).toBe("Published 3 months ago");
  });

  it("labels dates a year or more ago in years", () => {
    expect(getRelativeTimeLabel(daysAgo(365))).toBe("Published 1 year ago");
    expect(getRelativeTimeLabel(daysAgo(800))).toBe("Published 2 years ago");
  });

  it("uses the updated prefix when isUpdated is true", () => {
    expect(getRelativeTimeLabel(daysAgo(3), true)).toBe("Last updated 3 days ago");
    expect(getRelativeTimeLabel(daysAgo(0), true)).toBe("Last updated today");
  });
});
