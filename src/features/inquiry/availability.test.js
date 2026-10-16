import { describe, expect, it } from "vitest";
import { at, hoursFor, isBlocked, isDateUnavailable } from "./availability";

// Kathmandu is UTC+5:45 with no daylight saving. This is the test's own reference clock, not the code's.
const ktm = (y, m, d, hh, mm = 0, ss = 0, ms = 0) => new Date(Date.UTC(y, m - 1, d, hh, mm, ss, ms) - 345 * 60000);
const iso = (d) => d.toISOString();
// A calendar day as the date picker hands it over: local midnight
const day = (y, m, d) => new Date(y, m - 1, d);

const A = { _id: "space-a" };
const B = { _id: "space-b" };
const booking = (space, from, to) => ({ space: space._id, startTime: iso(from), endTime: iso(to) });
// Bookings the way the server stores them for a Kathmandu day
const day18 = (space, shift) => {
  const hours = { day: [10, 15], night: [17, 22], full_day: [10, 22] }[shift];
  return booking(space, ktm(2026, 11, 18, hours[0]), ktm(2026, 11, 18, hours[1]));
};
const NOV18 = day(2026, 11, 18);

describe("at(): Kathmandu clock times as instants", () => {
  it.each([
    [[2026, 11, 18], "10:00", "2026-11-18T04:15:00.000Z"],
    [[2026, 11, 18], "22:00", "2026-11-18T16:15:00.000Z"],
    [[2026, 11, 18], "00:00", "2026-11-17T18:15:00.000Z"],
    [[2026, 11, 18], "05:44", "2026-11-17T23:59:00.000Z"],
    [[2026, 11, 18], "05:45", "2026-11-18T00:00:00.000Z"],
    [[2026, 12, 31], "23:59", "2026-12-31T18:14:00.000Z"],
    [[2027, 1, 1], "00:00", "2026-12-31T18:15:00.000Z"],
    [[2028, 2, 29], "10:00", "2028-02-29T04:15:00.000Z"],
    [[2026, 3, 8], "10:00", "2026-03-08T04:15:00.000Z"], // US daylight saving day: nothing moves
    [[2026, 10, 25], "10:00", "2026-10-25T04:15:00.000Z"], // EU daylight saving day
  ])("%j %s -> %s", ([y, m, d], hhmm, expected) => {
    expect(iso(at(day(y, m, d), hhmm))).toBe(expected);
  });
});

describe("hoursFor()", () => {
  it("uses the platform defaults without overrides", () => {
    expect(hoursFor(A, "day")).toEqual(["10:00", "15:00"]);
    expect(hoursFor(A, "night")).toEqual(["17:00", "22:00"]);
    expect(hoursFor(A, "full_day")).toEqual(["10:00", "22:00"]);
    expect(hoursFor(undefined, "day")).toEqual(["10:00", "15:00"]);
  });

  it("uses the space's own hours for that shift only", () => {
    const space = { _id: "x", resolvedShifts: { day: { startTime: "09:30", endTime: "13:00" } } };
    expect(hoursFor(space, "day")).toEqual(["09:30", "13:00"]);
    expect(hoursFor(space, "night")).toEqual(["17:00", "22:00"]);
  });

  it.each([
    ["end before start", { startTime: "20:00", endTime: "02:00" }],
    ["end equals start", { startTime: "10:00", endTime: "10:00" }],
    ["not a clock time", { startTime: "ten", endTime: "noon" }],
    ["24:00", { startTime: "10:00", endTime: "24:00" }],
    ["missing end", { startTime: "10:00" }],
  ])("falls back to the defaults for unusable hours (%s)", (_name, hours) => {
    expect(hoursFor({ _id: "x", resolvedShifts: { day: hours } }, "day")).toEqual(["10:00", "15:00"]);
  });
});

