import { describe, expect, it } from "vitest";
import {
  addDays,
  adSpan,
  clampDate,
  dayNumber,
  dayStatus,
  daysInMonth,
  earliestBookableDay,
  focusTarget,
  isInView,
  keyTarget,
  lastBookableDay,
  monthDays,
  monthGrid,
  monthNav,
  monthView,
  rovingDay,
  sameDay,
  todayInKathmandu,
} from "./calendarMath";
import { bsMonthLength, bsToAd } from "./bsCalendar";

const d = (y, m, day) => new Date(y, m - 1, day);
const ymd = (date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()];
const TODAY = d(2026, 10, 15);
const MAX = lastBookableDay(TODAY); // 31 Oct 2028
const ctx = { today: TODAY, maxDate: MAX };

describe("today and the booking window", () => {
  it.each([
    ["2026-10-15T06:00:00Z", [2026, 10, 15]],
    ["2026-10-15T18:14:59.999Z", [2026, 10, 15]], // 23:59:59.999 in Kathmandu
    ["2026-10-15T18:15:00.000Z", [2026, 10, 16]], // midnight in Kathmandu
    ["2026-10-15T00:00:00.000Z", [2026, 10, 15]],
    ["2026-12-31T18:15:00.000Z", [2027, 1, 1]],
    ["2028-02-28T18:15:00.000Z", [2028, 2, 29]],
    ["2028-02-29T18:15:00.000Z", [2028, 3, 1]],
    ["2026-11-01T06:00:00Z", [2026, 11, 1]], // a US daylight saving day: Kathmandu does not care
  ])("at %s it is %j in Kathmandu, on any host", (instant, expected) => {
    expect(ymd(todayInKathmandu(new Date(instant)))).toEqual(expected);
  });

  it("tomorrow is the earliest day", () => {
    expect(ymd(earliestBookableDay(d(2026, 10, 15)))).toEqual([2026, 10, 16]);
    expect(ymd(earliestBookableDay(d(2026, 12, 31)))).toEqual([2027, 1, 1]);
    expect(ymd(earliestBookableDay(d(2028, 2, 28)))).toEqual([2028, 2, 29]);
  });

  it.each([
    [[2026, 10, 15], [2028, 10, 31]],
    [[2026, 10, 31], [2028, 10, 31]],
    [[2026, 1, 1], [2028, 1, 31]],
    [[2026, 2, 10], [2028, 2, 29]], // leap February
    [[2025, 2, 10], [2027, 2, 28]],
    [[2026, 12, 31], [2028, 12, 31]],
    [[2026, 11, 1], [2028, 11, 30]],
  ])("the last bookable day from %j is %j (end of the month 24 months on)", (today, last) => {
    expect(ymd(lastBookableDay(d(...today)))).toEqual(last);
  });
});

describe("month views (English)", () => {
  it.each([
    [[2026, 2, 17], "February 2026", 28, 0], // Sunday
    [[2027, 2, 1], "February 2027", 28, 1],
    [[2028, 2, 29], "February 2028", 29, 2], // leap year, starts on Tuesday
    [[2026, 1, 31], "January 2026", 31, 4],
    [[2026, 4, 30], "April 2026", 30, 3],
    [[2026, 12, 25], "December 2026", 31, 2],
    [[2100, 2, 1], "February 2100", 28, 1], // 2100 is not a leap year
    [[2024, 2, 29], "February 2024", 29, 4],
  ])("%j shows %s with %i days starting on weekday %i", (anchor, title, days, weekday) => {
    const view = monthView(d(...anchor), "AD");
    expect(view.title).toBe(title);
    expect(view.days).toBe(days);
    expect(view.start.getDate()).toBe(1);
    expect(view.start.getDay()).toBe(weekday);
  });

  it("previous and next are the first days of the neighbouring months, across year ends", () => {
    const dec = monthView(d(2026, 12, 10), "AD");
    expect(ymd(dec.next)).toEqual([2027, 1, 1]);
    expect(ymd(dec.prev)).toEqual([2026, 11, 1]);
    const jan = monthView(d(2027, 1, 20), "AD");
    expect(ymd(jan.prev)).toEqual([2026, 12, 1]);
    expect(ymd(jan.next)).toEqual([2027, 2, 1]);
  });

  it("walks 12 years of months with consistent starts and lengths", () => {
    let view = monthView(d(2026, 1, 1), "AD");
    for (let i = 0; i < 144; i++) {
      const next = monthView(view.next, "AD");
      expect(Math.round((next.start - view.start) / 86400000)).toBe(view.days);
      expect(view.days).toBe(daysInMonth(view.start.getFullYear(), view.start.getMonth()));
      view = next;
    }
    expect(ymd(view.start)).toEqual([2038, 1, 1]);
  });
});

