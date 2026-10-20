import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { bsLabel, bsLabelNe, nepaliNumber } from "../bsCalendar";
import {
  adSpan,
  dayNumber,
  dayStatus,
  focusTarget,
  isInView,
  lastBookableDay,
  monthGrid,
  monthNav,
  monthView,
  rovingDay,
  startOfDay,
  todayInKathmandu,
} from "../calendarMath";

const WEEKDAYS = [
  ["Sun", "Sunday"],
  ["Mon", "Monday"],
  ["Tue", "Tuesday"],
  ["Wed", "Wednesday"],
  ["Thu", "Thursday"],
  ["Fri", "Friday"],
  ["Sat", "Saturday"],
];
const longDate = (d) => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// Month calendar. Visitors can read it in AD or BS (Bikram Sambat). Today and past dates are not
// selectable (the venue needs time to reply), and days the venue is already booked are struck through.
// Keyboard: arrow keys move by day and week, Home/End jump to the start or end of the week,
// PageUp/PageDown change month, Enter or Space picks a day.
export default function DatePicker({ value, onChange, onMonthChange, isUnavailable, loading = false, invalid = false, describedBy }) {
  const uid = useId();
  const gridRef = useRef(null);
  const moveFocus = useRef(false);
  // "Today" is the day it is in Kathmandu, the same day the server counts the day of notice from
  const todayTime = todayInKathmandu().getTime();
  const today = useMemo(() => new Date(todayTime), [todayTime]);
  const maxDate = useMemo(() => lastBookableDay(today), [today]);
  const [mode, setMode] = useState("AD");
  const [anchor, setAnchor] = useState(() => value ?? today);
  const [focusTime, setFocusTime] = useState(null);

  const view = useMemo(() => monthView(anchor, mode), [anchor, mode]);
  const startTime = view.start.getTime();

  useEffect(() => {
    onMonthChange?.(new Date(startTime));
  }, [startTime, onMonthChange]);

  const { canGoBack, canGoForward } = monthNav(view, { today, maxDate });
  const { weeks } = monthGrid(view);
  const rovingTime = rovingDay({ focus: focusTime == null ? null : new Date(focusTime), value, view, today, maxDate }).getTime();

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    gridRef.current?.querySelector(`button[data-t="${focusTime}"]`)?.focus();
  }, [focusTime, startTime]);

  // Switching calendars keeps the chosen date on screen: if it is in the month being looked at, the new
  // calendar opens on the month that holds it (an English month and a Nepali month only partly overlap).
  const switchMode = (next) => {
    if (next === mode) return;
    if (value && isInView(view, startOfDay(value))) setAnchor(startOfDay(value));
    setMode(next);
  };

  const goTo = (target) => {
    moveFocus.current = true;
    setFocusTime(target.getTime());
    if (!isInView(view, target)) setAnchor(target);
  };

  const onKeyDown = (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const target = focusTarget(e.key, new Date(rovingTime), view, { today, maxDate });
    if (!target) return;
    e.preventDefault();
    goTo(target);
  };

  const reason = (date) => dayStatus(date, { today, maxDate, isUnavailable });

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
            onClick={() => switchMode(m)}
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
          <h3 id={titleId} className="font-display text-h4 font-light text-ink" aria-live="polite">{mode === "BS" ? view.titleNe : view.title}</h3>
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
              const label = mode === "BS" ? nepaliNumber(dayNumber(date, view)) : dayNumber(date, view);
              return (
                <span key={time} role="gridcell" aria-selected={selected}>
                  <button
                    type="button"
                    data-t={time}
                    tabIndex={time === rovingTime ? 0 : -1}
                    aria-disabled={disabled || undefined}
                    aria-label={`${mode === "BS" ? `${bsLabelNe(date)}, ` : ""}${longDate(date)}${disabled ? ` (${why})` : ""}`}
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
                    {label}
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
          <span className="text-ink">{mode === "BS" ? bsLabelNe(value) : bsLabel(value)}</span>
        </p>
      )}
    </div>
  );
}
