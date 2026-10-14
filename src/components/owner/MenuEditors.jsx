import { emptyDrink, emptyPackage } from "./menuEditorUtils";

const input = "w-full px-2 py-1.5 text-sm border rounded-md focus:ring-purple-500 focus:outline-none";
const label = "block text-xs font-medium text-gray-600 mb-1";
const MAX = 6;

function Section({ title, hint, onAdd, canAdd, addLabel, children }) {
  return (
    <fieldset className="rounded-md border border-gray-200 p-3">
      <legend className="px-1 text-xs font-semibold text-gray-700">{title}</legend>
      <p className="mb-3 text-xs text-gray-500">{hint}</p>
      <div className="space-y-3">{children}</div>
      <button type="button" onClick={onAdd} disabled={!canAdd} className="mt-3 text-xs font-medium text-purple-700 hover:underline disabled:text-gray-400 disabled:no-underline">
        + {addLabel}
      </button>
    </fieldset>
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
    >
      {rows.map((r, i) => (
        <div key={i} className="space-y-2 rounded-md bg-gray-50 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className={label}>Package name</label>
              <input className={input} placeholder="e.g. Gold Package" value={r.name} onChange={(e) => set(i, { name: e.target.value })} disabled={disabled} />
            </div>
            <div>
              <label className={label}>Tagline</label>
              <input className={input} placeholder="e.g. Classic Nepali celebration" maxLength={80} value={r.tagline} onChange={(e) => set(i, { tagline: e.target.value })} disabled={disabled} />
            </div>
            <div>
              <label className={label}>Price per plate (NPR)</label>
              <input className={input} type="number" min="0" value={r.pricePerPlate} onChange={(e) => set(i, { pricePerPlate: e.target.value })} disabled={disabled} />
            </div>
            <div>
              <label className={label}>Minimum plates</label>
              <input className={input} type="number" min="1" placeholder="1" value={r.minPlates} onChange={(e) => set(i, { minPlates: e.target.value })} disabled={disabled} />
            </div>
          </div>
          <div>
            <label className={label}>Menu highlights (one per line, up to 8)</label>
            <textarea className={`${input} resize-none`} rows={3} value={r.highlightsText} onChange={(e) => set(i, { highlightsText: e.target.value })} disabled={disabled} />
          </div>
          <button type="button" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} disabled={disabled} className="text-xs text-red-600 hover:underline">
            Remove this package
          </button>
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
    >
      {rows.map((r, i) => (
        <div key={i} className="space-y-2 rounded-md bg-gray-50 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <label className={label}>Name</label>
              <input className={input} placeholder="e.g. Hard drinks" value={r.name} onChange={(e) => set(i, { name: e.target.value })} disabled={disabled} />
            </div>
            <div>
              <label className={label}>Short description</label>
              <input className={input} maxLength={140} value={r.description} onChange={(e) => set(i, { description: e.target.value })} disabled={disabled} />
            </div>
          </div>
          <div>
            <label className={label}>What is on offer (one per line, up to 12)</label>
            <textarea className={`${input} resize-none`} rows={3} value={r.itemsText} onChange={(e) => set(i, { itemsText: e.target.value })} disabled={disabled} />
          </div>
          <button type="button" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} disabled={disabled} className="text-xs text-red-600 hover:underline">
            Remove this option
          </button>
        </div>
      ))}
    </Section>
  );
}
