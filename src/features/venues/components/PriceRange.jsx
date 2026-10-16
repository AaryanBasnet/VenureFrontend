import { useEffect, useState } from "react";
import { digitsOnly } from "../hooks/useDebouncedField";
import { PRICE_MAX, PRICE_STEP } from "../venueFilters";

const thumb =
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-cream [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-cream [&::-moz-range-thumb]:bg-ink " +
  "focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-ink focus-visible:[&::-webkit-slider-thumb]:ring-offset-2 focus-visible:[&::-webkit-slider-thumb]:ring-offset-cream " +
  "focus-visible:[&::-moz-range-thumb]:outline-2 focus-visible:[&::-moz-range-thumb]:outline-offset-2 focus-visible:[&::-moz-range-thumb]:outline-ink";
const rangeInput = `pointer-events-none absolute inset-x-0 top-0 h-11 w-full appearance-none bg-transparent outline-none ${thumb}`;
const numberBox =
  "w-full min-w-0 rounded-card-sm border border-border bg-white px-3 py-2.5 font-body text-small text-charcoal placeholder:text-taupe focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const toNumber = (text, fallback) => (text === "" ? fallback : Math.min(Number(text), PRICE_MAX));

// Price per plate, in NPR: a two-handle slider (two labelled range inputs) with min and max boxes.
// Changes wait a moment before they reach the URL, so dragging does not fire a request per step.
export default function PriceRange({ idPrefix, min, max, onCommit }) {
  const [minText, setMinText] = useState(min);
  const [maxText, setMaxText] = useState(max);
  useEffect(() => setMinText(min), [min]);
  useEffect(() => setMaxText(max), [max]);

  useEffect(() => {
    if (minText === min && maxText === max) return undefined;
    const t = setTimeout(() => {
      let lo = minText;
      let hi = maxText;
      if (lo && hi && Number(lo) > Number(hi)) [lo, hi] = [hi, lo];
      onCommit({ minPrice: lo, maxPrice: hi });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minText, maxText]);

  const lo = toNumber(minText, 0);
  const hi = toNumber(maxText, PRICE_MAX);
  const pct = (n) => `${(Math.min(n, PRICE_MAX) / PRICE_MAX) * 100}%`;

  return (
    <div>
      <div className="relative h-11" >
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" />
        <div aria-hidden="true" className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink" style={{ left: pct(lo), right: `calc(100% - ${pct(hi)})` }} />
        <input
          type="range"
          aria-label="Minimum price per plate in NPR"
          min={0}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={Math.min(lo, hi)}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), hi);
            setMinText(v > 0 ? String(v) : "");
          }}
          className={rangeInput}
          style={{ zIndex: lo > PRICE_MAX / 2 ? 3 : 2 }}
        />
        <input
          type="range"
          aria-label="Maximum price per plate in NPR"
          min={0}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={Math.max(lo, hi)}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), lo);
            setMaxText(v < PRICE_MAX ? String(v) : "");
          }}
          className={rangeInput}
          style={{ zIndex: 2 }}
        />
      </div>
      <div className="mt-1 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${idPrefix}-min`} className="sr-only">Minimum price per plate (NPR)</label>
          <input id={`${idPrefix}-min`} type="text" inputMode="numeric" maxLength={7} value={minText} onChange={(e) => setMinText(digitsOnly(e.target.value))} placeholder="NPR min" autoComplete="off" className={numberBox} />
        </div>
        <span aria-hidden="true" className="text-taupe">–</span>
        <div className="min-w-0 flex-1">
          <label htmlFor={`${idPrefix}-max`} className="sr-only">Maximum price per plate (NPR)</label>
          <input id={`${idPrefix}-max`} type="text" inputMode="numeric" maxLength={7} value={maxText} onChange={(e) => setMaxText(digitsOnly(e.target.value))} placeholder="NPR max" autoComplete="off" className={numberBox} />
        </div>
      </div>
    </div>
  );
}
