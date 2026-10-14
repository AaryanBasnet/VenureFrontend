import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Month calendar (AD). Past dates and today are not selectable (the venue needs time to reply),
// and days the venue is already booked for are struck through.
// A BS (Bikram Sambat) toggle is planned and needs a date-conversion library.
export default function DatePicker({ value, onChange, onMonthChange, isUnavailable }) {
  const today = startOfDay(new Date());
  const [month, setMonth] = useState(() => new Date((value ?? today).getFullYear(), (value ?? today).getMonth(), 1));

  useEffect(() => {
    onMonthChange?.(month);
  }, [month, onMonthChange]);

  const first = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const canGoBack = new Date(month.getFullYear(), month.getMonth(), 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const move = (n) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <div className="w-full max-w-[460px] rounded-card-lg border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="rounded-full border border-line p-2 hover:border-ink disabled:opacity-30 disabled:hover:border-line"
        >
          <ChevronLeft className="size-4" />
        </button>
        <h3 className="font-display text-h4 font-light text-ink" aria-live="polite">
          {month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </h3>
        <button type="button" onClick={() => move(1)} aria-label="Next month" className="rounded-full border border-line p-2 hover:border-ink">
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
        {Array.from({ length: days }, (_, i) => {
          const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
          const taken = !!isUnavailable?.(date);
          const disabled = date <= today || taken;
          const selected = value && startOfDay(value).getTime() === date.getTime();
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              aria-pressed={!!selected}
              aria-label={`${date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${taken ? " (not available)" : ""}`}
              onClick={() => onChange(date)}
              className={`h-11 rounded-card-sm font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink ${
                selected
                  ? "bg-ink text-gold-50"
                  : disabled
                    ? `cursor-not-allowed text-stone ${taken ? "line-through" : ""}`
                    : "text-ink hover:bg-gold-100"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