describe("isDateUnavailable: empty and invalid input", () => {
  it("is false with nothing to go on", () => {
    expect(isDateUnavailable(NOV18)).toBe(false);
    expect(isDateUnavailable(NOV18, {})).toBe(false);
    expect(isDateUnavailable(NOV18, { booked: [], spaces: [A] })).toBe(false);
    expect(isDateUnavailable(NOV18, { booked: [day18(A, "full_day")], spaces: [] })).toBe(false);
    expect(isDateUnavailable(NOV18, { booked: [day18(A, "full_day")] })).toBe(false);
  });

  it.each([[null], [undefined], [new Date("nope")], ["2026-11-18"], [12345]])("is false for a date of %p", (bad) => {
    expect(isDateUnavailable(bad, { booked: [day18(A, "full_day")], spaces: [A] })).toBe(false);
  });
});

describe("isDateUnavailable: one hall, every shift", () => {
  // [booked shift, requested shift (null = any), expected unavailable]
  const cases = [
    ["day", null, false], // the night is still free
    ["night", null, false], // the day is still free
    ["full_day", null, true],
    ["day", "day", true],
    ["day", "night", false],
    ["day", "full_day", true],
    ["night", "day", false],
    ["night", "night", true],
    ["night", "full_day", true],
    ["full_day", "day", true],
    ["full_day", "night", true],
    ["full_day", "full_day", true],
  ];
  it.each(cases)("booked %s, asking for %s -> unavailable: %s", (booked, asking, expected) => {
    expect(isDateUnavailable(NOV18, { booked: [day18(A, booked)], spaces: [A], shift: asking })).toBe(expected);
  });

  it("day and night both booked leave no shift at all", () => {
    expect(isDateUnavailable(NOV18, { booked: [day18(A, "day"), day18(A, "night")], spaces: [A] })).toBe(true);
    expect(isDateUnavailable(NOV18, { booked: [day18(A, "day"), day18(A, "night")], spaces: [A], shift: "full_day" })).toBe(true);
  });

  it("an unknown shift name is treated as no preference", () => {
    expect(isDateUnavailable(NOV18, { booked: [day18(A, "day")], spaces: [A], shift: "brunch" })).toBe(false);
    expect(isDateUnavailable(NOV18, { booked: [day18(A, "full_day")], spaces: [A], shift: "brunch" })).toBe(true);
  });

  it("other days are untouched", () => {
    const opts = { booked: [day18(A, "full_day")], spaces: [A] };
    expect(isDateUnavailable(day(2026, 11, 17), opts)).toBe(false);
    expect(isDateUnavailable(day(2026, 11, 19), opts)).toBe(false);
  });
});

