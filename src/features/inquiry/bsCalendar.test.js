import { describe, expect, it } from "vitest";
import { BS_MONTHS, adToBs, bsLabel, bsMonthLength, bsSupportedRange, bsToAd, isBsSupported } from "./bsCalendar";

// Local-midnight date for an English calendar day (what the date picker uses)
const ad = (y, m, d) => new Date(y, m - 1, d);
const ymd = (d) => [d.getFullYear(), d.getMonth() + 1, d.getDate()];

describe("known reference dates", () => {
  // Nepali New Year (1 Baisakh) from the official calendar, plus the dates the booking site is checked against
  it.each([
    [2075, [2018, 4, 14]],
    [2076, [2019, 4, 14]],
    [2077, [2020, 4, 13]],
    [2078, [2021, 4, 14]],
    [2079, [2022, 4, 14]],
    [2080, [2023, 4, 14]],
    [2081, [2024, 4, 13]],
    [2082, [2025, 4, 14]],
    [2083, [2026, 4, 14]],
    [2084, [2027, 4, 14]],
  ])("1 Baisakh %i BS is %j", (year, english) => {
    expect(ymd(bsToAd(year, 0, 1))).toEqual(english);
    expect(adToBs(ad(...english))).toEqual({ year, month: 0, day: 1 });
    expect(bsLabel(ad(...english))).toBe(`1 Baisakh ${year} BS`);
  });

  it.each([
    [[2026, 10, 18], "1 Kartik 2083 BS"],
    [[2026, 10, 17], "31 Ashwin 2083 BS"],
    [[2026, 10, 19], "2 Kartik 2083 BS"],
    [[2026, 11, 17], "1 Mangsir 2083 BS"],
    [[2026, 4, 13], "30 Chaitra 2082 BS"],
    [[2026, 4, 14], "1 Baisakh 2083 BS"],
    [[2026, 4, 15], "2 Baisakh 2083 BS"],
  ])("%j is %s", (english, label) => {
    expect(bsLabel(ad(...english))).toBe(label);
  });

  it("18 October 2026 is 1 Kartik 2083", () => {
    expect(adToBs(ad(2026, 10, 18))).toEqual({ year: 2083, month: 6, day: 1 });
    expect(BS_MONTHS[6]).toBe("Kartik");
    expect(ymd(bsToAd(2083, 6, 1))).toEqual([2026, 10, 18]);
  });

  it("goes from the last day of Chaitra to the first of Baisakh across the BS year", () => {
    expect(adToBs(ad(2026, 4, 13))).toEqual({ year: 2082, month: 11, day: 30 });
    expect(adToBs(ad(2026, 4, 14))).toEqual({ year: 2083, month: 0, day: 1 });
  });
});

describe("month lengths", () => {
  // From the converter's own tables for the years the site will use (29 to 32 days)
  const lengths = {
    2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
  };
  it.each(Object.entries(lengths))("%s", (year, expected) => {
    expect(Array.from({ length: 12 }, (_, m) => bsMonthLength(Number(year), m))).toEqual(expected);
  });

  it("every month of every supported year has 29 to 32 days, and a year has 365 or 366", () => {
    for (let year = 2000; year <= 2089; year++) {
      let total = 0;
      for (let month = 0; month < 12; month++) {
        const length = bsMonthLength(year, month);
        expect(length).toBeGreaterThanOrEqual(29);
        expect(length).toBeLessThanOrEqual(32);
        total += length;
      }
      expect([365, 366]).toContain(total);
    }
  });

  it("agrees with the distance between consecutive month starts", () => {
    for (let year = 2078; year <= 2086; year++) {
      for (let month = 0; month < 12; month++) {
        const start = bsToAd(year, month, 1);
        const next = month === 11 ? bsToAd(year + 1, 0, 1) : bsToAd(year, month + 1, 1);
        expect(Math.round((next - start) / 86400000)).toBe(bsMonthLength(year, month));
      }
    }
  });

  it("knows the last month of the supported range", () => {
    expect(bsMonthLength(2090, 11)).toBe(30);
  });

  it.each([[1999, 0], [2091, 0], [2083, -1], [2083, 12], [2083.5, 0], [2083, 0.5], [NaN, 0], [undefined, 0]])("is null for year %p month %p", (year, month) => {
    expect(bsMonthLength(year, month)).toBeNull();
  });
});