describe("month views (BS)", () => {
  it("Kartik 2083 starts on 18 October 2026", () => {
    const view = monthView(d(2026, 10, 25), "BS");
    expect(view.title).toBe("Kartik 2083");
    expect(ymd(view.start)).toEqual([2026, 10, 18]);
    expect(view.days).toBe(30);
    expect(ymd(view.next)).toEqual([2026, 11, 17]);
    expect(ymd(view.prev)).toEqual([2026, 9, 17]); // Ashwin has 31 days
  });

  it("Chaitra 2082 ends on 13 April 2026, and the next view is Baisakh 2083", () => {
    const chaitra = monthView(d(2026, 4, 1), "BS");
    expect(chaitra.title).toBe("Chaitra 2082");
    expect(chaitra.days).toBe(30);
    const baisakh = monthView(chaitra.next, "BS");
    expect(baisakh.title).toBe("Baisakh 2083");
    expect(ymd(baisakh.start)).toEqual([2026, 4, 14]);
    expect(ymd(baisakh.prev)).toEqual(ymd(chaitra.start));
    expect(baisakh.days).toBe(31);
  });

  it("the first Baisakh view goes back to the previous year's Chaitra", () => {
    const view = monthView(d(2026, 4, 20), "BS");
    expect(view.title).toBe("Baisakh 2083");
    expect(monthView(view.prev, "BS").title).toBe("Chaitra 2082");
  });

  it("holds together over every BS month of 2080 to 2088 (108 months): lengths 29-32, neighbours line up", () => {
    let view = monthView(bsToAd(2080, 0, 1), "BS");
    expect(view.title).toBe("Baisakh 2080");
    for (let i = 0; i < 108; i++) {
      expect(view.days).toBeGreaterThanOrEqual(29);
      expect(view.days).toBeLessThanOrEqual(32);
      expect(view.days).toBe(bsMonthLength(view.bsYear, view.bsMonth));
      expect(Math.round((view.next - view.start) / 86400000)).toBe(view.days);
      const next = monthView(view.next, "BS");
      expect(ymd(next.prev)).toEqual(ymd(view.start));
      expect(next.bsMonth).toBe((view.bsMonth + 1) % 12);
      view = next;
    }
    expect(view.title).toBe("Baisakh 2089");
  });

  it("stays on the first or last supported month instead of failing outside the converter's range", () => {
    expect(monthView(d(1900, 1, 1), "BS").title).toBe("Baisakh 2000");
    expect(monthView(d(2100, 1, 1), "BS").title).toBe("Chaitra 2090");
    expect(() => monthView(d(1800, 6, 1), "BS")).not.toThrow();
  });

  it("the same date shows in either calendar without moving", () => {
    const date = d(2026, 11, 3);
    expect(isInView(monthView(date, "AD"), date)).toBe(true);
    expect(isInView(monthView(date, "BS"), date)).toBe(true);
  });
});