describe("isDateUnavailable: exact boundaries", () => {
  const spaces = [A];
  const dayShift = (from, to) => ({ booked: [booking(A, from, to)], spaces, shift: "day" });

  it.each([
    ["ends exactly when the day shift starts (10:00)", ktm(2026, 11, 18, 8), ktm(2026, 11, 18, 10), false],
    ["ends one millisecond into the day shift", ktm(2026, 11, 18, 8), ktm(2026, 11, 18, 10, 0, 0, 1), true],
    ["starts exactly when the day shift ends (15:00)", ktm(2026, 11, 18, 15), ktm(2026, 11, 18, 18), false],
    ["starts one millisecond before the day shift ends", ktm(2026, 11, 18, 14, 59, 59, 999), ktm(2026, 11, 18, 18), true],
    ["sits inside the day shift", ktm(2026, 11, 18, 11), ktm(2026, 11, 18, 12), true],
    ["covers the whole day shift", ktm(2026, 11, 18, 9), ktm(2026, 11, 18, 16), true],
    ["covers the whole day on both sides (24 hours from Kathmandu midnight)", ktm(2026, 11, 18, 0), ktm(2026, 11, 19, 0), true],
    ["is on the day before", ktm(2026, 11, 17, 10), ktm(2026, 11, 17, 15), false],
    ["ends at Kathmandu midnight, the instant the day starts", ktm(2026, 11, 17, 18), ktm(2026, 11, 18, 0), false],
  ])("a booking that %s", (_name, from, to, expected) => {
    expect(isDateUnavailable(NOV18, dayShift(from, to))).toBe(expected);
  });

  it("the night shift starts at 17:00: a booking ending exactly then does not block it", () => {
    const opts = { spaces, shift: "night", booked: [booking(A, ktm(2026, 11, 18, 12), ktm(2026, 11, 18, 17))] };
    expect(isDateUnavailable(NOV18, opts)).toBe(false);
    expect(isDateUnavailable(NOV18, { ...opts, booked: [booking(A, ktm(2026, 11, 18, 12), ktm(2026, 11, 18, 17, 0, 0, 1))] })).toBe(true);
  });

  it("accepts instants given with any offset (the server sends Z, a proxy may not)", () => {
    const booked = [{ space: "space-a", startTime: "2026-11-18T10:00:00+05:45", endTime: "2026-11-18T15:00:00+05:45" }];
    expect(isDateUnavailable(NOV18, { booked, spaces, shift: "day" })).toBe(true);
    expect(isDateUnavailable(NOV18, { booked, spaces, shift: "night" })).toBe(false);
  });

  it("works across a year end and on the leap day", () => {
    const newYearsEve = { booked: [booking(A, ktm(2026, 12, 31, 17), ktm(2026, 12, 31, 22))], spaces, shift: "night" };
    expect(isDateUnavailable(day(2026, 12, 31), newYearsEve)).toBe(true);
    expect(isDateUnavailable(day(2027, 1, 1), newYearsEve)).toBe(false);
    const leap = { booked: [booking(A, ktm(2028, 2, 29, 10), ktm(2028, 2, 29, 22))], spaces };
    expect(isDateUnavailable(day(2028, 2, 29), leap)).toBe(true);
    expect(isDateUnavailable(day(2028, 2, 28), leap)).toBe(false);
    expect(isDateUnavailable(day(2028, 3, 1), leap)).toBe(false);
  });
});

describe("isDateUnavailable: several halls and the hall filter", () => {
  const booked = [day18(A, "full_day")];

  it("is available while any hall is still free", () => {
    expect(isDateUnavailable(NOV18, { booked, spaces: [A, B] })).toBe(false);
  });

  it("is unavailable only when every hall is taken", () => {
    expect(isDateUnavailable(NOV18, { booked: [day18(A, "full_day"), day18(B, "full_day")], spaces: [A, B] })).toBe(true);
    expect(isDateUnavailable(NOV18, { booked: [day18(A, "full_day"), day18(B, "day")], spaces: [A, B] })).toBe(false); // B's night is open
    expect(isDateUnavailable(NOV18, { booked: [day18(A, "full_day"), day18(B, "day")], spaces: [A, B], shift: "day" })).toBe(true);
  });

  it("looks at the chosen hall only", () => {
    expect(isDateUnavailable(NOV18, { booked, spaces: [A, B], spaceId: "space-a" })).toBe(true);
    expect(isDateUnavailable(NOV18, { booked, spaces: [A, B], spaceId: "space-b" })).toBe(false);
  });

  it("ignores a hall id that is not one of the venue's halls", () => {
    expect(isDateUnavailable(NOV18, { booked, spaces: [A, B], spaceId: "someone-else" })).toBe(false);
  });

  it("matches ids whatever their type (strings or objects with toString)", () => {
    const objectId = { toString: () => "space-a" };
    expect(isDateUnavailable(NOV18, { booked: [{ ...day18(A, "full_day"), space: objectId }], spaces: [A], spaceId: "space-a" })).toBe(true);
  });

  it("ignores bookings of halls that are not in the list", () => {
    expect(isDateUnavailable(NOV18, { booked: [day18({ _id: "elsewhere" }, "full_day")], spaces: [A, B] })).toBe(false);
  });

  it("ignores bookings with no hall", () => {
    expect(isDateUnavailable(NOV18, { booked: [{ startTime: iso(ktm(2026, 11, 18, 10)), endTime: iso(ktm(2026, 11, 18, 22)) }], spaces: [A] })).toBe(false);
  });
});

