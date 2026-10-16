import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Loader2, Users } from "lucide-react";
import { bsLabel } from "../../features/inquiry/bsCalendar";
import { apiError, useRequireLogin } from "../../features/inquiry/hooks/useInquiries";
import { useCancelBookingNow, useMyBookingList } from "../../features/bookings/hooks/useBookings";
import BookingStatusBadge from "../../features/bookings/components/BookingStatusBadge";
import ReviewForm from "../../features/bookings/components/ReviewForm";
import { isUpcoming, npr, pluralDays, refundPercentageNow, tierRows } from "../../features/bookings/bookingFormat";
import { formatDate, serverDay, shiftLabel } from "../../features/inquiry/inquiryOptions";

const TABS = [
  { key: "upcoming", label: "Upcoming", empty: "No upcoming events." },
  { key: "past", label: "Past", empty: "No past events yet." },
  { key: "cancelled", label: "Cancelled", empty: "No cancelled bookings." },
];

const tabOf = (b) => (b.status === "cancelled" ? "cancelled" : b.status === "completed" || !isUpcoming(b) ? "past" : "upcoming");
const smallBtn = "inline-flex min-h-11 items-center gap-2 px-1 font-body text-small underline underline-offset-4 disabled:opacity-60";

function BookingCard({ booking, onCancelled }) {
  const cancel = useCancelBookingNow();
  const [confirming, setConfirming] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const refund = refundPercentageNow(booking);
  const upcoming = isUpcoming(booking);
  const canCancel = ["pending_deposit", "confirmed"].includes(booking.status) && upcoming;
  const day = serverDay(booking.startTime);
  const daysToGo = Math.floor((booking.startTime ? new Date(booking.startTime).getTime() - Date.now() : 0) / 86400000);
  const depositPaid = booking.status !== "pending_deposit";
  const guests = booking.numberOfGuests;

  const doCancel = async () => {
    setError("");
    try {
      await cancel.mutateAsync(booking._id);
      setConfirming(false);
      onCancelled?.(booking);
    } catch (e) {
      setError(apiError(e));
    }
  };

  return (
    <li className="rounded-card-lg border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words font-display text-h4 font-light text-ink">
            <Link to={`/venue/${booking.venue?._id}`} className="hover:text-gold-800">{booking.venue?.venueName ?? "Venue"}</Link>
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-body text-small text-taupe">
            <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4 shrink-0" />{formatDate(day)} ({bsLabel(day)}){booking.shift ? ` · ${shiftLabel(booking.shift)}` : ""}</span>
            <span className="inline-flex items-center gap-1.5"><Users aria-hidden="true" className="size-4 shrink-0" />{guests} {guests === 1 ? "guest" : "guests"}</span>
            {booking.space?.name && <span>{booking.space.name}</span>}
            {booking.eventType && <span>{booking.eventType}</span>}
          </p>
          {canCancel && booking.status === "confirmed" && (
            <p className="mt-2 font-body text-small text-gold-800">{daysToGo <= 0 ? "Today or tomorrow" : `${pluralDays(daysToGo)} to go`}</p>
          )}
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <dl className="mt-4 grid gap-3 border-t border-line pt-4 font-body text-small sm:grid-cols-3">
        <div><dt className="text-taupe">Total</dt><dd className="text-ink">{npr(booking.totalPrice)}</dd></div>
        <div><dt className="text-taupe">{depositPaid ? "Deposit paid on eSewa" : "Deposit due"}</dt><dd className="text-ink">{npr(booking.depositAmount)}</dd></div>
        <div>
          <dt className="text-taupe">Balance, for the venue directly</dt>
          <dd className="text-ink">{npr(booking.balanceAmount)}{booking.balanceSettled ? " · settled" : ""}</dd>
        </div>
      </dl>
      {booking.status === "pending_deposit" && (
        <p className="mt-3 font-body text-small text-ink">
          The date is not confirmed until the deposit is paid. <Link to="/my-inquiries" className="text-gold-800 underline underline-offset-4">Open My inquiries</Link> to pay.
        </p>
      )}
      {booking.status === "confirmed" && !booking.balanceSettled && upcoming && (
        <p className="mt-3 font-body text-caption text-taupe">Pay the balance to the venue, by cash or bank transfer, as agreed with them.</p>
      )}
      {booking.status === "cancelled" && (
        <p className="mt-3 font-body text-small text-ink/85">
          This booking was cancelled. Any refund of the deposit is sent back to your eSewa account by Venure by hand, so it is not instant. <Link to="/contact" className="text-gold-800 underline underline-offset-4">Contact us</Link> if it has not arrived.
        </p>
      )}

      {booking.status === "completed" && !reviewing && (
        <button type="button" onClick={() => setReviewing(true)} className={`${smallBtn} mt-2 text-gold-800 hover:text-ink`}>
          Review this event
        </button>
      )}
      {reviewing && <ReviewForm booking={booking} onClose={() => setReviewing(false)} />}

      {canCancel && !confirming && (
        <button type="button" onClick={() => setConfirming(true)} className={`${smallBtn} mt-2 text-taupe hover:text-ink`}>Cancel this booking</button>
      )}
      {confirming && (
        <div className="mt-4 rounded-card-md bg-sand p-4 font-body text-small text-ink">
          {depositPaid ? (
            <>
              <p className="font-semibold">
                {refund > 0
                  ? `Cancelling now refunds ${refund}% of your deposit: ${npr((booking.depositAmount * refund) / 100)} of ${npr(booking.depositAmount)}.`
                  : "Cancelling this close to the event means the deposit is not refunded."}
              </p>
              <table className="mt-3 w-full max-w-sm text-left text-caption">
                <caption className="sr-only">Refund by how early you cancel</caption>
                <thead>
                  <tr className="text-taupe"><th scope="col" className="py-1 font-medium">Cancel</th><th scope="col" className="py-1 text-right font-medium">Refund of deposit</th></tr>
                </thead>
                <tbody>
                  {tierRows(booking).map((t) => (
                    <tr key={t.minDaysBefore} className={t.refundPercentage === refund ? "font-semibold" : ""}>
                      <td className="py-1">{t.range}{t.refundPercentage === refund ? " (now)" : ""}</td>
                      <td className="py-1 text-right">{t.refundPercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-caption text-taupe">
                eSewa does not let us refund automatically, so Venure sends any refund back to your eSewa account by hand. It will not arrive instantly. The balance is no longer due.
              </p>
            </>
          ) : (
            <p>You have not paid a deposit yet, so cancelling costs nothing.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={doCancel} disabled={cancel.isPending} className="inline-flex min-h-11 items-center gap-2 px-2 font-semibold text-red-700 hover:underline disabled:opacity-60">
              {cancel.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              Yes, cancel the booking
            </button>
            <button type="button" onClick={() => { setConfirming(false); setError(""); }} disabled={cancel.isPending} className="inline-flex min-h-11 items-center px-2 text-taupe hover:underline">Keep it</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 font-body text-small text-red-700">{error}</p>}
    </li>
  );
}

export default function MyBookingsPage() {
  const { ready } = useRequireLogin();
  const { data: bookings = [], isPending, isError, refetch, isFetching } = useMyBookingList(ready);
  const [picked, setPicked] = useState(null);
  const [notice, setNotice] = useState("");
  const sorted = [...bookings].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const groups = { upcoming: [], past: [], cancelled: [] };
  sorted.forEach((b) => groups[tabOf(b)].push(b));
  groups.past.reverse(); // newest first for events that already happened
  // Open on the first tab that has something in it, unless the customer chose one.
  const tab = picked ?? (groups.upcoming.length ? "upcoming" : groups.past.length ? "past" : groups.cancelled.length ? "cancelled" : "upcoming");
  const current = TABS.find((t) => t.key === tab);

  return (
    <div className="container-site page-pad">
      <p className="font-body text-eyebrow uppercase text-gold-800">My bookings</p>
      <h1 className="mt-2 font-display text-h2 font-light text-ink">Your confirmed events</h1>
      <p className="mt-2 max-w-xl font-body text-body text-taupe">
        A booking is confirmed once the deposit is paid. Waiting on a venue's reply? See <Link to="/my-inquiries" className="text-gold-800 underline underline-offset-4">My inquiries</Link>.
      </p>

      <p role="status" className={notice ? "mt-6 max-w-xl rounded-card-sm bg-sand px-4 py-3 font-body text-small text-ink" : "sr-only"}>{notice}</p>

      {!ready || isPending ? (
        <div role="status" aria-label="Loading" className="mt-10 space-y-3">{[0, 1].map((i) => <div key={i} className="h-36 animate-pulse rounded-card-lg bg-gold-100" />)}</div>
      ) : isError ? (
        <div role="alert" className="mt-10 max-w-xl rounded-card-lg border border-line bg-cream p-6">
          <p className="font-display text-h4 font-light text-ink">Your bookings could not be loaded</p>
          <p className="mt-2 font-body text-small text-taupe">Check your connection and try again.</p>
          <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-4 inline-flex min-h-11 items-center rounded-full border border-ink px-6 py-3 font-body text-button uppercase text-ink hover:bg-ink hover:text-gold-50 disabled:opacity-60">
            {isFetching ? "Trying again" : "Try again"}
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-10 max-w-xl rounded-card-lg border border-dashed border-line bg-cream p-8">
          <p className="font-display text-h4 font-light text-ink">No bookings yet</p>
          <p className="mt-2 font-body text-small text-taupe">Once you accept a quotation and pay the deposit, your booking appears here.</p>
          <Link to="/venues" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-6 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800">Browse venues</Link>
        </div>
      ) : (
        <>
          <div role="group" aria-label="Filter bookings" className="mt-8 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                aria-pressed={tab === t.key}
                onClick={() => setPicked(t.key)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-body text-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${tab === t.key ? "border-ink bg-ink text-gold-50" : "border-line bg-white text-ink hover:border-ink"}`}
              >
                {t.label}
                <span className={tab === t.key ? "text-gold-200" : "text-taupe"}>{groups[t.key].length}</span>
              </button>
            ))}
          </div>
          {groups[tab].length === 0 ? (
            <p role="status" className="mt-6 max-w-xl rounded-card-lg border border-dashed border-line bg-cream p-6 font-body text-small text-taupe">{current.empty}</p>
          ) : (
            <ul className="mt-6 space-y-4">{groups[tab].map((b) => <BookingCard key={b._id} booking={b} onCancelled={(x) => setNotice(`Your booking at ${x.venue?.venueName ?? "the venue"} is cancelled. You can find it under Cancelled.`)} />)}</ul>
          )}
        </>
      )}
    </div>
  );
}
