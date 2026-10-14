import { useId, useState } from "react";
import { CalendarDays, Phone } from "lucide-react";
import { toast } from "react-toastify";
import { apiError } from "../../features/inquiry/hooks/useInquiries";
import { useCancelBookingNow, useCompleteBooking, useOwnerBookingList, useSettleBalance } from "../../features/bookings/hooks/useBookings";
import { shiftLabel } from "../../features/inquiry/inquiryOptions";
import { bsLabel } from "../../features/inquiry/bsCalendar";
import { toWhatsAppNumber } from "../../features/venues/venueFormat";
import { EmptyState, ErrorState, PageHeader, RowsSkeleton, StatusPill } from "../../components/dashboard/ui";
import { btnDanger, btnOutline, btnPrimary, npr } from "../../components/dashboard/styles";
import { inputClass, labelClass } from "../../components/ui/formStyles";
import Select from "../../components/ui/Select";

const TABS = [
  { id: "upcoming", label: "Upcoming", match: (s) => s === "confirmed" || s === "pending_deposit", empty: "When a customer pays a deposit, the booking appears here." },
  { id: "completed", label: "Completed", match: (s) => s === "completed", empty: "Events you mark as completed are listed here." },
  { id: "cancelled", label: "Cancelled", match: (s) => s === "cancelled", empty: "No cancelled bookings." },
];
const METHODS = ["Cash", "Bank transfer", "eSewa", "Khalti", "Other"];
const day = (d) => new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-ink px-3 py-1.5 font-body text-caption text-ink transition-colors hover:bg-ink hover:text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const linkBtn =
  "font-body text-small underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";

