import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { apiError, useCreateQuotation } from "../hooks/useInquiries";
import { SHIFT_OPTIONS } from "../inquiryOptions";
import { btnPrimary, npr } from "../../../components/dashboard/styles";
import Select from "../../../components/ui/Select";
import { plural } from "../../../utils/plural";

const field =
  "w-full rounded-card-sm border border-border-strong bg-paper-white px-3 py-2.5 font-body text-small text-ink placeholder:text-taupe focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink";
const lab = "mb-1.5 block font-body text-eyebrow uppercase text-taupe";
const seg = (on) =>
  `rounded-full border px-4 py-2 font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
    on ? "border-ink bg-ink text-gold-50" : "border-line bg-white text-ink hover:border-ink"
  }`;

const blankItem = (patch = {}) => ({ label: "", unitPrice: "", quantity: 1, perGuest: false, ...patch });

// Starting rows: venue hire, and the food package the customer asked for (if the message names one).
function initialItems(inquiry, venue) {
  const named = venue?.packages?.find((p) => inquiry.message?.includes(`Menu preference: ${p.name}`));
  return [
    blankItem({ label: "Venue hire" }),
    ...(named ? [blankItem({ label: `${named.name} menu`, unitPrice: String(named.pricePerPlate), perGuest: true })] : []),
  ];
}

const QUICK_ADD = [
  { text: "Food per plate", item: { label: "Food", perGuest: true } },
  { text: "Decoration", item: { label: "Decoration" } },
  { text: "Sound and lights", item: { label: "Sound and lights" } },
];

// Same maths as the server: quantity x unit price, times the guest count when charged per guest.
const lineAmount = (i, guests) => (Number(i.unitPrice) || 0) * (Number(i.quantity) || 1) * (i.perGuest ? Number(guests) || 0 : 1);

// The sum in words, so the owner can see how the amount comes about.
function lineExplanation(i, guests) {
  const price = Number(i.unitPrice) || 0;
  if (i.perGuest) return `${npr(price)} x ${plural(Number(guests) || 0, "guest")}`;
  const qty = Number(i.quantity) || 1;
  return qty > 1 ? `${npr(price)} x ${qty}` : "Charged once";
}

// "Per guest" / "Fixed price" choice: a real radio hidden behind a pill, so the keyboard works.
const chargeChoice =
  "cursor-pointer rounded-full border border-line bg-white px-4 py-2 font-body text-small text-ink transition-colors hover:border-ink " +
  "has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-gold-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink";