describe("round trips", () => {
  it("every English day from 2025 to 2029 converts to BS and back to itself, one BS day after the other", () => {
    let previous = null;
    for (let d = ad(2025, 1, 1); d < ad(2029, 12, 31); d = ad(d.getFullYear(), d.getMonth() + 1, d.getDate() + 1)) {
      const bs = adToBs(d);
      expect(bs).not.toBeNull();
      expect(ymd(bsToAd(bs.year, bs.month, bs.day))).toEqual(ymd(d));
      if (previous) {
        const sameMonth = previous.year === bs.year && previous.month === bs.month;
        if (sameMonth) expect(bs.day).toBe(previous.day + 1);
        else {
          expect(bs.day).toBe(1);
          expect(previous.day).toBe(bsMonthLength(previous.year, previous.month));
          expect(bs.month).toBe((previous.month + 1) % 12);
          expect(bs.year).toBe(previous.month === 11 ? previous.year + 1 : previous.year);
        }
      }
      previous = bs;
    }
  });

  it("is not thrown off by the time of day or by the date object's zone", () => {
    expect(adToBs(new Date(2026, 9, 18, 0, 0, 0))).toEqual({ year: 2083, month: 6, day: 1 });
    expect(adToBs(new Date(2026, 9, 18, 23, 59, 59, 999))).toEqual({ year: 2083, month: 6, day: 1 });
    expect(adToBs(new Date(2026, 9, 17, 23, 59, 59, 999))).toEqual({ year: 2083, month: 5, day: 31 });
  });
});

describe("dates the converter cannot handle", () => {
  it("has the documented supported range", () => {
    const { min, max } = bsSupportedRange();
    expect(ymd(min)).toEqual([1943, 4, 14]);
    expect(ymd(max)[0]).toBe(2034);
  });

  it.each([
    [[1943, 4, 14], true],
    [[1943, 4, 13], false],
    [[1900, 1, 1], false],
    [[1913, 4, 13], false],
    [[2026, 10, 18], true],
    [[2034, 1, 1], true],
    [[2044, 1, 1], false],
    [[2100, 1, 1], false],
  ])("isBsSupported(%j) is %s", (english, supported) => {
    expect(isBsSupported(ad(...english))).toBe(supported);
  });

  it.each([[null], [undefined], [""], [new Date("nope")], [ad(1900, 1, 1)], [ad(1913, 4, 13)], [ad(2044, 1, 1)], [ad(2100, 1, 1)]])("bsLabel(%p) is an empty string, never a wrong date", (value) => {
    expect(bsLabel(value)).toBe("");
  });

  it("adToBs returns null rather than a wrong answer for early dates", () => {
    expect(adToBs(ad(1900, 1, 1))).toBeNull();
    expect(adToBs(ad(1913, 4, 13))).toBeNull();
    expect(adToBs(ad(2100, 1, 1))).toBeNull();
    expect(adToBs(null)).toBeNull();
  });

  it("accepts an ISO string or a timestamp for bsLabel", () => {
    expect(bsLabel(new Date(2026, 9, 18).toISOString())).toBe("1 Kartik 2083 BS");
    expect(bsLabel(new Date(2026, 9, 18, 12).getTime())).toBe("1 Kartik 2083 BS");
  });

  it.each([
    [2083, 6, 0],
    [2083, 6, 31], // Kartik has 30 days
    [2083, 7, 30], // Mangsir has 29
    [2083, 0, 33],
    [2083, 12, 1],
    [2083, -1, 1],
    [1999, 0, 1],
    [2091, 0, 1],
    [2083, 0, 1.5],
    [2083, 0, NaN],
  ])("bsToAd(%p, %p, %p) is null for a day that does not exist", (year, month, dayOfMonth) => {
    expect(bsToAd(year, month, dayOfMonth)).toBeNull();
  });

  it("bsToAd gives the first and last day of a month, and nothing after it", () => {
    expect(bsToAd(2083, 6, 30)).not.toBeNull();
    expect(ymd(bsToAd(2083, 6, 30))).toEqual([2026, 11, 16]);
    expect(bsToAd(2083, 6, 31)).toBeNull();
  });
});