function BookingCard({ booking }) {
  const uid = useId();
  const settle = useSettleBalance();
  const complete = useCompleteBooking();
  const cancel = useCancelBookingNow();
  const [panel, setPanel] = useState(null); // "settle" | "cancel"
  const [method, setMethod] = useState(METHODS[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const phone = booking.phoneNumber ?? "";
  const active = booking.status === "confirmed";

  const run = async (mutation, arg, success, after) => {
    setError("");
    try {
      await mutation.mutateAsync(arg);
      toast.success(success);
      after?.();
    } catch (e) {
      setError(apiError(e));
    }
  };

  return (
    <li className="rounded-card-lg border border-line bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words font-body text-body text-ink">
            {booking.customer?.name ?? booking.contactName} <span className="text-taupe">· {booking.venue?.venueName}</span>
          </p>
          <p className="mt-1 font-body text-caption text-taupe">
            {day(booking.startTime)} <span className="text-taupe-light">({bsLabel(booking.startTime)})</span>
            {booking.shift ? ` · ${shiftLabel(booking.shift)}` : ""}
            {booking.space?.name ? ` · ${booking.space.name}` : ""} · {booking.numberOfGuests} guests · {booking.eventType}
          </p>
        </div>
        <StatusPill status={booking.status} />
      </div>

      <dl className="mt-4 grid gap-4 border-t border-line pt-4 font-body sm:grid-cols-3">
        <div>
          <dt className="text-eyebrow uppercase text-taupe">Total</dt>
          <dd className="mt-1 font-display text-h5 font-light text-ink">{npr(booking.totalPrice)}</dd>
        </div>
        <div>
          <dt className="text-eyebrow uppercase text-taupe">Deposit received</dt>
          <dd className="mt-1 font-display text-h5 font-light text-ink">{npr(booking.depositAmount)}</dd>
        </div>
        <div>
          <dt className="text-eyebrow uppercase text-taupe">Balance from customer</dt>
          <dd className="mt-1 font-display text-h5 font-light text-ink">{npr(booking.balanceAmount)}</dd>
          <dd className="mt-0.5 text-caption">
            {booking.balanceSettled ? (
              <span className="text-success">Received{booking.balanceSettledMethod ? ` (${booking.balanceSettledMethod})` : ""}</span>
            ) : (
              <span className="text-taupe">Not yet received</span>
            )}
          </dd>
        </div>
      </dl>

      {phone && (
        <div className="mt-4 flex flex-wrap gap-2">
          <a href={`tel:${phone}`} className={chip}><Phone aria-hidden="true" className="size-3.5" /> {phone}</a>
          <a href={`https://wa.me/${toWhatsAppNumber(phone)}`} target="_blank" rel="noopener noreferrer" className={chip}>WhatsApp</a>
        </div>
      )}

      {active && (
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4">
          {!booking.balanceSettled && (
            <button type="button" aria-expanded={panel === "settle"} onClick={() => setPanel(panel === "settle" ? null : "settle")} className={`${linkBtn} text-gold-800`}>
              Record balance received
            </button>
          )}
          <button type="button" onClick={() => run(complete, booking._id, "Event marked as completed")} disabled={complete.isPending} className={`${linkBtn} text-gold-800`}>
            Mark event completed
          </button>
          <button type="button" aria-expanded={panel === "cancel"} onClick={() => setPanel(panel === "cancel" ? null : "cancel")} className={`${linkBtn} text-taupe`}>
            Cancel booking
          </button>
        </div>
      )}

      {panel === "settle" && (
        <form
          className="mt-4 flex flex-wrap items-end gap-4 rounded-card-md bg-sand p-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(settle, { id: booking._id, method, note: note.trim() }, "Balance recorded", () => { setPanel(null); setNote(""); });
          }}
        >
          <div>
            <label htmlFor={`${uid}-method`} className={labelClass}>Paid by</label>
            <Select id={`${uid}-method`} value={method} onChange={(e) => setMethod(e.target.value)} className={`${inputClass} py-2`}>
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </Select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label htmlFor={`${uid}-note`} className={labelClass}>Note (optional)</label>
            <input id={`${uid}-note`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={`${inputClass} py-2`} />
          </div>
          <button type="submit" disabled={settle.isPending} className={btnPrimary}>Save</button>
        </form>
      )}
      {panel === "cancel" && (
        <div role="alertdialog" aria-label="Confirm cancelling the booking" className="mt-4 rounded-card-md border border-red-300 bg-red-50 p-4 font-body text-small text-ink">
          <p>Cancelling refunds the customer's full deposit ({npr(booking.depositAmount)}), because the venue is the one cancelling.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" onClick={() => run(cancel, booking._id, "Booking cancelled and deposit refunded", () => setPanel(null))} disabled={cancel.isPending} className={btnDanger}>
              Yes, cancel and refund
            </button>
            <button type="button" onClick={() => setPanel(null)} className={btnOutline}>No, keep it</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 rounded-card-md border border-red-300 bg-red-50 p-3 font-body text-small text-red-700">{error}</p>}
    </li>
  );
}

export default function OwnerBookingsPage() {
  const { data: bookings = [], isPending, isError, refetch } = useOwnerBookingList();
  const [tab, setTab] = useState("upcoming");
  const current = TABS.find((t) => t.id === tab);
  const shown = bookings.filter((b) => current.match(b.status)).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Bookings"
        description="Confirmed events. The deposit is paid online; you collect the balance from the customer directly and record it here."
      />

      <div role="tablist" aria-label="Booking status" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`btab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls="booking-panel"
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-2 font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              tab === t.id ? "border-ink bg-ink text-gold-50" : "border-line bg-white text-ink hover:border-ink"
            }`}
          >
            {t.label} <span className={tab === t.id ? "text-gold-200" : "text-taupe"}>({bookings.filter((b) => t.match(b.status)).length})</span>
          </button>
        ))}
      </div>

      <div id="booking-panel" role="tabpanel" aria-labelledby={`btab-${tab}`}>
        {isPending ? (
          <div className="rounded-card-lg border border-line bg-white"><RowsSkeleton rows={3} /></div>
        ) : isError ? (
          <div className="rounded-card-lg border border-line bg-white"><ErrorState onRetry={refetch}>Bookings could not be loaded right now.</ErrorState></div>
        ) : shown.length === 0 ? (
          <div className="rounded-card-lg border border-line bg-white"><EmptyState icon={CalendarDays} title="Nothing here">{current.empty}</EmptyState></div>
        ) : (
          <ul className="space-y-4">{shown.map((b) => <BookingCard key={b._id} booking={b} />)}</ul>
        )}
      </div>
    </>
  );
}
