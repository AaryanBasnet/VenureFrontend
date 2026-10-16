// Which calendar days are already taken, given the bookings the backend reports for a window.
// The backend sends only { space, startTime, endTime } for active bookings. A day is unavailable when no
// combination of the spaces and shifts the visitor is open to is still free.

export const FALLBACK_HOURS = {
  day: ["10:00", "15:00"],
  night: ["17:00", "22:00"],
  full_day: ["10:00", "22:00"],
};
export const SHIFT_KEYS = Object.keys(FALLBACK_HOURS);

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
// Kathmandu is UTC+5:45 all year (no daylight saving)
const NEPAL_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

// Shift hours are Kathmandu clock times, whatever time zone the visitor's device uses. `date` is a local-midnight
// Date standing for a calendar day; its calendar fields (not its instant) say which Kathmandu day is meant.
export const at = (date, hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h, m) - NEPAL_OFFSET_MS);
};

// A space's own hours for a shift (resolvedShifts from the API), or the platform default when it has none,
// or when its hours are not usable (the server refuses to book such a shift, so the default is only a display fallback).
export const hoursFor = (space, shift) => {
  const own = space?.resolvedShifts?.[shift];
  if (own && HHMM.test(own.startTime) && HHMM.test(own.endTime) && own.endTime > own.startTime) return [own.startTime, own.endTime];
  return FALLBACK_HOURS[shift];
};

const sameSpace = (a, b) => a != null && b != null && String(a) === String(b);

export function isBlocked(date, space, shift, booked) {
  const [from, to] = hoursFor(space, shift);
  const start = at(date, from);
  const end = at(date, to);
  // [start, end) against [bookedStart, bookedEnd): touching ranges do not clash
  return booked.some((b) => sameSpace(b.space, space._id) && new Date(b.startTime) < end && new Date(b.endTime) > start);
}

export function isDateUnavailable(date, { booked = [], spaces = [], spaceId = null, shift = null } = {}) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  const candidates = spaceId ? spaces.filter((s) => sameSpace(s._id, spaceId)) : spaces;
  if (candidates.length === 0 || booked.length === 0) return false;
  const shifts = SHIFT_KEYS.includes(shift) ? [shift] : SHIFT_KEYS;
  return !candidates.some((space) => shifts.some((k) => !isBlocked(date, space, k, booked)));
}
