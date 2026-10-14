import { useState } from "react";
import { Phone } from "lucide-react";
import { apiError } from "../../features/inquiry/hooks/useInquiries";
import { useCancelBookingNow, useCompleteBooking, useOwnerBookingList, useSettleBalance } from "../../features/bookings/hooks/useBookings";
import BookingStatusBadge from "../../features/bookings/components/BookingStatusBadge";
import { npr } from "../../features/bookings/bookingFormat";
import { shiftLabel } from "../../features/inquiry/inquiryOptions";
import { toWhatsAppNumber } from "../../features/venues/venueFormat";

const TABS = [
  { id: "upcoming", label: "Upcoming", match: (s) => s === "confirmed" || s === "pending_deposit" },
  { id: "completed", label: "Completed", match: (s) => s === "completed" },
  { id: "cancelled", label: "Cancelled", match: (s) => s === "cancelled" },
];
const METHODS = ["Cash", "Bank transfer", "eSewa", "Khalti", "Other"];
const field = "rounded-card-sm border border-border-strong bg-white px-3 py-2 font-body text-small text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink";
const day = (d) => new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

function BookingRow({ booking }) {
  const settle = useSettleBalance();
  const complete = useCompleteBooking();
  const cancel = useCancelBookingNow();
  const [panel, setPanel] = useState(null); // "settle" | "cancel"
  const [method, setMethod] = useState(METHODS[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const phone = booking.phoneNumber ?? "";
  const active = booking.status === "confirmed";

  const run = async (mutation, arg, after) => {
    setError("");
    try {
      await mutation.mutateAsync(arg);
      after?.();
    } catch (e) {
      setError(apiError(e));
    }
  };

  return (
    <li className="rounded-card-md border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-body text-body text-ink">
            {booking.customer?.name ?? booking.contactName} <span className="text-taupe">· {booking.venue?.venueName}</span>
          </p>
          <p className="mt-1 font-body text-small text-taupe">
            {day(booking.startTime)} · {booking.shift ? shiftLabel(booking.shift) : ""} · {booking.space?.name} · {booking.numberOfGuests} guests · {booking.eventType}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <dl className="mt-3 grid gap-2 font-body text-small sm:grid-cols-3">
        <div><dt className="text-taupe">Total</dt><dd className="text-ink">{npr(booking.totalPrice)}</dd></div>
        <div><dt className="text-taupe">Deposit received</dt><dd className="text-ink">{npr(booking.depositAmount)}</dd></div>
        <div>
          <dt className="text-taupe">Balance from customer</dt>
          <dd className="text-ink">{npr(booking.balanceAmount)} · {booking.balanceSettled ? <span className="text-success">received{booking.balanceSettledMethod ? ` (${booking.balanceSettledMethod})` : ""}</span> : "not yet received"}</dd>
        </div>
      </dl>

      {phone && (
        <div className="mt-3 flex flex-wrap gap-2 font-body text-small">
          <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-ink px-3 py-1.5 text-ink hover:bg-ink hover:text-gold-50"><Phone aria-hidden="true" className="size-3.5" /> {phone}</a>
          <a href={`https://wa.me/${toWhatsAppNumber(phone)}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-ink px-3 py-1.5 text-ink hover:bg-ink hover:text-gold-50">WhatsApp</a>
        </div>
      )}

      {active && (
        <div className="mt-4 flex flex-wrap gap-4 font-body text-small">
          {!booking.balanceSettled && <button type="button" onClick={() => setPanel(panel === "settle" ? null : "settle")} className="text-gold-800 underline underline-offset-4 hover:text-ink">Record balance received</button>}
          <button type="button" onClick={() => run(complete, booking._id)} disabled={complete.isPending} className="text-gold-800 underline underline-offset-4 hover:text-ink">Mark event completed</button>
          <button type="button" onClick={() => setPanel(panel === "cancel" ? null : "cancel")} className="text-taupe underline underline-offset-4 hover:text-ink">Cancel booking</button>
        </div>
      )}

      {panel === "settle" && (
        <form
          className="mt-3 flex flex-wrap items-end gap-3 rounded-card-md bg-sand p-4"
          onSubmit={(e) => { e.preventDefault(); run(settle, { id: booking._id, method, note: note.trim() }, () => { setPanel(null); setNote(""); }); }}
        >
          <label className="font-body text-eyebrow uppercase text-taupe">Paid by
            <select value={method} onChange={(e) => setMethod(e.target.value)} className={`${field} mt-1 block`}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select>
          </label>
          <label className="font-body text-eyebrow uppercase text-taupe">Note (optional)
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={`${field} mt-1 block w-56`} />
          </label>
          <button type="submit" disabled={settle.isPending} className="rounded-full bg-ink px-5 py-2 font-body text-button uppercase text-gold-50 hover:bg-gold-800 disabled:opacity-60">Save</button>
        </form>
      )}
      {panel === "cancel" && (
        <div className="mt-3 rounded-card-md bg-sand p-4 font-body text-small text-ink">
          <p>Cancelling refunds the customer's full deposit ({npr(booking.depositAmount)}), because the venue is the one cancelling.</p>
          <div className="mt-3 flex gap-4">
            <button type="button" onClick={() => run(cancel, booking._id, () => setPanel(null))} disabled={cancel.isPending} className="font-semibold text-red-700 hover:underline">Yes, cancel and refund</button>
            <button type="button" onClick={() => setPanel(null)} className="text-taupe hover:underline">Keep it</button>
          </div>
        </div>
      )}
      <p role="alert" className="mt-2 min-h-5 font-body text-small text-red-700">{error}</p>
    </li>
  );
}

export default function OwnerBookingsPage() {
  const { data: bookings = [], isPending, isError } = useOwnerBookingList();
  const [tab, setTab] = useState("upcoming");
  const current = TABS.find((t) => t.id === tab);
  const shown = bookings.filter((b) => current.match(b.status)).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-display text-h2 font-light text-ink">Bookings</h1>
      <p className="mt-1 font-body text-small text-taupe">Confirmed events. The deposit is paid online; you collect the balance from the customer directly and record it here.</p>

      <div role="tablist" aria-label="Booking status" className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-full border px-4 py-2 font-body text-small ${tab === t.id ? "border-ink bg-ink text-gold-50" : "border-line bg-white text-ink hover:border-ink"}`}>
            {t.label} <span className={tab === t.id ? "text-gold-200" : "text-taupe"}>({bookings.filter((b) => t.match(b.status)).length})</span>
          </button>
        ))}
      </div>

      {isPending ? (
        <div role="status" aria-label="Loading" className="mt-6 space-y-3">{[0, 1].map((i) => <div key={i} className="h-28 animate-pulse rounded-card-md bg-gold-100" />)}</div>
      ) : isError ? (
        <p className="mt-6 font-body text-body text-taupe">Bookings could not be loaded right now.</p>
      ) : shown.length === 0 ? (
        <p className="mt-6 rounded-card-md border border-dashed border-line bg-cream p-6 font-body text-small text-taupe">Nothing here right now.</p>
      ) : (
        <ul className="mt-6 space-y-3">{shown.map((b) => <BookingRow key={b._id} booking={b} />)}</ul>
      )}
    </div>
  );
}