describe("isDateUnavailable: halls with their own hours", () => {
  const stretched = { _id: "space-a", resolvedShifts: { day: { startTime: "10:00", endTime: "17:30" } } };
  const evening = booking(stretched, ktm(2026, 11, 18, 16), ktm(2026, 11, 18, 17));

  it("blocks the shift that the booking overlaps under the hall's hours", () => {
    expect(isDateUnavailable(NOV18, { booked: [evening], spaces: [stretched], shift: "day" })).toBe(true);
  });

  it("leaves a shift that the hall's hours do not touch (night starts at 17:00, the booking ends then)", () => {
    expect(isDateUnavailable(NOV18, { booked: [evening], spaces: [stretched], shift: "night" })).toBe(false);
  });

  it("the same booking against default hours would not block the day shift's neighbour", () => {
    expect(isDateUnavailable(NOV18, { booked: [evening], spaces: [A], shift: "day" })).toBe(false);
  });

  it("a tiny booked window inside a long shift blocks it", () => {
    const tiny = booking(stretched, ktm(2026, 11, 18, 12), ktm(2026, 11, 18, 12, 1));
    expect(isBlocked(NOV18, stretched, "day", [tiny])).toBe(true);
    expect(isBlocked(NOV18, stretched, "night", [tiny])).toBe(false);
  });
});

describe("isDateUnavailable agrees with a brute-force reference (seeded random)", () => {
  // mulberry32: the same sequence on every machine and every run
  const rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  it("over 4,000 random days, halls, shifts and bookings", () => {
    const rand = rng(31415);
    const SHIFT_HOURS = { day: [600, 900], night: [1020, 1320], full_day: [600, 1320] }; // minutes after Kathmandu midnight
    let unavailable = 0;
    let available = 0;
    for (let i = 0; i < 4000; i++) {
      const spaces = [A, B, { _id: "space-c" }].slice(0, 1 + Math.floor(rand() * 3));
      const dayOffset = Math.floor(rand() * 6);
      const target = day(2026, 12, 29 + dayOffset); // crosses the year end
      const dayStartMs = Date.UTC(2026, 11, 29 + dayOffset) - 345 * 60000; // Kathmandu midnight of that day, by arithmetic
      const booked = Array.from({ length: Math.floor(rand() * 7) }, () => {
        const space = spaces[Math.floor(rand() * spaces.length)];
        const startMin = Math.floor((rand() * 3 - 1) * 1440) + Math.floor(rand() * 8) * 180;
        const lengthMin = 1 + Math.floor(rand() * 1000);
        const base = Date.UTC(2026, 11, 29 + Math.floor(rand() * 6)) - 345 * 60000;
        return { space: space._id, startTime: iso(new Date(base + startMin * 60000)), endTime: iso(new Date(base + (startMin + lengthMin) * 60000)) };
      });
      const shift = [null, "day", "night", "full_day"][Math.floor(rand() * 4)];
      const spaceId = rand() < 0.3 ? spaces[Math.floor(rand() * spaces.length)]._id : null;

      const wantedSpaces = spaceId ? spaces.filter((s) => s._id === spaceId) : spaces;
      const wantedShifts = shift ? [shift] : ["day", "night", "full_day"];
      const reference = !wantedSpaces.some((s) =>
        wantedShifts.some((k) => {
          const from = dayStartMs + SHIFT_HOURS[k][0] * 60000;
          const to = dayStartMs + SHIFT_HOURS[k][1] * 60000;
          return !booked.some((b) => b.space === s._id && Date.parse(b.startTime) < to && Date.parse(b.endTime) > from);
        })
      );
      const real = isDateUnavailable(target, { booked, spaces, spaceId, shift });
      const expected = booked.length === 0 ? false : reference;
      expect(real).toBe(expected);
      if (expected) unavailable++;
      else available++;
    }
    expect(unavailable).toBeGreaterThan(300);
    expect(available).toBeGreaterThan(300);
  });
});
