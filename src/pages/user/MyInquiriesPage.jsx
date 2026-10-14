import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Users } from "lucide-react";
import { useMyInquiries, useRequireLogin } from "../../features/inquiry/hooks/useInquiries";
import StatusBadge from "../../features/inquiry/components/StatusBadge";
import { effectiveStatus, formatShortDate, serverDay, shiftLabel } from "../../features/inquiry/inquiryOptions";

// Which statuses each filter shows. "Needs you" is the list a customer should look at first.
const FILTERS = [
  { key: "all", label: "All", match: () => true },
  { key: "action", label: "Needs you", match: (s) => s === "quoted" || s === "accepted" },
  { key: "waiting", label: "Waiting", match: (s) => s === "pending" },
  { key: "booked", label: "Booked", match: (s) => s === "booked" },
  { key: "closed", label: "Closed", match: (s) => ["declined", "cancelled", "expired"].includes(s) },
];

const guestsLabel = (n) => `${n} ${n === 1 ? "guest" : "guests"}`;

export default function MyInquiriesPage() {
  const { ready } = useRequireLogin();
  const { data: inquiries = [], isPending, isError, refetch, isFetching } = useMyInquiries(ready);
  const [filter, setFilter] = useState("all");
  const active = FILTERS.find((f) => f.key === filter);
  const counts = Object.fromEntries(FILTERS.map((f) => [f.key, inquiries.filter((q) => f.match(effectiveStatus(q))).length]));
  const visible = inquiries.filter((q) => active.match(effectiveStatus(q)));

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
        <div role="alert" className="mt-10 max-w-xl rounded-card-lg border border-line bg-cream p-6">
          <p className="font-display text-h4 font-light text-ink">Your requests could not be loaded</p>
          <p className="mt-2 font-body text-small text-taupe">Check your connection and try again.</p>
          <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-4 inline-flex min-h-11 items-center rounded-full border border-ink px-6 py-3 font-body text-button uppercase text-ink hover:bg-ink hover:text-gold-50 disabled:opacity-60">
            {isFetching ? "Trying again" : "Try again"}
          </button>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="mt-10 max-w-xl rounded-card-lg border border-dashed border-line bg-cream p-8">
          <p className="font-display text-h4 font-light text-ink">No requests yet</p>
          <p className="mt-2 font-body text-small text-taupe">Find a venue you like and choose “Request a date”.</p>
          <Link to="/venues" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ink px-6 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800">Browse venues</Link>
        </div>
      ) : (
        <>
          <div role="group" aria-label="Filter requests" className="mt-8 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 font-body text-small focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${filter === f.key ? "border-ink bg-ink text-gold-50" : "border-line bg-white text-ink hover:border-ink"}`}
              >
                {f.label}
                <span className={filter === f.key ? "text-gold-200" : "text-taupe"}>{counts[f.key]}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p role="status" className="mt-8 max-w-xl rounded-card-lg border border-dashed border-line bg-cream p-6 font-body text-small text-taupe">
              {filter === "action" ? "Nothing needs your reply right now." : `No ${active.label.toLowerCase()} requests.`}
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {visible.map((q) => {
                const status = effectiveStatus(q);
                return (
                  <li key={q._id}>
                    <Link
                      to={`/my-inquiries/${q._id}`}
                      className="flex flex-col gap-3 rounded-card-lg border border-line bg-white p-5 transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <h2 className="break-words font-display text-h4 font-light text-ink">{q.venue?.venueName ?? "Venue"}</h2>
                        <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 font-body text-small text-taupe">
                          <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-4" />{formatShortDate(serverDay(q.preferredDate))}{q.preferredShift ? ` · ${shiftLabel(q.preferredShift)}` : ""}</span>
                          <span className="inline-flex items-center gap-1.5"><Users aria-hidden="true" className="size-4" />{guestsLabel(q.numberOfGuests)}</span>
                          <span>{q.eventType}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                        <StatusBadge inquiry={q} />
                        {status === "quoted" && <span className="font-body text-caption text-gold-800">Open it to accept or decline</span>}
                        {status === "accepted" && <span className="font-body text-caption text-gold-800">Pay the deposit to confirm</span>}
                        {status === "declined" && <span className="font-body text-caption text-taupe">Try another date or venue</span>}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