describe("the month grid", () => {
  it("pads with blanks to whole weeks, Sunday first", () => {
    const view = monthView(d(2026, 11, 1), "AD"); // 1 Nov 2026 is a Sunday, 30 days
    const { leading, weeks } = monthGrid(view);
    expect(leading).toBe(0);
    expect(weeks).toHaveLength(5);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(ymd(weeks[0][0])).toEqual([2026, 11, 1]);
    expect(weeks[4].slice(2)).toEqual([null, null, null, null, null]);
  });

  it("February 2026 fits exactly four weeks (starts Sunday, 28 days)", () => {
    const { leading, weeks } = monthGrid(monthView(d(2026, 2, 1), "AD"));
    expect(leading).toBe(0);
    expect(weeks).toHaveLength(4);
    expect(weeks.flat().every(Boolean)).toBe(true);
  });

  it("a month can need six weeks (31 days starting on Friday or Saturday)", () => {
    const { leading, weeks } = monthGrid(monthView(d(2026, 5, 1), "AD")); // 1 May 2026 is a Friday
    expect(leading).toBe(5);
    expect(weeks).toHaveLength(6);
  });

  it("every month of 2026 to 2029 in both calendars has the right number of day cells in the right columns", () => {
    for (const mode of ["AD", "BS"]) {
      let view = monthView(d(2026, 1, 1), mode);
      for (let i = 0; i < 48; i++) {
        const { leading, weeks } = monthGrid(view);
        const cells = weeks.flat();
        expect(cells.length % 7).toBe(0);
        expect(cells.filter(Boolean)).toHaveLength(view.days);
        expect(cells.slice(0, leading).every((c) => c === null)).toBe(true);
        expect(cells[leading].getTime()).toBe(view.start.getTime());
        cells.filter(Boolean).forEach((cell, index) => expect(cell.getDay()).toBe((view.start.getDay() + index) % 7));
        expect(weeks.length).toBeGreaterThanOrEqual(4);
        expect(weeks.length).toBeLessThanOrEqual(6);
        view = monthView(view.next, mode);
      }
    }
  });

  it("monthDays lists each day once, in order", () => {
    const days = monthDays(monthView(d(2028, 2, 10), "AD"));
    expect(days).toHaveLength(29);
    expect(ymd(days[28])).toEqual([2028, 2, 29]);
    days.forEach((day, i) => i && expect(day.getTime() - days[i - 1].getTime()).toBeGreaterThan(0));
  });
});

describe("day numbers and labels", () => {
  it("prints the English date in AD and the BS day of the month in BS", () => {
    const ad = monthView(d(2026, 10, 25), "AD");
    const bs = monthView(d(2026, 10, 25), "BS");
    expect(dayNumber(d(2026, 10, 25), ad)).toBe(25);
    expect(dayNumber(d(2026, 10, 18), bs)).toBe(1);
    expect(dayNumber(d(2026, 10, 25), bs)).toBe(8);
    expect(dayNumber(d(2026, 11, 16), bs)).toBe(30);
  });

  it("adSpan names the English months a Nepali month covers", () => {
    expect(adSpan(d(2026, 10, 18), 30)).toBe("Oct to Nov 2026");
    expect(adSpan(d(2026, 12, 20), 30)).toBe("Dec to Jan 2027");
    expect(adSpan(d(2026, 11, 1), 30)).toBe("Nov 2026");
  });
});

describe("which days can be picked", () => {
  const booked = (date) => sameDay(date, d(2026, 10, 20));
  const status = (date, isUnavailable = booked) => dayStatus(date, { today: TODAY, maxDate: MAX, isUnavailable });

  it.each([
    ["today", d(2026, 10, 15), "today, requests need at least a day's notice"],
    ["yesterday", d(2026, 10, 14), "past date"],
    ["last year", d(2025, 10, 15), "past date"],
    ["tomorrow", d(2026, 10, 16), ""],
    ["a booked day", d(2026, 10, 20), "already booked"],
    ["the last bookable day", MAX, ""],
    ["the day after the last bookable day", addDays(MAX, 1), "too far ahead"],
    ["far in the future", d(2040, 1, 1), "too far ahead"],
  ])("%s: %s", (_name, date, expected) => {
    expect(status(date)).toBe(expected);
  });

  it("today wins over booked, and the horizon wins over booked", () => {
    expect(status(TODAY, () => true)).toMatch(/^today/);
    expect(status(addDays(MAX, 3), () => true)).toBe("too far ahead");
    expect(status(d(2026, 10, 14), () => true)).toBe("past date");
  });

  it("works without an availability check", () => {
    expect(dayStatus(d(2026, 10, 20), { today: TODAY, maxDate: MAX })).toBe("");
  });

  it("clampDate keeps a date inside its limits", () => {
    expect(ymd(clampDate(d(2026, 1, 1), d(2026, 3, 1), d(2026, 6, 1)))).toEqual([2026, 3, 1]);
    expect(ymd(clampDate(d(2026, 12, 1), d(2026, 3, 1), d(2026, 6, 1)))).toEqual([2026, 6, 1]);
    expect(ymd(clampDate(d(2026, 4, 1), d(2026, 3, 1), d(2026, 6, 1)))).toEqual([2026, 4, 1]);
  });
});

