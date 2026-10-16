import { describe, expect, it } from "vitest";
import { DEFAULT_TIERS, isUpcoming, npr, pluralDays, refundPercentageNow, tierRows } from "./bookingFormat";
import { npr as dashboardNpr } from "../../components/dashboard/styles";
import { plural } from "../../utils/plural";
import { priceFormatter } from "../venues/venueFormat";

describe.each([
  ["booking pages", npr],
  ["owner pages", dashboardNpr],
])("money formatting (%s)", (_name, format) => {
  it.each([
    [0, "NPR 0"],
    [5, "NPR 5"],
    [999, "NPR 999"],
    [1000, "NPR 1,000"],
    [20000, "NPR 20,000"],
    [99999, "NPR 99,999"],
    [100000, "NPR 1,00,000"], // lakh grouping
    [123456, "NPR 1,23,456"],
    [1234567, "NPR 12,34,567"],
    [10000000, "NPR 1,00,00,000"], // one crore
    [123456789, "NPR 12,34,56,789"],
    [-2500, "NPR -2,500"],
  ])("%d -> %s", (amount, expected) => {
    expect(format(amount)).toBe(expected);
  });

  it("rounds to whole rupees, half up", () => {
    expect(format(99.4)).toBe("NPR 99");
    expect(format(99.5)).toBe("NPR 100");
    expect(format(24999.75)).toBe("NPR 25,000");
    expect(format(16666.5)).toBe("NPR 16,667");
  });

  it.each([[null], [undefined], [NaN], [""], ["abc"]])("shows NPR 0 for %p instead of NaN", (value) => {
    expect(format(value)).toBe("NPR 0");
  });

  it("accepts numbers that arrive as text", () => {
    expect(format("150000")).toBe("NPR 1,50,000");
  });
});

describe("priceFormatter", () => {
  it("groups the Indian way", () => {
    expect(priceFormatter.format(1500)).toBe("1,500");
    expect(priceFormatter.format(250000)).toBe("2,50,000");
  });
});

describe("plural", () => {
  it.each([
    [0, "guest", "0 guests"],
    [1, "guest", "1 guest"],
    [2, "guest", "2 guests"],
    [100, "guest", "100 guests"],
    ["1", "guest", "1 guest"],
    ["2", "guest", "2 guests"],
  ])("plural(%p, %s) = %s", (n, word, expected) => {
    expect(plural(n, word)).toBe(expected);
  });

  it("takes an irregular plural", () => {
    expect(plural(1, "inquiry", "inquiries")).toBe("1 inquiry");
    expect(plural(3, "inquiry", "inquiries")).toBe("3 inquiries");
    expect(plural(0, "inquiry", "inquiries")).toBe("0 inquiries");
  });

  it("pluralDays", () => {
    expect(pluralDays(1)).toBe("1 day");
    expect(pluralDays(0)).toBe("0 days");
    expect(pluralDays(30)).toBe("30 days");
  });
});

describe("refundPercentageNow: the same tiers as the server, to the millisecond", () => {
  const DAY = 86400000;
  const NOW = Date.parse("2026-10-06T06:00:00Z");
  const booking = (startsIn, extra = {}) => ({ startTime: new Date(NOW + startsIn).toISOString(), ...extra });

  it.each([
    [365 * DAY, 100],
    [30 * DAY + 1000, 100],
    [30 * DAY, 100],
    [30 * DAY - 1, 75],
    [15 * DAY, 75],
    [15 * DAY - 1, 50],
    [7 * DAY, 50],
    [7 * DAY - 1, 0],
    [DAY, 0],
    [1, 0],
    [0, 0],
    [-DAY, 0],
  ])("%d ms before the event refunds %i%%", (startsIn, percent) => {
    expect(refundPercentageNow(booking(startsIn), NOW)).toBe(percent);
  });

  it("uses the tiers stored on the booking, in any order", () => {
    const custom = { cancellationPolicy: [{ minDaysBefore: 0, refundPercentage: 20 }, { minDaysBefore: 10, refundPercentage: 90 }] };
    expect(refundPercentageNow(booking(12 * DAY, custom), NOW)).toBe(90);
    expect(refundPercentageNow(booking(9 * DAY, custom), NOW)).toBe(20);
  });

  it("falls back to the platform tiers when none are stored", () => {
    expect(refundPercentageNow(booking(20 * DAY, { cancellationPolicy: [] }), NOW)).toBe(75);
    expect(refundPercentageNow(booking(20 * DAY), NOW)).toBe(75);
  });

  it("counts elapsed time, not calendar days (a daylight saving change changes nothing)", () => {
    const start = Date.parse("2026-11-05T04:15:00Z");
    expect(refundPercentageNow({ startTime: new Date(start).toISOString() }, start - 30 * DAY)).toBe(100);
    expect(refundPercentageNow({ startTime: new Date(start).toISOString() }, start - 30 * DAY + 1)).toBe(75);
  });

  it("matches the server's default tiers", () => {
    expect(DEFAULT_TIERS).toEqual([
      { minDaysBefore: 30, refundPercentage: 100 },
      { minDaysBefore: 15, refundPercentage: 75 },
      { minDaysBefore: 7, refundPercentage: 50 },
      { minDaysBefore: 0, refundPercentage: 0 },
    ]);
  });
});

describe("tierRows", () => {
  it("describes each tier's range, highest first", () => {
    expect(tierRows({}).map((t) => [t.range, t.refundPercentage])).toEqual([
      ["30 or more days before", 100],
      ["15 to 29 days before", 75],
      ["7 to 14 days before", 50],
      ["Less than 7 days before", 0],
    ]);
  });
});

describe("isUpcoming", () => {
  it("is true for a future start and false for a past one", () => {
    expect(isUpcoming({ startTime: new Date(Date.now() + 60000).toISOString() })).toBe(true);
    expect(isUpcoming({ startTime: new Date(Date.now() - 60000).toISOString() })).toBe(false);
  });
});