// The owner's reply to an inquiry. Totals here are a preview; the server recomputes every amount.
export default function QuotationBuilder({ inquiry, venue, spaces, onSent }) {
  const create = useCreateQuotation();
  const fitting = spaces.filter((s) => s.capacity >= inquiry.numberOfGuests);
  const [spaceId, setSpaceId] = useState(inquiry.space?._id ?? fitting[0]?._id ?? "");
  const [shift, setShift] = useState(inquiry.preferredShift ?? "night");
  const guests = inquiry.numberOfGuests; // the customer's number; the venue cannot change it
  const [items, setItems] = useState(() => initialItems(inquiry, venue));
  const [depositType, setDepositType] = useState("percentage");
  const [depositValue, setDepositValue] = useState(20);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const noSpaces = spaces.length === 0;

  const total = useMemo(() => items.reduce((sum, i) => sum + lineAmount(i, guests), 0), [items, guests]);
  const deposit = depositType === "percentage" ? Math.round(total * (Number(depositValue) / 100)) : Number(depositValue) || 0;
  const setItem = (i, patch) => setItems((list) => list.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const chooseDepositType = (type) => {
    if (type === depositType) return;
    setDepositType(type);
    setDepositValue(type === "percentage" ? 20 : "");
  };

  const submit = async (e) => {
    e.preventDefault();
    const space = spaces.find((s) => s._id === spaceId);
    const clean = items.filter((i) => i.label.trim());
    if (!space) return setError("Choose the space you are quoting.");
    if (Number(guests) > space.capacity) return setError(`${space.name} holds up to ${plural(space.capacity, "guest")}.`);
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
    <form onSubmit={submit} noValidate className="rounded-card-lg border border-line bg-white">
      <div className="border-b border-line px-6 py-4">
        <h2 className="font-display text-h4 font-light text-ink">{inquiry.currentQuotation ? "Send a new quotation" : "Reply with a quotation"}</h2>
        <p className="mt-0.5 font-body text-caption text-taupe">The customer has 7 days to accept. A new quotation replaces the one before it.</p>
      </div>

      <div className="space-y-8 p-6">
        {noSpaces && (
          <div role="alert" className="rounded-card-md border border-gold-200 bg-gold-50 p-4 font-body text-small text-ink">
            <p className="font-medium">Add a hall or space to this venue first.</p>
            <p className="mt-1 text-taupe">A quotation is for a specific space, and this venue has none yet.</p>
            <Link to="/owner/venues" className="mt-3 inline-flex min-h-11 items-center rounded-full border border-ink px-5 font-medium text-ink hover:bg-ink hover:text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              Go to my venues
            </Link>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="q-space" className={lab}>Space</label>
            <Select id="q-space" value={spaceId} onChange={(e) => setSpaceId(e.target.value)} className={field}>
              <option value="">Choose a space</option>
              {spaces.map((s) => <option key={s._id} value={s._id}>{s.name} (up to {s.capacity})</option>)}
            </Select>
          </div>
          <div>
            <label htmlFor="q-shift" className={lab}>Shift</label>
            <Select id="q-shift" value={shift} onChange={(e) => setShift(e.target.value)} className={field}>
              {SHIFT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
          </div>
          <div>
            <label htmlFor="q-guests" className={lab}>Guests</label>
            <input id="q-guests" type="number" value={guests} readOnly aria-readonly="true" aria-describedby="q-guests-hint" className={`${field} cursor-not-allowed bg-sand`} />
            <p id="q-guests-hint" className="mt-1 font-body text-caption text-taupe">The customer's number. It cannot be changed here.</p>
          </div>
        </div>

        <fieldset>
          <legend className="font-display text-h5 font-light text-ink">What you are charging</legend>
          <p className="mt-0.5 font-body text-caption text-taupe">Food is usually charged per guest. Hire and decoration are usually a fixed price.</p>

          <ul className="mt-4 space-y-3">
            {items.map((it, i) => (
              <li key={i} className="rounded-card-md border border-line bg-cream p-4">
                <div className="flex items-end gap-3">
                  <div className="min-w-0 flex-1">
                    <label htmlFor={`li-label-${i}`} className={lab}>Item {i + 1}</label>
                    <input id={`li-label-${i}`} placeholder="e.g. Dinner, Venue hire, Decoration" value={it.label} onChange={(e) => setItem(i, { label: e.target.value })} className={field} />
                  </div>
                  <p className="hidden shrink-0 pb-1 text-right font-body text-small text-ink sm:block">
                    <span className="block text-caption text-taupe">{lineExplanation(it, guests)}</span>
                    <span className="font-medium">{npr(lineAmount(it, guests))}</span>
                  </p>
                  <button
                    type="button"
                    aria-label={`Remove item ${i + 1}`}
                    onClick={() => setItems((l) => l.filter((_, idx) => idx !== i))}
                    className="mb-0.5 rounded-full p-2.5 text-taupe hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-3">
                  <fieldset>
                    <legend className={lab}>Charged</legend>
                    <div className="flex gap-2">
                      <label htmlFor={`li-guest-${i}`} className={chargeChoice}>
                        <input id={`li-guest-${i}`} type="radio" name={`li-charge-${i}`} checked={it.perGuest} onChange={() => setItem(i, { perGuest: true, quantity: 1 })} className="sr-only" />
                        Per guest
                      </label>
                      <label htmlFor={`li-fixed-${i}`} className={chargeChoice}>
                        <input id={`li-fixed-${i}`} type="radio" name={`li-charge-${i}`} checked={!it.perGuest} onChange={() => setItem(i, { perGuest: false })} className="sr-only" />
                        Fixed price
                      </label>
                    </div>
                  </fieldset>

                  <div className="w-40">
                    <label htmlFor={`li-price-${i}`} className={lab}>{it.perGuest ? "Price per plate (NPR)" : "Price (NPR)"}</label>
                    <input id={`li-price-${i}`} type="number" inputMode="numeric" min="0" placeholder="0" value={it.unitPrice} onChange={(e) => setItem(i, { unitPrice: e.target.value })} className={field} />
                  </div>

                  {!it.perGuest && (
                    <div className="w-24">
                      <label htmlFor={`li-qty-${i}`} className={lab}>How many</label>
                      <input id={`li-qty-${i}`} type="number" inputMode="numeric" min="1" value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} className={field} />
                    </div>
                  )}

                  <p className="ml-auto pb-2.5 text-right font-body text-small text-ink sm:hidden">
                    <span className="block text-caption text-taupe">{lineExplanation(it, guests)}</span>
                    <span className="font-medium">{npr(lineAmount(it, guests))}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setItems((l) => [...l, blankItem()])} className="inline-flex items-center gap-1.5 rounded-full border border-border-strong px-4 py-2 font-body text-small text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              <Plus aria-hidden="true" className="size-4" /> Add a line item
            </button>
            {QUICK_ADD.map((q) => (
              <button key={q.text} type="button" onClick={() => setItems((l) => [...l, blankItem(q.item)])} className="rounded-full px-3 py-2 font-body text-small text-gold-800 underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink">
                + {q.text}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="font-display text-h5 font-light text-ink">Deposit</legend>
          <p className="mt-0.5 font-body text-caption text-taupe">What the customer pays online to confirm the date. You collect the balance directly.</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div>
              <div role="group" aria-label="Deposit type" className="flex flex-wrap gap-2">
                <button type="button" aria-pressed={depositType === "percentage"} onClick={() => chooseDepositType("percentage")} className={seg(depositType === "percentage")}>Percentage of total</button>
                <button type="button" aria-pressed={depositType === "fixed"} onClick={() => chooseDepositType("fixed")} className={seg(depositType === "fixed")}>Fixed amount</button>
              </div>
              <div className="mt-4 max-w-[220px]">
                <label htmlFor="q-dval" className={lab}>{depositType === "percentage" ? "Deposit % (10 to 50)" : "Deposit (NPR)"}</label>
                <input id="q-dval" type="number" inputMode="numeric" min="0" value={depositValue} onChange={(e) => setDepositValue(e.target.value)} className={field} />
              </div>
              {depositType === "percentage" && (
                <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Common deposit percentages">
                  {[10, 20, 30, 40, 50].map((p) => (
                    <button key={p} type="button" aria-pressed={Number(depositValue) === p} onClick={() => setDepositValue(p)} className={seg(Number(depositValue) === p)}>{p}%</button>
                  ))}
                </div>
              )}
            </div>

            <div aria-live="polite" className="self-start rounded-card-md bg-sand p-5">
              <dl className="space-y-2 font-body text-small">
                <div className="flex items-baseline justify-between gap-4"><dt className="text-taupe">Total</dt><dd className="font-display text-h4 font-light leading-none text-ink">{npr(total)}</dd></div>
                <div className="flex justify-between gap-4 border-t border-line pt-2"><dt className="text-taupe">Deposit now</dt><dd className="font-medium text-gold-800">{npr(deposit)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-taupe">Balance later</dt><dd className="text-ink">{npr(Math.max(total - deposit, 0))}</dd></div>
              </dl>
            </div>
          </div>
        </fieldset>

        <div>
          <label htmlFor="q-notes" className={lab}>Notes for the customer (optional)</label>
          <textarea id="q-notes" rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What is included, timings, cancellation terms" className={field} />
        </div>

        {error && <p role="alert" className="rounded-card-md border border-red-300 bg-red-50 p-3 font-body text-small text-red-700">{error}</p>}

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={create.isPending || noSpaces} className={`${btnPrimary} px-8 py-3`}>
            {create.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />} Send quotation
          </button>
          <p className="font-body text-caption text-taupe">Total {npr(total)}, deposit {npr(deposit)}</p>
        </div>
      </div>
    </form>
  );
}
