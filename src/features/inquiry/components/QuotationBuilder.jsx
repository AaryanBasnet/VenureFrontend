import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { apiError, useCreateQuotation } from "../hooks/useInquiries";
import { SHIFT_OPTIONS } from "../inquiryOptions";
import { priceFormatter } from "../../venues/venueFormat";

const field = "w-full rounded-card-sm border border-border-strong bg-white px-3 py-2 font-body text-small text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink";
const lab = "mb-1 block font-body text-eyebrow uppercase text-taupe";
const npr = (n) => `NPR ${priceFormatter.format(Math.round(n))}`;

// Starting rows: the food package the customer asked for (if the message names one) and venue hire.
function initialItems(inquiry, venue) {
  const named = venue?.packages?.find((p) => inquiry.message?.includes(`Menu preference: ${p.name}`));
  return [
    { label: "Venue hire", unitPrice: "", quantity: 1, perGuest: false },
    ...(named ? [{ label: `${named.name} menu`, unitPrice: String(named.pricePerPlate), quantity: 1, perGuest: true }] : []),
  ];
}

// The owner's reply to an inquiry. Totals here are a preview; the server recomputes every amount.
export default function QuotationBuilder({ inquiry, venue, spaces, onSent }) {
  const create = useCreateQuotation();
  const fitting = spaces.filter((s) => s.capacity >= inquiry.numberOfGuests);
  const [spaceId, setSpaceId] = useState(inquiry.space?._id ?? fitting[0]?._id ?? "");
  const [shift, setShift] = useState(inquiry.preferredShift ?? "night");
  const [guests, setGuests] = useState(inquiry.numberOfGuests);
  const [items, setItems] = useState(() => initialItems(inquiry, venue));
  const [depositType, setDepositType] = useState("percentage");
  const [depositValue, setDepositValue] = useState(20);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const total = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 1) * (i.perGuest ? Number(guests) || 0 : 1), 0),
    [items, guests]
  );
  const deposit = depositType === "percentage" ? Math.round(total * (Number(depositValue) / 100)) : Number(depositValue) || 0;
  const setItem = (i, patch) => setItems((list) => list.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const submit = async (e) => {
    e.preventDefault();
    const space = spaces.find((s) => s._id === spaceId);
    const clean = items.filter((i) => i.label.trim());
    if (!space) return setError("Choose the space you are quoting.");
    if (Number(guests) > space.capacity) return setError(`${space.name} holds up to ${space.capacity} guests.`);
    if (clean.length === 0) return setError("Add at least one line item.");
    if (clean.some((i) => i.unitPrice === "" || Number(i.unitPrice) < 0)) return setError("Give every line item a price (0 or more).");
    if (total <= 0) return setError("The total must be more than zero.");
    if (depositType === "percentage" && (depositValue < 10 || depositValue > 50)) return setError("A percentage deposit must be between 10% and 50%.");
    if (depositType === "fixed" && (deposit <= 0 || deposit >= total)) return setError("A fixed deposit must be more than 0 and less than the total.");
    setError("");

    try {
      await create.mutateAsync({
        inquiryId: inquiry._id,
        space: spaceId,
        eventDate: inquiry.preferredDate,
        shift,
        numberOfGuests: Number(guests),
        lineItems: clean.map((i) => ({ label: i.label.trim(), unitPrice: Number(i.unitPrice), quantity: Number(i.quantity) || 1, perGuest: i.perGuest })),
        depositType,
        depositValue: Number(depositValue),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      onSent();
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6 rounded-card-lg border border-line bg-white p-6">
      <div>
        <h2 className="font-display text-h4 font-light text-ink">{inquiry.currentQuotation ? "Send a new quotation" : "Reply with a quotation"}</h2>
        <p className="mt-1 font-body text-caption text-taupe">The customer has 7 days to accept. A new quotation replaces the one before it.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="q-space" className={lab}>Space</label>
          <select id="q-space" value={spaceId} onChange={(e) => setSpaceId(e.target.value)} className={field}>
            <option value="">Choose a space</option>
            {spaces.map((s) => <option key={s._id} value={s._id}>{s.name} (up to {s.capacity})</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="q-shift" className={lab}>Shift</label>
          <select id="q-shift" value={shift} onChange={(e) => setShift(e.target.value)} className={field}>
            {SHIFT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="q-guests" className={lab}>Guests</label>
          <input id="q-guests" type="number" min="1" value={guests} onChange={(e) => setGuests(e.target.value)} className={field} />
        </div>
      </div>

      <fieldset>
        <legend className={lab}>Line items</legend>
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[1fr_110px_70px_auto_auto] items-end gap-2">
              <div>
                <label className="sr-only" htmlFor={`li-label-${i}`}>Item {i + 1} name</label>
                <input id={`li-label-${i}`} placeholder="e.g. Gold package menu" value={it.label} onChange={(e) => setItem(i, { label: e.target.value })} className={field} />
              </div>
              <div>
                <label className="sr-only" htmlFor={`li-price-${i}`}>Item {i + 1} price in NPR</label>
                <input id={`li-price-${i}`} type="number" min="0" placeholder="NPR" value={it.unitPrice} onChange={(e) => setItem(i, { unitPrice: e.target.value })} className={field} />
              </div>
              <div>
                <label className="sr-only" htmlFor={`li-qty-${i}`}>Item {i + 1} quantity</label>
                <input id={`li-qty-${i}`} type="number" min="1" value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} className={field} />
              </div>
              <label className="flex items-center gap-1.5 pb-2 font-body text-caption text-ink">
                <input type="checkbox" checked={it.perGuest} onChange={(e) => setItem(i, { perGuest: e.target.checked })} className="accent-ink" /> per plate
              </label>
              <button type="button" aria-label={`Remove item ${i + 1}`} onClick={() => setItems((l) => l.filter((_, idx) => idx !== i))} className="mb-1 rounded-full p-2 text-taupe hover:bg-sand hover:text-ink">
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setItems((l) => [...l, { label: "", unitPrice: "", quantity: 1, perGuest: false }])} className="mt-3 inline-flex items-center gap-1.5 font-body text-small text-gold-800 hover:text-ink">
          <Plus aria-hidden="true" className="size-4" /> Add a line item
        </button>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1.3fr]">
        <div>
          <label htmlFor="q-dtype" className={lab}>Deposit type</label>
          <select id="q-dtype" value={depositType} onChange={(e) => { setDepositType(e.target.value); setDepositValue(e.target.value === "percentage" ? 20 : ""); }} className={field}>
            <option value="percentage">Percentage of total</option>
            <option value="fixed">Fixed amount (NPR)</option>
          </select>
        </div>
        <div>
          <label htmlFor="q-dval" className={lab}>{depositType === "percentage" ? "Deposit % (10 to 50)" : "Deposit (NPR)"}</label>
          <input id="q-dval" type="number" min="0" value={depositValue} onChange={(e) => setDepositValue(e.target.value)} className={field} />
        </div>
        <div className="whitespace-nowrap rounded-card-sm bg-sand p-3 font-body text-small text-ink">
          <p>Total <b>{npr(total)}</b></p>
          <p className="text-gold-800">Deposit now {npr(deposit)}</p>
          <p className="text-taupe">Balance later {npr(Math.max(total - deposit, 0))}</p>
        </div>
      </div>

      <div>
        <label htmlFor="q-notes" className={lab}>Notes for the customer (optional)</label>
        <textarea id="q-notes" rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What is included, timings, cancellation terms" className={field} />
      </div>

      <p role="alert" className="min-h-5 font-body text-small text-red-700">{error}</p>
      <button type="submit" disabled={create.isPending} className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800 disabled:opacity-60">
        {create.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />} Send quotation
      </button>
    </form>
  );
}
