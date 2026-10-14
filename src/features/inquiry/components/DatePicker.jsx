import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NepaliDate from "nepali-date-converter";
import { BS_MONTHS, bsLabel } from "../bsCalendar";

const WEEKDAYS = [
  ["Sun", "Sunday"],
  ["Mon", "Monday"],
  ["Tue", "Tuesday"],
  ["Wed", "Wednesday"],
  ["Thu", "Thursday"],
  ["Fri", "Friday"],
  ["Sat", "Saturday"],
];
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_MONTHS_AHEAD = 24;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const longDate = (d) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// What one visible month looks like in each calendar: where it starts (as a normal Date),
// how many days it has, and what to print in the header.
const viewOf = (anchor, mode) => {
  if (mode === "AD") {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    return {
      start,
      days: new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate(),
      title: start.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
      prev: new Date(start.getFullYear(), start.getMonth() - 1, 1),
      next: new Date(start.getFullYear(), start.getMonth() + 1, 1),
    };
  }
  const bs = new NepaliDate(anchor);
  const y = bs.getYear();
  const m = bs.getMonth();
  const start = startOfDay(new NepaliDate(y, m, 1).toJsDate());
  const next = startOfDay((m === 11 ? new NepaliDate(y + 1, 0, 1) : new NepaliDate(y, m + 1, 1)).toJsDate());
  const prev = startOfDay((m === 0 ? new NepaliDate(y - 1, 11, 1) : new NepaliDate(y, m - 1, 1)).toJsDate());
  return { start, days: Math.round((next - start) / DAY_MS), title: `${BS_MONTHS[m]} ${y}`, prev, next };
};

// "Oct to Nov 2026": which English months a Nepali month covers.
const adSpan = (start, days) => {
  const end = addDays(start, days - 1);
  const m = (d) => d.toLocaleDateString("en-GB", { month: "short" });
  const same = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  return same ? `${m(start)} ${start.getFullYear()}` : `${m(start)} to ${m(end)} ${end.getFullYear()}`;
};

