import NepaliDate from "nepali-date-converter";

// Bikram Sambat (the Nepali calendar) helpers. Dates stay normal JS dates everywhere in the app;
// BS is only used for showing them.
export const BS_MONTHS = ["Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];

// e.g. "3 Mangsir 2083 BS". Returns "" for dates outside the converter's supported range.
export function bsLabel(date) {
  if (!date) return "";
  try {
    const bs = new NepaliDate(new Date(date));
    return `${bs.getDate()} ${BS_MONTHS[bs.getMonth()]} ${bs.getYear()} BS`;
  } catch {
    return "";
  }
}
