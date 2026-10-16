import { describe, expect, it } from "vitest";
import { EVENT_TYPES, SHIFT_OPTIONS, effectiveStatus, formatDate, formatHours, formatShortDate, serverDay, shiftLabel, toInquiryDate } from "./inquiryOptions";

const ymd = (date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()];

describe("serverDay: the Kathmandu calendar day of an instant, as a local-midnight date", () => {
  it.each([
    ["2026-11-18T06:15:00.000Z", [2026, 11, 18]], // noon in Kathmandu
    ["2026-11-18T00:00:00.000Z", [2026, 11, 18]], // 05:45 in Kathmandu
    ["2026-11-17T18:14:59.999Z", [2026, 11, 17]], // 23:59:59.999 the day before
    ["2026-11-17T18:15:00.000Z", [2026, 11, 18]], // 00:00 in Kathmandu: the day starts here
    ["2026-11-18T18:14:59.999Z", [2026, 11, 18]],
    ["2026-11-18T18:15:00.000Z", [2026, 11, 19]],
    ["2026-12-31T18:15:00.000Z", [2027, 1, 1]],
    ["2027-01-01T00:00:00.000Z", [2027, 1, 1]],
    ["2028-02-28T18:15:00.000Z", [2028, 2, 29]], // leap day
    ["2028-02-29T18:15:00.000Z", [2028, 3, 1]],
    ["2027-02-28T18:15:00.000Z", [2027, 3, 1]],
    ["2026-03-08T06:15:00.000Z", [2026, 3, 8]], // daylight saving elsewhere changes nothing
    ["2026-11-01T06:15:00.000Z", [2026, 11, 1]],
  ])("%s is %j", (instant, expected) => {
    expect(ymd(serverDay(instant))).toEqual(expected);
  });

  it("accepts Date objects and timestamps, and returns local midnight", () => {
    const fromDate = serverDay(new Date("2026-11-18T06:15:00Z"));
    expect(ymd(fromDate)).toEqual([2026, 11, 18]);
    expect([fromDate.getHours(), fromDate.getMinutes(), fromDate.getSeconds(), fromDate.getMilliseconds()]).toEqual([0, 0, 0, 0]);
    expect(ymd(serverDay(Date.parse("2026-11-18T06:15:00Z")))).toEqual([2026, 11, 18]);
  });

  it("throws for something that is not a date rather than inventing one", () => {
    expect(() => serverDay("not a date")).toThrow();
  });
});

describe("toInquiryDate: what the form sends for a chosen day", () => {
  it.each([
    [[2026, 11, 18], "2026-11-18T06:15:00.000Z"],
    [[2026, 1, 1], "2026-01-01T06:15:00.000Z"],
    [[2026, 12, 31], "2026-12-31T06:15:00.000Z"],
    [[2028, 2, 29], "2028-02-29T06:15:00.000Z"],
    [[2027, 3, 1], "2027-03-01T06:15:00.000Z"],
    [[2026, 3, 8], "2026-03-08T06:15:00.000Z"],
    [[2026, 11, 1], "2026-11-01T06:15:00.000Z"],
    [[2100, 2, 28], "2100-02-28T06:15:00.000Z"],
  ])("%j -> %s (noon in Kathmandu)", (day, expected) => {
    expect(toInquiryDate(new Date(day[0], day[1] - 1, day[2]))).toBe(expected);
  });

  it("ignores the time of day on the picked date", () => {
    expect(toInquiryDate(new Date(2026, 10, 18, 23, 59, 59))).toBe("2026-11-18T06:15:00.000Z");
    expect(toInquiryDate(new Date(2026, 10, 18, 0, 0, 0))).toBe("2026-11-18T06:15:00.000Z");
  });

  it("round-trips: the day the server stores is the day the visitor picked (every day 2026-2029, any host zone)", () => {
    let checked = 0;
    for (let day = new Date(2026, 0, 1); day < new Date(2030, 0, 1); day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
      const sent = toInquiryDate(day);
      expect(ymd(serverDay(sent))).toEqual(ymd(day));
      // and the Kathmandu clock reads noon, nowhere near a day boundary
      expect(new Date(sent).getTime() % 86400000).toBe(((6 * 60 + 15) * 60000));
      checked++;
    }
    expect(checked).toBe(1461);
  });

  it("is a valid ISO 8601 string with milliseconds and Z, as the backend validator requires", () => {
    expect(toInquiryDate(new Date(2026, 10, 18))).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe("formatHours", () => {
  it.each([
    ["10:00", "15:00", "10:00 am to 3:00 pm"],
    ["17:00", "22:00", "5:00 pm to 10:00 pm"],
    ["10:00", "22:00", "10:00 am to 10:00 pm"],
    ["00:00", "23:59", "12:00 am to 11:59 pm"],
    ["12:00", "12:30", "12:00 pm to 12:30 pm"],
    ["00:30", "01:05", "12:30 am to 1:05 am"],
    ["09:05", "11:59", "9:05 am to 11:59 am"],
    ["13:00", "13:01", "1:00 pm to 1:01 pm"],
  ])("%s - %s -> %s", (from, to, expected) => {
    expect(formatHours(from, to)).toBe(expected);
  });
});

describe("shift options and labels", () => {
  it("lists the three shifts with the platform's default hours", () => {
    expect(SHIFT_OPTIONS.map((s) => [s.value, s.fallback.startTime, s.fallback.endTime])).toEqual([
      ["day", "10:00", "15:00"],
      ["night", "17:00", "22:00"],
      ["full_day", "10:00", "22:00"],
    ]);
  });

  it.each([["day", "Day"], ["night", "Night"], ["full_day", "Full day"], [null, "Flexible"], [undefined, "Flexible"], ["", "Flexible"], ["brunch", "Flexible"]])("shiftLabel(%p) = %s", (value, label) => {
    expect(shiftLabel(value)).toBe(label);
  });

  it("offers the event types people in Nepal ask for", () => {
    expect(EVENT_TYPES).toContain("Wedding");
    expect(EVENT_TYPES).toContain("Bratabandha");
    expect(new Set(EVENT_TYPES).size).toBe(EVENT_TYPES.length);
  });
});

describe("effectiveStatus", () => {
  it("shows an inquiry that has a booking as booked, whatever its raw status", () => {
    expect(effectiveStatus({ status: "accepted", booking: "b1" })).toBe("booked");
    expect(effectiveStatus({ status: "quoted", booking: { _id: "b1" } })).toBe("booked");
  });
  it("otherwise shows the raw status", () => {
    expect(effectiveStatus({ status: "pending", booking: null })).toBe("pending");
    expect(effectiveStatus({ status: "declined" })).toBe("declined");
  });
});

describe("date formatting", () => {
  it("writes the weekday, day, month and year in English (en-GB)", () => {
    expect(formatDate(new Date(2026, 10, 18))).toBe("Wednesday, 18 November 2026");
    expect(formatShortDate(new Date(2026, 10, 18))).toBe("Wed, 18 Nov 2026");
    expect(formatDate(new Date(2028, 1, 29))).toBe("Tuesday, 29 February 2028");
  });
});