describe("month navigation limits", () => {
  it("cannot go back from this month, and can go forward until the last bookable month", () => {
    const now = monthView(TODAY, "AD");
    expect(monthNav(now, ctx)).toEqual({ canGoBack: false, canGoForward: true });
    const next = monthView(now.next, "AD");
    expect(monthNav(next, ctx).canGoBack).toBe(true);

    let view = now;
    let steps = 0;
    while (monthNav(view, ctx).canGoForward) {
      view = monthView(view.next, "AD");
      steps++;
    }
    expect(steps).toBe(24);
    expect(view.title).toBe("October 2028");
    expect(monthNav(view, ctx).canGoForward).toBe(false);
  });

  it("the same in BS: back is disabled in the current Nepali month, forward stops at the horizon", () => {
    const now = monthView(TODAY, "BS");
    expect(now.title).toBe("Ashwin 2083");
    expect(monthNav(now, ctx).canGoBack).toBe(false);
    let view = now;
    let steps = 0;
    while (monthNav(view, ctx).canGoForward) {
      view = monthView(view.next, "BS");
      steps++;
      expect(steps).toBeLessThan(40);
    }
    expect(steps).toBeGreaterThanOrEqual(23);
    expect(steps).toBeLessThanOrEqual(25);
    expect(view.start <= MAX).toBe(true);
    expect(view.next > MAX).toBe(true);
  });
});

