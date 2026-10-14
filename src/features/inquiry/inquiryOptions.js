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

// Noon local time keeps the calendar date stable when serialised to UTC (Nepal is UTC+5:45).
export const toInquiryDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).toISOString();

// An inquiry that has a booking is "booked", whatever its raw status says.
export const effectiveStatus = (inquiry) => (inquiry.booking ? "booked" : inquiry.status);
