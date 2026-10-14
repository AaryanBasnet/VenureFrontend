import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import NepaliDate from "nepali-date-converter";
import { BS_MONTHS, bsLabel } from "../bsCalendar";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

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

// Month calendar. Visitors can read it in AD or BS (Bikram Sambat). Past dates and today are not
// selectable (the venue needs time to reply), and days the venue is already booked are struck through.
export default function DatePicker({ value, onChange, onMonthChange, isUnavailable }) {
  const todayTime = startOfDay(new Date()).getTime();
  const today = useMemo(() => new Date(todayTime), [todayTime]);
  const [mode, setMode] = useState("AD");
  const [anchor, setAnchor] = useState(() => value ?? today);

  const view = useMemo(() => viewOf(anchor, mode), [anchor, mode]);
  const thisMonth = useMemo(() => viewOf(today, mode).start.getTime(), [today, mode]);
  const startTime = view.start.getTime();

  useEffect(() => {
    onMonthChange?.(new Date(startTime));
  }, [startTime, onMonthChange]);

  const first = view.start.getDay();
  const canGoBack = startTime > thisMonth;
  const dayDate = (i) => new Date(view.start.getFullYear(), view.start.getMonth(), view.start.getDate() + i);

  return (
    <div className="w-full max-w-[460px] rounded-card-lg border border-line bg-white p-5">
      <div role="group" aria-label="Calendar" className="mb-4 inline-flex rounded-full border border-line p-0.5">
        {["AD", "BS"].map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-full px-4 py-1 font-body text-caption uppercase tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink ${mode === m ? "bg-ink text-gold-50" : "text-taupe hover:text-ink"}`}
          >
            {m === "AD" ? "English (AD)" : "नेपाली (BS)"}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setAnchor(view.prev)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="rounded-full border border-line p-2 hover:border-ink disabled:opacity-30 disabled:hover:border-line"
        >
          <ChevronLeft className="size-4" />
        </button>
        <h3 className="font-display text-h4 font-light text-ink" aria-live="polite">{view.title}</h3>
        <button type="button" onClick={() => setAnchor(view.next)} aria-label="Next month" className="rounded-full border border-line p-2 hover:border-ink">
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1 font-body text-eyebrow uppercase text-taupe">
            {d}
          </span>
        ))}
        {Array.from({ length: first }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: view.days }, (_, i) => {
          const date = dayDate(i);
          const taken = !!isUnavailable?.(date);
          const disabled = date <= today || taken;
          const selected = value && startOfDay(value).getTime() === date.getTime();
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              aria-pressed={!!selected}
              aria-label={`${mode === "BS" ? `${bsLabel(date)}, ` : ""}${date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${taken ? " (not available)" : ""}`}
              onClick={() => onChange(date)}
              className={`h-11 rounded-card-sm font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink ${
                selected
                  ? "bg-ink text-gold-50"
                  : disabled
                    ? `cursor-not-allowed text-stone ${taken ? "line-through" : ""}`
                    : "text-ink hover:bg-gold-100"
              }`}
            >
              {mode === "AD" ? date.getDate() : i + 1}
            </button>
          );
        })}
      </div>

      {value && (
        <p className="mt-4 border-t border-line pt-3 font-body text-small text-taupe">
          {startOfDay(value).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          <span aria-hidden="true"> · </span>
          <span className="text-ink">{bsLabel(value)}</span>
        </p>
      )}
    </div>
  );
}
