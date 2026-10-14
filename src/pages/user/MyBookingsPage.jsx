import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Users } from "lucide-react";
import { apiError, useRequireLogin } from "../../features/inquiry/hooks/useInquiries";
import { useCancelBookingNow, useMyBookingList } from "../../features/bookings/hooks/useBookings";
import BookingStatusBadge from "../../features/bookings/components/BookingStatusBadge";
import ReviewForm from "../../features/bookings/components/ReviewForm";
import { isUpcoming, npr, refundPercentageNow } from "../../features/bookings/bookingFormat";
import { shiftLabel } from "../../features/inquiry/inquiryOptions";

const fullDate = (d) => new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function BookingCard({ booking }) {
  const cancel = useCancelBookingNow();
  const [confirming, setConfirming] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const refund = refundPercentageNow(booking);
  const canCancel = ["pending_deposit", "confirmed"].includes(booking.status) && isUpcoming(booking);

  const doCancel = async () => {
    setError("");
    try {
      await cancel.mutateAsync(booking._id);
      setConfirming(false);
    } catch (e) {
      setError(apiError(e));
    }
  };

  return (
    <li className="rounded-card-lg border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-h4 font-light text-ink">
            <Link to={`/venue/${booking.venue?._id}`} className="hover:text-gold-800">{booking.venue?.venueName ?? "Venue"}</Link>
          </h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-body text-small text-taupe">
            <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4" />{fullDate(booking.startTime)} · {booking.shift ? shiftLabel(booking.shift) : ""}</span>
            <span className="inline-flex items-center gap-1.5"><Users aria-hidden="true" className="size-4" />{booking.numberOfGuests} guests</span>
            <span>{booking.space?.name}</span>
            <span>{booking.eventType}</span>
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <dl className="mt-4 grid gap-3 border-t border-line pt-4 font-body text-small sm:grid-cols-3">
        <div><dt className="text-taupe">Total</dt><dd className="text-ink">{npr(booking.totalPrice)}</dd></div>
        <div><dt className="text-taupe">Deposit{booking.status === "cancelled" ? "" : " paid"}</dt><dd className="text-ink">{npr(booking.depositAmount)}</dd></div>
        <div>
          <dt className="text-taupe">Balance, paid to the venue directly</dt>
          <dd className="text-ink">{npr(booking.balanceAmount)}{booking.balanceSettled ? " · settled" : ""}</dd>
        </div>
      </dl>

      {booking.status === "completed" && !reviewing && (
        <button type="button" onClick={() => setReviewing(true)} className="mt-4 font-body text-small text-gold-800 underline underline-offset-4 hover:text-ink">
          Review this event
        </button>
      )}
      {reviewing && <ReviewForm booking={booking} />}

      {canCancel && !confirming && (
        <button type="button" onClick={() => setConfirming(true)} className="mt-4 font-body text-small text-taupe underline underline-offset-4 hover:text-ink">Cancel this booking</button>
      )}
      {confirming && (
        <div className="mt-4 rounded-card-md bg-sand p-4 font-body text-small text-ink">
          <p>
            {refund > 0
              ? `If you cancel now you get ${refund}% of your deposit back (${npr((booking.depositAmount * refund) / 100)}).`
              : "Cancelling this close to the event means the deposit is not refunded."}
          </p>
          <div className="mt-3 flex gap-4">
            <button type="button" onClick={doCancel} disabled={cancel.isPending} className="font-semibold text-red-700 hover:underline">Yes, cancel the booking</button>
            <button type="button" onClick={() => setConfirming(false)} className="text-taupe hover:underline">Keep it</button>
          </div>
        </div>
      )}
      <p role="alert" className="mt-2 min-h-5 font-body text-small text-red-700">{error}</p>
    </li>
  );
}

export default function MyBookingsPage() {
  const { ready } = useRequireLogin();
  const { data: bookings = [], isPending, isError } = useMyBookingList(ready);
  const sorted = [...bookings].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  return (
    <div className="container-site pb-24 pt-[calc(var(--spacing-header)+2.5rem)]">
      <p className="font-body text-eyebrow uppercase text-gold-800">My bookings</p>
      <h1 className="mt-2 font-display text-h2 font-light text-ink">Your confirmed events</h1>
      <p className="mt-2 max-w-xl font-body text-body text-taupe">
        A booking is confirmed once the deposit is paid. Waiting on a venue's reply? See <Link to="/my-inquiries" className="text-gold-800 underline underline-offset-4">My inquiries</Link>.
      </p>

      {!ready || isPending ? (
        <div role="status" aria-label="Loading" className="mt-10 space-y-3">{[0, 1].map((i) => <div key={i} className="h-36 animate-pulse rounded-card-lg bg-gold-100" />)}</div>
      ) : isError ? (
        <p className="mt-10 font-body text-body text-taupe">Your bookings could not be loaded right now.</p>
      ) : sorted.length === 0 ? (
        <div className="mt-10 max-w-xl rounded-card-lg border border-dashed border-line bg-cream p-8">
          <p className="font-display text-h4 font-light text-ink">No bookings yet</p>
          <p className="mt-2 font-body text-small text-taupe">Once you accept a quotation and pay the deposit, your booking appears here.</p>
          <Link to="/venues" className="mt-5 inline-block rounded-full bg-ink px-6 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800">Browse venues</Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-4">{sorted.map((b) => <BookingCard key={b._id} booking={b} />)}</ul>
      )}
    </div>
  );
}
