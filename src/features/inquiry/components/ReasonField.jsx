import { useId } from "react";

const MAX = 300;

// A short reason typed by a person: the venue says why it declines (required), the customer says why they cancel
// or turn a quotation down (optional). `quickPicks` are one tap answers that fill the box.
export default function ReasonField({ value, onChange, label, hint, required = false, quickPicks = [], disabled = false }) {
  const id = useId();
  return (
    <div className="mt-3">
      <label htmlFor={id} className="block font-body text-small font-medium text-ink">
        {label}
        {!required && <span className="ml-2 font-normal text-taupe">optional</span>}
      </label>
      {quickPicks.length > 0 && (
        <div role="group" aria-label="Common reasons" className="mt-2 flex flex-wrap gap-2">
          {quickPicks.map((pick) => (
            <button
              key={pick}
              type="button"
              onClick={() => onChange(pick)}
              disabled={disabled}
              aria-pressed={value === pick}
              className={`min-h-11 rounded-full border px-4 py-2 font-body text-caption transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                value === pick ? "border-ink bg-ink text-gold-50" : "border-border-strong bg-white text-ink hover:border-ink"
              }`}
            >
              {pick}
            </button>
          ))}
        </div>
      )}
      <textarea
        id={id}
        rows={3}
        maxLength={MAX}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        aria-describedby={`${id}-hint`}
        className="mt-2 w-full rounded-card-sm border border-border-strong bg-white px-4 py-3 font-body text-small text-ink placeholder:text-taupe focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      />
      <p id={`${id}-hint`} className="mt-1 font-body text-caption text-taupe">
        {hint} {value.length} of {MAX}.
      </p>
    </div>
  );
}