describe("keyboard movement", () => {
  const view = (date, mode = "AD") => monthView(date, mode);
  const move = (key, from, mode = "AD") => keyTarget(key, from, view(from, mode));
  const focus = (key, from, mode = "AD", extra = ctx) => focusTarget(key, from, view(from, mode), extra);

  it.each([
    ["ArrowRight", [2026, 10, 20], [2026, 10, 21]],
    ["ArrowLeft", [2026, 10, 20], [2026, 10, 19]],
    ["ArrowDown", [2026, 10, 20], [2026, 10, 27]],
    ["ArrowUp", [2026, 10, 20], [2026, 10, 13]],
    ["ArrowRight", [2026, 10, 31], [2026, 11, 1]], // month boundary
    ["ArrowLeft", [2026, 11, 1], [2026, 10, 31]],
    ["ArrowDown", [2026, 10, 28], [2026, 11, 4]],
    ["ArrowUp", [2026, 11, 3], [2026, 10, 27]],
    ["ArrowRight", [2026, 12, 31], [2027, 1, 1]], // year boundary
    ["ArrowLeft", [2027, 1, 1], [2026, 12, 31]],
    ["ArrowDown", [2026, 12, 28], [2027, 1, 4]],
    ["ArrowUp", [2027, 1, 3], [2026, 12, 27]],
    ["ArrowRight", [2028, 2, 28], [2028, 2, 29]], // leap day
    ["ArrowRight", [2028, 2, 29], [2028, 3, 1]],
    ["ArrowRight", [2027, 2, 28], [2027, 3, 1]],
    ["Home", [2026, 10, 21], [2026, 10, 18]], // Wednesday -> Sunday
    ["End", [2026, 10, 21], [2026, 10, 24]], // Wednesday -> Saturday
    ["Home", [2026, 10, 18], [2026, 10, 18]], // already Sunday
    ["End", [2026, 10, 24], [2026, 10, 24]], // already Saturday
    ["Home", [2026, 11, 2], [2026, 11, 1]],
    ["End", [2026, 10, 28], [2026, 10, 31]],
    ["End", [2026, 12, 31], [2027, 1, 2]], // the week runs into the next month and year
    ["Home", [2026, 12, 31], [2026, 12, 27]],
  ])("%s from %j goes to %j", (key, from, to) => {
    expect(ymd(move(key, d(...from)))).toEqual(to);
  });

  it.each([
    ["PageDown", [2026, 10, 15], [2026, 11, 15]],
    ["PageUp", [2026, 11, 15], [2026, 10, 15]],
    ["PageDown", [2026, 12, 15], [2027, 1, 15]], // across the year
    ["PageUp", [2027, 1, 15], [2026, 12, 15]],
    ["PageDown", [2027, 1, 31], [2027, 2, 28]], // shortened to the shorter month
    ["PageDown", [2028, 1, 31], [2028, 2, 29]],
    ["PageDown", [2026, 1, 30], [2026, 2, 28]],
    ["PageUp", [2026, 3, 31], [2026, 2, 28]],
    ["PageUp", [2028, 3, 31], [2028, 2, 29]],
    ["PageDown", [2026, 5, 31], [2026, 6, 30]],
    ["PageDown", [2026, 10, 29], [2026, 11, 29]],
    ["PageUp", [2026, 1, 31], [2025, 12, 31]],
  ])("AD %s from %j goes to the same day of the month, %j", (key, from, to) => {
    expect(ymd(move(key, d(...from)))).toEqual(to);
  });

  it("BS PageDown/PageUp keep the day of the Nepali month, shortened to the target month", () => {
    const kartik8 = d(2026, 10, 25); // 8 Kartik 2083
    expect(ymd(move("PageDown", kartik8, "BS"))).toEqual(ymd(bsToAd(2083, 7, 8)));
    expect(ymd(move("PageUp", kartik8, "BS"))).toEqual(ymd(bsToAd(2083, 5, 8)));
    // 30 Kartik (30 days) -> Mangsir has 29 days -> 29 Mangsir
    expect(ymd(move("PageDown", bsToAd(2083, 6, 30), "BS"))).toEqual(ymd(bsToAd(2083, 7, 29)));
    // 31 Baisakh -> Jestha has 31; 32 Ashadh -> Shrawan has 31 -> 31 Shrawan
    expect(ymd(move("PageDown", bsToAd(2083, 2, 32), "BS"))).toEqual(ymd(bsToAd(2083, 3, 31)));
    // across the BS year: Chaitra -> Baisakh and back
    expect(ymd(move("PageDown", bsToAd(2082, 11, 15), "BS"))).toEqual(ymd(bsToAd(2083, 0, 15)));
    expect(ymd(move("PageUp", bsToAd(2083, 0, 15), "BS"))).toEqual(ymd(bsToAd(2082, 11, 15)));
    expect(ymd(move("PageUp", bsToAd(2083, 0, 31), "BS"))).toEqual(ymd(bsToAd(2082, 11, 30)));
  });

  it.each([["a"], ["Enter"], [" "], ["Tab"], ["Escape"], ["Shift"], [""], [undefined]])("ignores %p", (key) => {
    expect(keyTarget(key, d(2026, 10, 20), view(d(2026, 10, 20)))).toBeNull();
    expect(focusTarget(key, d(2026, 10, 20), view(d(2026, 10, 20)), ctx)).toBeNull();
  });

  describe("limits: tomorrow at the earliest, the last bookable day at the latest", () => {
    const tomorrow = d(2026, 10, 16);
    it("does not move before tomorrow", () => {
      for (const key of ["ArrowLeft", "ArrowUp", "Home", "PageUp"]) {
        expect(ymd(focus(key, tomorrow))).toEqual([2026, 10, 16]);
      }
      expect(ymd(focus("ArrowLeft", d(2026, 10, 17)))).toEqual([2026, 10, 16]);
      expect(ymd(focus("ArrowUp", d(2026, 10, 20)))).toEqual([2026, 10, 16]);
      expect(ymd(focus("PageUp", d(2026, 11, 3)))).toEqual([2026, 10, 16]);
      expect(ymd(focus("Home", d(2026, 10, 17)))).toEqual([2026, 10, 16]);
    });

    it("does not move past the last bookable day", () => {
      for (const key of ["ArrowRight", "ArrowDown", "End", "PageDown"]) {
        expect(ymd(focus(key, MAX))).toEqual(ymd(MAX));
      }
      expect(ymd(focus("PageDown", d(2028, 10, 20)))).toEqual(ymd(MAX));
      expect(ymd(focus("ArrowDown", d(2028, 10, 28)))).toEqual(ymd(MAX));
      expect(ymd(focus("End", d(2028, 10, 29)))).toEqual(ymd(MAX));
    });

    it("moves freely in between, across months, in both calendars", () => {
      expect(ymd(focus("ArrowRight", d(2026, 10, 31)))).toEqual([2026, 11, 1]);
      expect(ymd(focus("PageDown", d(2026, 10, 20)))).toEqual([2026, 11, 20]);
      const bsFrom = bsToAd(2083, 6, 10);
      expect(ymd(focus("PageDown", bsFrom, "BS"))).toEqual(ymd(bsToAd(2083, 7, 10)));
    });

    it("no sequence of 6,000 random key presses ever leaves the window, in either calendar", () => {
      let seed = 99;
      const next = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"];
      for (const mode of ["AD", "BS"]) {
        let current = d(2026, 12, 15);
        for (let i = 0; i < 3000; i++) {
          const key = keys[Math.floor(next() * keys.length)];
          const target = focusTarget(key, current, monthView(current, mode), ctx);
          expect(target).not.toBeNull();
          expect(target >= earliestBookableDay(TODAY)).toBe(true);
          expect(target <= MAX).toBe(true);
          expect(target.getHours()).toBe(0);
          current = target;
        }
      }
    });
  });
});