// Month calendar. Visitors can read it in AD or BS (Bikram Sambat). Today and past dates are not
// selectable (the venue needs time to reply), and days the venue is already booked are struck through.
// Keyboard: arrow keys move by day and week, Home/End jump to the start or end of the week,
// PageUp/PageDown change month, Enter or Space picks a day.
export default function DatePicker({ value, onChange, onMonthChange, isUnavailable, loading = false, invalid = false, describedBy }) {
  const uid = useId();
  const gridRef = useRef(null);
  const moveFocus = useRef(false);
  const todayTime = startOfDay(new Date()).getTime();
  const today = useMemo(() => new Date(todayTime), [todayTime]);
  const maxDate = useMemo(() => new Date(today.getFullYear(), today.getMonth() + MAX_MONTHS_AHEAD + 1, 0), [today]);
  const [mode, setMode] = useState("AD");
  const [anchor, setAnchor] = useState(() => value ?? today);
  const [focusTime, setFocusTime] = useState(null);

  const view = useMemo(() => viewOf(anchor, mode), [anchor, mode]);
  const thisMonth = useMemo(() => viewOf(today, mode).start.getTime(), [today, mode]);
  const startTime = view.start.getTime();

  useEffect(() => {
    onMonthChange?.(new Date(startTime));
  }, [startTime, onMonthChange]);

  const first = view.start.getDay();
  const canGoBack = startTime > thisMonth;
  const canGoForward = view.next.getTime() <= maxDate.getTime();

  // Which day is the single tab stop: the one last moved to, else the chosen day, else the first open day.
  const days = useMemo(() => Array.from({ length: view.days }, (_, i) => addDays(view.start, i)), [view]);
  const rovingTime = useMemo(() => {
    const inView = (t) => t != null && t >= startTime && t < startTime + view.days * DAY_MS + DAY_MS / 2;
    if (inView(focusTime)) return focusTime;
    if (value && inView(startOfDay(value).getTime())) return startOfDay(value).getTime();
    const open = days.find((d) => d > today && d <= maxDate);
    return (open ?? days[0]).getTime();
  }, [focusTime, value, startTime, view.days, days, today, maxDate]);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector(`button[data-t="${focusTime}"]`)?.focus();
  }, [focusTime, startTime]);

  const goTo = (target) => {
    // Never wander before this month or past the booking horizon.
    const lo = viewOf(today, mode).start;
    let t = target;
    if (t < lo) t = lo;
    if (t > maxDate) t = maxDate;
    t = startOfDay(t);
    moveFocus.current = true;
    setFocusTime(t.getTime());
    if (t < view.start || t >= view.next) setAnchor(t);
  };

  const onKeyDown = (e) => {
    const t = new Date(rovingTime);
    const dow = t.getDay();
    const step = {
      ArrowLeft: () => addDays(t, -1),
      ArrowRight: () => addDays(t, 1),
      ArrowUp: () => addDays(t, -7),
      ArrowDown: () => addDays(t, 7),
      Home: () => addDays(t, -dow),
      End: () => addDays(t, 6 - dow),
      PageUp: () => (mode === "AD" ? new Date(t.getFullYear(), t.getMonth() - 1, Math.min(t.getDate(), 28)) : view.prev),
      PageDown: () => (mode === "AD" ? new Date(t.getFullYear(), t.getMonth() + 1, Math.min(t.getDate(), 28)) : view.next),
    }[e.key];
    if (!step) return;
    e.preventDefault();
    goTo(step());
  };

  const reason = (date) => {
    if (date.getTime() === today.getTime()) return "today, requests need at least a day's notice";
    if (date < today) return "past date";
    if (date > maxDate) return "too far ahead";
    if (isUnavailable?.(date)) return "already booked";
    return "";
  };

  const cells = [...Array.from({ length: first }, () => null), ...days];
  while (cells.length % 7) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  const titleId = `${uid}-title`;
  const selectedTime = value ? startOfDay(value).getTime() : null;

  return (
    <div className="w-full max-w-[460px] rounded-card-lg border border-line bg-white p-5" aria-busy={loading}>
      <div role="group" aria-label="Calendar" className="mb-4 inline-flex rounded-full border border-line p-0.5">
        {["AD", "BS"].map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`min-h-11 rounded-full px-4 font-body text-caption uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink ${mode === m ? "bg-ink text-gold-50" : "text-taupe hover:text-ink"}`}
          >
            {m === "AD" ? "English (AD)" : "नेपाली (BS)"}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setAnchor(view.prev)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink disabled:opacity-30 disabled:hover:border-line"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
        </button>
        <div className="text-center">
          <h3 id={titleId} className="font-display text-h4 font-light text-ink" aria-live="polite">{view.title}</h3>
          {mode === "BS" && <p className="font-body text-caption text-taupe">{adSpan(view.start, view.days)}</p>}
        </div>
        <button
          type="button"
          onClick={() => setAnchor(view.next)}
          disabled={!canGoForward}
          aria-label="Next month"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink disabled:opacity-30 disabled:hover:border-line"
        >
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onKeyDown={onKeyDown}
        className="mt-4 space-y-1 text-center"
      >
        <div role="row" className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map(([short, long]) => (
            <span key={short} role="columnheader" aria-label={long} className="py-1 font-body text-eyebrow uppercase text-taupe">
              {short}
            </span>
          ))}
        </div>
        {weeks.map((week, w) => (
          <div role="row" key={w} className="grid grid-cols-7 gap-1">
            {week.map((date, c) => {
              if (!date) return <span key={`b${c}`} role="gridcell" aria-hidden="true" />;
              const why = reason(date);
              const taken = why === "already booked";
              const disabled = !!why;
              const time = date.getTime();
              const selected = selectedTime === time;
              const isToday = time === today.getTime();
              const dayNumber = mode === "AD" ? date.getDate() : Math.round((time - startTime) / DAY_MS) + 1;
              return (
                <span key={time} role="gridcell" aria-selected={selected}>
                  <button
                    type="button"
                    data-t={time}
                    tabIndex={time === rovingTime ? 0 : -1}
                    aria-disabled={disabled || undefined}
                    aria-label={`${mode === "BS" ? `${bsLabel(date)}, ` : ""}${longDate(date)}${disabled ? ` (${why})` : ""}`}
                    onClick={() => !disabled && onChange(date)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && disabled) e.preventDefault();
                    }}
                    className={`h-11 w-full rounded-card-sm font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink ${
                      selected
                        ? "bg-ink text-gold-50"
                        : taken
                          ? "cursor-not-allowed bg-sand text-taupe line-through decoration-taupe"
                          : disabled
                            ? "cursor-not-allowed text-taupe-light"
                            : "text-ink hover:bg-gold-100"
                    } ${isToday && !selected ? "ring-1 ring-inset ring-gold" : ""}`}
                  >
                    {dayNumber}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-caption text-taupe">
        <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-3 rounded-sm border border-line bg-white" />Available</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-3 rounded-sm border border-line bg-sand" />Booked</span>
        <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-3 rounded-sm bg-ink" />Your date</span>
        {loading && <span role="status" className="ml-auto text-gold-800">Checking availability…</span>}
      </div>
      <p className="mt-2 font-body text-caption text-taupe">
        Tomorrow is the earliest date you can ask for, so the venue has time to reply.
      </p>

      {value && (
        <p className="mt-4 border-t border-line pt-3 font-body text-small text-taupe">
          {longDate(startOfDay(value))}
          <span aria-hidden="true"> · </span>
          <span className="text-ink">{bsLabel(value)}</span>
        </p>
      )}
    </div>
  );
}
