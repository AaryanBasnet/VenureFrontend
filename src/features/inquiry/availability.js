// Which calendar days are already taken, given the bookings the backend reports for a window.
// The backend sends only { space, startTime, endTime } for active bookings. A day is unavailable when no
// combination of the spaces and shifts the visitor is open to is still free.

const FALLBACK_HOURS = {
  day: ["10:00", "15:00"],
  night: ["17:00", "22:00"],
  full_day: ["10:00", "22:00"],
};
const SHIFT_KEYS = Object.keys(FALLBACK_HOURS);

const at = (date, hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
};

const hoursFor = (space, shift) => {
  const t = space?.resolvedShifts?.[shift];
  return t ? [t.startTime, t.endTime] : FALLBACK_HOURS[shift];
};

function isBlocked(date, space, shift, booked) {
  const [from, to] = hoursFor(space, shift);
  const start = at(date, from);
  const end = at(date, to);
  return booked.some((b) => String(b.space) === String(space._id) && new Date(b.startTime) < end && new Date(b.endTime) > start);
}

export function isDateUnavailable(date, { booked = [], spaces = [], spaceId = null, shift = null }) {
  const candidates = spaceId ? spaces.filter((s) => s._id === spaceId) : spaces;
  if (candidates.length === 0 || booked.length === 0) return false;
  const shifts = shift ? [shift] : SHIFT_KEYS;
  return !candidates.some((space) => shifts.some((k) => !isBlocked(date, space, k, booked)));
}
