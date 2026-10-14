import { Link } from "react-router-dom";
import { CalendarDays, Users } from "lucide-react";
import { useMyInquiries, useRequireLogin } from "../../features/inquiry/hooks/useInquiries";
import StatusBadge from "../../features/inquiry/components/StatusBadge";
import { effectiveStatus, shiftLabel } from "../../features/inquiry/inquiryOptions";

const shortDate = (d) => new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export default function MyInquiriesPage() {
  const { ready } = useRequireLogin();
  const { data: inquiries = [], isPending, isError } = useMyInquiries(ready);

  return (
    <div className="container-site pb-24 pt-[calc(var(--spacing-header)+2.5rem)]">
      <p className="font-body text-eyebrow uppercase text-gold-800">My inquiries</p>
      <h1 className="mt-2 font-display text-h2 font-light text-ink">Your requests to venues</h1>
      <p className="mt-2 max-w-xl font-body text-body text-taupe">
        Each request goes to the venue, which replies with a quotation. Nothing is booked until you accept one and pay the deposit.
      </p>

      {!ready || isPending ? (
        <div role="status" aria-label="Loading" className="mt-10 space-y-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-card-lg bg-gold-100" />)}
        </div>
      ) : isError ? (
        <p className="mt-10 font-body text-body text-taupe">Your requests could not be loaded right now.</p>
      ) : inquiries.length === 0 ? (
        <div className="mt-10 max-w-xl rounded-card-lg border border-dashed border-line bg-cream p-8">
          <p className="font-display text-h4 font-light text-ink">No requests yet</p>
          <p className="mt-2 font-body text-small text-taupe">Find a venue you like and choose “Check a date”.</p>
          <Link to="/venues" className="mt-5 inline-block rounded-full bg-ink px-6 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800">Browse venues</Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-4">
          {inquiries.map((q) => (
            <li key={q._id}>
              <Link
                to={`/my-inquiries/${q._id}`}
                className="flex flex-col gap-3 rounded-card-lg border border-line bg-white p-5 transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="font-display text-h4 font-light text-ink">{q.venue?.venueName ?? "Venue"}</h2>
                  <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-body text-small text-taupe">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4" />{shortDate(q.preferredDate)}{q.preferredShift ? ` · ${shiftLabel(q.preferredShift)}` : ""}</span>
                    <span className="inline-flex items-center gap-1.5"><Users aria-hidden="true" className="size-4" />{q.numberOfGuests} guests</span>
                    <span>{q.eventType}</span>
                  </p>
                </div>
                <div className="flex flex-col items-start gap-1 sm:items-end">
                  <StatusBadge inquiry={q} />
                  {effectiveStatus(q) === "quoted" && <span className="font-body text-caption text-gold-800">Your reply is needed</span>}
                  {effectiveStatus(q) === "accepted" && <span className="font-body text-caption text-gold-800">Pay the deposit to confirm</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
