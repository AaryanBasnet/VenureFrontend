import { useId } from "react";
import { Plus, Trash2 } from "lucide-react";
import { inputClass, labelClass } from "../ui/formStyles";
import { btnOutline } from "./ownerStyles";
import { emptyDrink, emptyPackage } from "./menuEditorUtils";

const MAX = 6;

function Field({ label, children, className = "" }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>{label}</label>
      {children(id)}
    </div>
  );
}

function Section({ title, hint, onAdd, canAdd, addLabel, children, count }) {
  return (
    <fieldset className="rounded-card-md border border-line p-4 sm:p-5">
      <legend className="px-2 font-display text-h5 font-light text-ink">{title}</legend>
      <p className="mb-4 font-body text-small text-taupe">{hint}</p>
      <div className="space-y-4">{children}</div>
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={onAdd} disabled={!canAdd} className={btnOutline}>
          <Plus aria-hidden="true" className="size-4" /> {addLabel}
        </button>
        {count >= MAX && <p className="font-body text-caption text-taupe">You can add up to {MAX}.</p>}
      </div>
    </fieldset>
  );
}

function RemoveButton({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 font-body text-small text-red-700 underline underline-offset-4 hover:text-red-700/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-50"
    >
      <Trash2 aria-hidden="true" className="size-4" /> {children}
    </button>
  );
}

// Venues in Nepal price per plate, by food package. Customers see these on the venue page.
export function PackagesEditor({ rows, onChange, disabled }) {
  const set = (i, patch) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <Section
      title="Food packages (optional)"
      hint="Price per plate. Customers choose one as a preference; your quotation sets the final price."
      onAdd={() => onChange([...rows, emptyPackage()])}
      canAdd={!disabled && rows.length < MAX}
      addLabel="Add a package"
      count={rows.length}
    >
      {rows.map((r, i) => (
        <div key={i} className="space-y-4 rounded-card-md bg-cream p-4">
          <p className="font-body text-eyebrow uppercase text-gold-800">Package {i + 1}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Package name">
              {(id) => <input id={id} className={inputClass} placeholder="e.g. Gold Package" value={r.name} onChange={(e) => set(i, { name: e.target.value })} disabled={disabled} />}
            </Field>
            <Field label="Tagline">
              {(id) => <input id={id} className={inputClass} placeholder="e.g. Classic Nepali celebration" maxLength={80} value={r.tagline} onChange={(e) => set(i, { tagline: e.target.value })} disabled={disabled} />}
            </Field>
            <Field label="Price per plate (NPR)">
              {(id) => <input id={id} className={inputClass} type="number" min="0" value={r.pricePerPlate} onChange={(e) => set(i, { pricePerPlate: e.target.value })} disabled={disabled} />}
            </Field>
            <Field label="Minimum plates">
              {(id) => <input id={id} className={inputClass} type="number" min="1" placeholder="1" value={r.minPlates} onChange={(e) => set(i, { minPlates: e.target.value })} disabled={disabled} />}
            </Field>
          </div>
          <Field label="Menu highlights (one per line, up to 8)">
            {(id) => <textarea id={id} className={`${inputClass} resize-none`} rows={3} value={r.highlightsText} onChange={(e) => set(i, { highlightsText: e.target.value })} disabled={disabled} />}
          </Field>
          <RemoveButton onClick={() => onChange(rows.filter((_, idx) => idx !== i))} disabled={disabled}>
            Remove this package
          </RemoveButton>
        </div>
      ))}
    </Section>
  );
}

export function DrinkOptionsEditor({ rows, onChange, disabled }) {
  const set = (i, patch) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <Section
      title="Drink options (optional)"
      hint="For example Soft drinks, Hard drinks, Breakfast beverages. Drinks are priced separately from food."
      onAdd={() => onChange([...rows, emptyDrink()])}
      canAdd={!disabled && rows.length < MAX}
      addLabel="Add a drink option"
      count={rows.length}
    >
      {rows.map((r, i) => (
        <div key={i} className="space-y-4 rounded-card-md bg-cream p-4">
          <p className="font-body text-eyebrow uppercase text-gold-800">Option {i + 1}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name">
              {(id) => <input id={id} className={inputClass} placeholder="e.g. Hard drinks" value={r.name} onChange={(e) => set(i, { name: e.target.value })} disabled={disabled} />}
            </Field>
            <Field label="Short description">
              {(id) => <input id={id} className={inputClass} maxLength={140} value={r.description} onChange={(e) => set(i, { description: e.target.value })} disabled={disabled} />}
            </Field>
          </div>
          <Field label="What is on offer (one per line, up to 12)">
            {(id) => <textarea id={id} className={`${inputClass} resize-none`} rows={3} value={r.itemsText} onChange={(e) => set(i, { itemsText: e.target.value })} disabled={disabled} />}
          </Field>
          <RemoveButton onClick={() => onChange(rows.filter((_, idx) => idx !== i))} disabled={disabled}>
            Remove this option
          </RemoveButton>
        </div>
      ))}
    </Section>
  );
}
