import NepaliDate from "nepali-date-converter";

// Bikram Sambat (the Nepali calendar) helpers. Dates stay normal JS dates everywhere in the app;
// BS is only used for showing them. A "date" here is a local-midnight Date that stands for a calendar day.
export const BS_MONTHS = ["Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];

// The converter covers 1 Baisakh 2000 BS to 30 Chaitra 2090 BS (14 April 1943 to about April 2034). Outside that it
// either throws or, for earlier dates, quietly returns a wrong answer, so every helper checks the range itself.
export const BS_MIN_YEAR = 2000;
export const BS_MAX_YEAR = 2090;

const dayOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

let range = null;
export function bsSupportedRange() {
  if (!range) {
    range = {
      min: dayOf(new NepaliDate(BS_MIN_YEAR, 0, 1).toJsDate()),
      max: dayOf(new NepaliDate(BS_MAX_YEAR, 11, 30).toJsDate()),
    };
  }
  return range;
}

export function isBsSupported(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  const { min, max } = bsSupportedRange();
  const day = dayOf(date);
  return day >= min && day <= max;
}

// { year, month (0 = Baisakh), day } for an English date, or null when the date is invalid or out of range.
export function adToBs(date) {
  if (!date) return null;
  const d = new Date(date);
  if (!isBsSupported(d)) return null;
  try {
    const bs = new NepaliDate(dayOf(d));
    return { year: bs.getYear(), month: bs.getMonth(), day: bs.getDate() };
  } catch {
    return null;
  }
}

// Number of days in a BS month (29 to 32), or null when it is out of range.
export function bsMonthLength(year, month) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) return null;
  if (year < BS_MIN_YEAR || year > BS_MAX_YEAR) return null;
  for (let day = 32; day >= 28; day--) {
    try {
      const probe = new NepaliDate(year, month, day);
      if (probe.getYear() === year && probe.getMonth() === month && probe.getDate() === day) return day;
    } catch {
      // beyond the converter's last day: try a shorter month
    }
  }
  return null;
}

// The English date (local midnight) of a BS date, or null for a day that does not exist or is out of range.
export function bsToAd(year, month, day) {
  const length = bsMonthLength(year, month);
  if (!length || !Number.isInteger(day) || day < 1 || day > length) return null;
  try {
    return dayOf(new NepaliDate(year, month, day).toJsDate());
  } catch {
    return null;
  }
}

// e.g. "3 Mangsir 2083 BS". Returns "" for dates outside the converter's supported range.
export function bsLabel(date) {
  const bs = adToBs(date);
  return bs ? `${bs.day} ${BS_MONTHS[bs.month]} ${bs.year} BS` : "";
}