describe("the tab stop", () => {
  const nov = monthView(d(2026, 11, 10), "AD");
  const oct = monthView(d(2026, 10, 10), "AD");

  it("is the day last moved to, when it is in this month", () => {
    expect(ymd(rovingDay({ focus: d(2026, 11, 12), value: d(2026, 11, 3), view: nov, ...ctx }))).toEqual([2026, 11, 12]);
  });

  it("else the chosen day when it is in this month", () => {
    expect(ymd(rovingDay({ focus: d(2026, 10, 30), value: d(2026, 11, 3), view: nov, ...ctx }))).toEqual([2026, 11, 3]);
    expect(ymd(rovingDay({ focus: null, value: d(2026, 11, 3, 15), view: nov, ...ctx }))).toEqual([2026, 11, 3]);
  });

  it("else the first day that can be picked", () => {
    expect(ymd(rovingDay({ focus: null, value: null, view: oct, ...ctx }))).toEqual([2026, 10, 16]); // tomorrow
    expect(ymd(rovingDay({ focus: null, value: null, view: nov, ...ctx }))).toEqual([2026, 11, 1]);
    expect(ymd(rovingDay({ focus: null, value: d(2026, 12, 1), view: nov, ...ctx }))).toEqual([2026, 11, 1]);
  });

  it("falls back to the month's first day when nothing in it can be picked (past months)", () => {
    const past = monthView(d(2026, 8, 5), "AD");
    expect(ymd(rovingDay({ focus: null, value: null, view: past, ...ctx }))).toEqual([2026, 8, 1]);
  });

  it("is exactly one day of the month", () => {
    const stop = rovingDay({ focus: null, value: null, view: nov, ...ctx });
    expect(monthDays(nov).filter((day) => day.getTime() === stop.getTime())).toHaveLength(1);
  });
});
