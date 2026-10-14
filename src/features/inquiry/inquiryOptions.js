// Event types common in Nepal. The backend stores eventType as free text.
export const EVENT_TYPES = [
  "Wedding",
  "Reception",
  "Engagement",
  "Bratabandha",
  "Pasni",
  "Birthday",
  "Anniversary",
  "Corporate event",
  "Party or other",
];

// Same defaults as the backend's shiftService; a space can override them (resolvedShifts).
export const SHIFT_OPTIONS = [
  { value: "day", label: "Day", fallback: { startTime: "10:00", endTime: "15:00" } },
  { value: "night", label: "Night", fallback: { startTime: "17:00", endTime: "22:00" } },
  { value: "full_day", label: "Full day", fallback: { startTime: "10:00", endTime: "22:00" } },
];

export const shiftLabel = (value) => SHIFT_OPTIONS.find((s) => s.value === value)?.label ?? "Flexible";

export const formatDate = (date) =>
  date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const formatShortDate = (date) =>
  date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

// The venue and its dates are in Nepal. A date from the server is shown as the calendar day it is in
// Kathmandu, whatever time zone the visitor's device is set to; the result is a local-midnight Date
// that the formatters above and bsLabel can use directly.
export const serverDay = (value) => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(new Date(value))
    .reduce((acc, p) => ({ ...acc, [p.type]: Number(p.value) }), {});
  return new Date(parts.year, parts.month - 1, parts.day);
};

// "10:00" -> "10:00 am", "15:00" -> "3:00 pm"
const clock = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
export const formatHours = (startTime, endTime) => `${clock(startTime)} to ${clock(endTime)}`;

// Noon in Kathmandu (06:15 UTC) keeps the calendar date stable in Nepal and in UTC, and for visitors
// abroad whose device clock is in another time zone.
export const toInquiryDate = (date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 6, 15)).toISOString();

// An inquiry that has a booking is "booked", whatever its raw status says.
export const effectiveStatus = (inquiry) => (inquiry.booking ? "booked" : inquiry.status);
