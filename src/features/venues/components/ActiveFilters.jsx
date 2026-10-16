import { X } from "lucide-react";

// One removable chip per active filter. The tap target is 44px tall; the visible pill is smaller.
export default function ActiveFilters({ chips, onRemove, onClear }) {
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-1">
      <span className="mr-2 font-body text-eyebrow uppercase text-taupe">Active</span>
      <ul className="contents">
        {chips.map((c) => (
          <li key={c.key}>
            <button
              type="button"
              onClick={() => onRemove(c.clear)}
              aria-label={`Remove filter: ${c.label}`}
              className="group inline-flex min-h-11 items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ink"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-cream px-3 py-1.5 font-body text-caption text-ink transition-colors group-hover:border-ink">
                {c.label}
                <X aria-hidden="true" className="size-3 text-taupe" strokeWidth={2} />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClear}
        className="min-h-11 px-2 font-body text-caption text-gold-800 underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ink"
      >
        Clear all filters
      </button>
    </div>
  );
}
