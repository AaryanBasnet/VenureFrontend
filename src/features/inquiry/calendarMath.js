// The date maths behind the date picker, with no React and no DOM so it can be tested on its own.
// Every date here is a local-midnight Date standing for a calendar day (the same day for the visitor and for
// the venue: the picker never turns a clicked day into a different one). "Today" is the day it is in Kathmandu.
import NepaliDate from "nepali-date-converter";
import { BS_MAX_YEAR, BS_MIN_YEAR, BS_MONTHS, adToBs, bsMonthLength, bsSupportedRange } from "./bsCalendar";
import { serverDay } from "./inquiryOptions";

export const DAY_MS = 24 * 60 * 60 * 1000;
export const MAX_MONTHS_AHEAD = 24;

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
export const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Today for the venue: the calendar day it is in Kathmandu right now, whatever zone the visitor's device is in.
export const todayInKathmandu = (now = new Date()) => serverDay(now);

// The booking window. A request needs a day's notice, so tomorrow is the earliest; the last day is the end of the
// month MAX_MONTHS_AHEAD months from this one (the server enforces the same limits).
export const earliestBookableDay = (today) => addDays(today, 1);
export const lastBookableDay = (today) => new Date(today.getFullYear(), today.getMonth() + MAX_MONTHS_AHEAD + 1, 0);

const clampToBsRange = (date) => {
  const { min, max } = bsSupportedRange();
  if (date < min) return min;
  if (date > max) return max;
  return date;
};

// What one visible month looks like in each calendar: where it starts (as a normal Date),
// how many days it has, and what to print in the header.
export function monthView(anchor, mode) {
  if (mode === "AD") {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    return {
      mode,
      start,
      days: daysInMonth(start.getFullYear(), start.getMonth()),
      title: start.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      prev: new Date(start.getFullYear(), start.getMonth() - 1, 1),
      next: new Date(start.getFullYear(), start.getMonth() + 1, 1),
    };
  }
  // BS: outside the converter's range the view stays on its first or last month instead of failing
  const bs = adToBs(clampToBsRange(startOfDay(anchor)));
  const { year: y, month: m } = bs;
  const first = (year, month) => startOfDay(new NepaliDate(year, month, 1).toJsDate());
  const start = first(y, m);
  const days = bsMonthLength(y, m);
  // The converter's first and last months have no neighbour on one side: the view just stays where it is
  const next = m === 11 ? (y >= BS_MAX_YEAR ? addDays(start, days) : first(y + 1, 0)) : first(y, m + 1);
  const prev = m === 0 ? (y <= BS_MIN_YEAR ? start : first(y - 1, 11)) : first(y, m - 1);
  return { mode, start, days, title: `${BS_MONTHS[m]} ${y}`, prev, next, bsYear: y, bsMonth: m };
}

// "Oct to Nov 2026": which English months a Nepali month covers.
export function adSpan(start, days) {
  const end = addDays(start, days - 1);
  const m = (d) => d.toLocaleDateString("en-GB", { month: "short" });
  const same = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  return same ? `${m(start)} ${start.getFullYear()}` : `${m(start)} to ${m(end)} ${end.getFullYear()}`;
}

export const monthDays = (view) => Array.from({ length: view.days }, (_, i) => addDays(view.start, i));

// The grid of weeks (Sunday first) with null for the blank cells before the first day and after the last.
export function monthGrid(view) {
  const leading = view.start.getDay();
  const cells = [...Array.from({ length: leading }, () => null), ...monthDays(view)];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  return { leading, weeks };
}

// The number printed on a day: the English date, or the BS day of the month.
export const dayNumber = (date, view) => (view.mode === "AD" ? date.getDate() : Math.round((startOfDay(date) - view.start) / DAY_MS) + 1);

export const isInView = (view, date) => date >= view.start && date < view.next;

// Why a day cannot be picked, or "" when it can.
export function dayStatus(date, { today, maxDate, isUnavailable }) {
  if (sameDay(date, today)) return "today, requests need at least a day's notice";
  if (date < today) return "past date";
  if (date > maxDate) return "too far ahead";
  if (isUnavailable?.(date)) return "already booked";
  return "";
}

export const clampDate = (date, lo, hi) => (date < lo ? lo : date > hi ? hi : date);

// Can the visitor step to the previous / next month? Not before this month, not past the last bookable day.
export function monthNav(view, { today, maxDate }) {
  const thisMonth = monthView(today, view.mode).start;
  return { canGoBack: view.start > thisMonth, canGoForward: view.next <= maxDate };
}

// Same day number in another month, shortened to that month's length (31 Jan + 1 month = 28 or 29 Feb).
function shiftMonth(current, view, direction) {
  if (view.mode === "AD") {
    const year = current.getFullYear();
    const month = current.getMonth() + direction;
    const length = daysInMonth(year, month);
    return new Date(year, month, Math.min(current.getDate(), length));
  }
  const bs = adToBs(current);
  const target = direction < 0 ? view.prev : view.next;
  const targetBs = adToBs(target);
  if (!bs || !targetBs) return target;
  const length = bsMonthLength(targetBs.year, targetBs.month) ?? 29;
  return addDays(target, Math.min(bs.day, length) - 1);
}

// Where a key press moves the focused day (before limits are applied), or null for a key the grid ignores.
//   arrows: a day or a week; Home/End: start/end of the week (Sunday to Saturday);
//   PageUp/PageDown: the same day in the previous/next month.
export function keyTarget(key, current, view) {
  const dow = current.getDay();
  switch (key) {
    case "ArrowLeft": return addDays(current, -1);
    case "ArrowRight": return addDays(current, 1);
    case "ArrowUp": return addDays(current, -7);
    case "ArrowDown": return addDays(current, 7);
    case "Home": return addDays(current, -dow);
    case "End": return addDays(current, 6 - dow);
    case "PageUp": return shiftMonth(current, view, -1);
    case "PageDown": return shiftMonth(current, view, 1);
    default: return null;
  }
}

// keyTarget kept inside the bookable window: focus never leaves [tomorrow, last bookable day].
export function focusTarget(key, current, view, { today, maxDate }) {
  const target = keyTarget(key, current, view);
  return target ? startOfDay(clampDate(target, earliestBookableDay(today), maxDate)) : null;
}

// The one day that is the tab stop of the grid: where focus last moved to, else the chosen day, else the first open day.
export function rovingDay({ focus, value, view, today, maxDate }) {
  if (focus && isInView(view, focus)) return focus;
  if (value && isInView(view, startOfDay(value))) return startOfDay(value);
  const lo = earliestBookableDay(today);
  const open = monthDays(view).find((d) => d >= lo && d <= maxDate);
  return open ?? view.start;
}
