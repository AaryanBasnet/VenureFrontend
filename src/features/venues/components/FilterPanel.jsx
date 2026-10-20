import { Search } from "lucide-react";
import { SPACE_TYPES, VENUE_TYPES } from "../venueTypes";
import { plural } from "../../../utils/plural";
import { useDebouncedField } from "../hooks/useDebouncedField";
import { AMENITIES, GUEST_PRESETS } from "../venueFilters";
import { priceFormatter } from "../venueFormat";
import PriceRange from "./PriceRange";

const legend = "mb-1 font-body text-eyebrow uppercase text-taupe";
const section = "min-w-0";
const row = "flex min-h-11 cursor-pointer items-center gap-3 font-body text-small text-ink has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-0 has-[:focus-visible]:outline-ink rounded-card-sm";
const radio = "size-[18px] shrink-0 cursor-pointer accent-ink";
const chip = (on) =>
  `min-h-11 rounded-full border px-4 py-2 font-body text-caption transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
    on ? "border-ink bg-ink text-gold-50" : "border-border-strong bg-paper-white text-ink hover:border-ink"
  }`;

// "Refine your search": every control writes straight to the URL (through `update`), so the results change as you go.
// `idPrefix` keeps ids unique because the panel is rendered once for desktop and once inside the mobile sheet.
export default function FilterPanel({ sheet = false, idPrefix, filters, update, counts, spaceCounts = {}, total, isCounting, activeCount, onClear, onShow }) {
  const [search, setSearch] = useDebouncedField(filters.q, (s) => s.trim(), (v) => update({ q: v }, { replace: true }));
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const customGuests = filters.guests && !GUEST_PRESETS.includes(Number(filters.guests)) ? filters.guests : "";
  const guestOptions = [
    { value: "", label: "Any capacity" },
    ...GUEST_PRESETS.map((n) => ({ value: String(n), label: `${n}+ guests` })),
    ...(customGuests ? [{ value: customGuests, label: `${priceFormatter.format(Number(customGuests))}+ guests` }] : []),
  ].sort((a, b) => (a.value === "" ? -1 : b.value === "" ? 1 : Number(a.value) - Number(b.value)));
  const toggleAmenity = (name) =>
    update({ amenities: (filters.amenities.includes(name) ? filters.amenities.filter((a) => a !== name) : [...filters.amenities, name]).join(",") });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-h4 font-normal text-ink">Refine your search</p>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className="min-h-11 px-1 font-body text-eyebrow uppercase text-gold-800 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ink">
            Reset
          </button>
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-search`} className="sr-only">Search by name</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-taupe" strokeWidth={1.5} />
          <input
            id={`${idPrefix}-search`}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by place or name"
            autoComplete="off"
            className="w-full min-w-0 rounded-card-sm border border-border bg-white py-3 pl-10 pr-3 font-body text-small text-charcoal placeholder:text-taupe focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          />
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <fieldset className={section}>
        <legend className={legend}>Venue type</legend>
        <label className={row}>
          <input type="radio" name={`${idPrefix}-category`} checked={!filters.category} onChange={() => update({ category: "" })} className={radio} />
          <span className="flex-1">All types</span>
          <span className="text-caption text-taupe">{allCount}</span>
        </label>
        {VENUE_TYPES.map(([slug, name]) => (
          <label key={slug} className={row}>
            <input type="radio" name={`${idPrefix}-category`} checked={filters.category === slug} onChange={() => update({ category: slug })} className={radio} />
            <span className="flex-1">{name}</span>
            <span className="text-caption text-taupe">{counts[slug] ?? 0}</span>
          </label>
        ))}
      </fieldset>
      </div>

      <div className="border-t border-line pt-5">
        <fieldset className={section}>
        <legend className={legend}>Kind of space</legend>
        <label className={row}>
          <input type="radio" name={`${idPrefix}-spaceType`} checked={!filters.spaceType} onChange={() => update({ spaceType: "" })} className={radio} />
          <span className="flex-1">Any space</span>
        </label>
        {SPACE_TYPES.map(([slug, name]) => (
          <label key={slug} className={row}>
            <input type="radio" name={`${idPrefix}-spaceType`} checked={filters.spaceType === slug} onChange={() => update({ spaceType: slug })} className={radio} />
            <span className="flex-1">{name}</span>
            <span className="text-caption text-taupe">{spaceCounts[slug] ?? 0}</span>
          </label>
        ))}
      </fieldset>
      </div>

      <div className="border-t border-line pt-5">
        <fieldset className={section}>
        <legend className={legend}>Guest capacity</legend>
        {guestOptions.map((o) => (
          <label key={o.value || "any"} className={row}>
            <input type="radio" name={`${idPrefix}-guests`} checked={filters.guests === o.value} onChange={() => update({ guests: o.value })} className={radio} />
            {o.label}
          </label>
        ))}
      </fieldset>
      </div>

      <div className="border-t border-line pt-5">
        <fieldset className={section}>
        <legend className={legend}>Price per plate</legend>
        <PriceRange idPrefix={idPrefix} min={filters.minPrice} max={filters.maxPrice} onCommit={(p) => update(p, { replace: true })} />
      </fieldset>
      </div>

      <div className="border-t border-line pt-5">
        <fieldset className={section}>
        <legend className={`${legend} mb-2`}>Amenities</legend>
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {AMENITIES.map((a) => (
            <button key={a} type="button" aria-pressed={filters.amenities.includes(a)} onClick={() => toggleAmenity(a)} className={chip(filters.amenities.includes(a))}>
              {a}
            </button>
          ))}
        </div>
      </fieldset>
      </div>

      <div className={sheet ? "sticky bottom-0 -mx-5 border-t border-line bg-cream px-5 pb-1 pt-3" : ""}>
        <button
          type="button"
          onClick={onShow}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-6 font-body text-button uppercase text-gold-50 transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {isCounting ? "Show venues" : `Show ${plural(total, "venue")}`}
        </button>
      </div>
    </div>
  );
}
