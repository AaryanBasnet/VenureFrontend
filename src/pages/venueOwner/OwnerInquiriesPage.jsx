import { useState } from "react";
import { Link } from "react-router-dom";
import { useOwnerInquiries } from "../../features/inquiry/hooks/useInquiries";
import StatusBadge from "../../features/inquiry/components/StatusBadge";
import { effectiveStatus, shiftLabel } from "../../features/inquiry/inquiryOptions";

const TABS = [
  { id: "needs", label: "Needs a reply", match: (s) => s === "pending" },
  { id: "waiting", label: "Waiting for customer", match: (s) => s === "quoted" || s === "accepted" },
  { id: "booked", label: "Booked", match: (s) => s === "booked" },
  { id: "closed", label: "Closed", match: (s) => ["declined", "cancelled", "expired"].includes(s) },
];

const shortDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function OwnerInquiriesPage() {
  const { data: inquiries = [], isPending, isError } = useOwnerInquiries();
  const [tab, setTab] = useState("needs");
  const current = TABS.find((t) => t.id === tab);
  const counts = Object.fromEntries(TABS.map((t) => [t.id, inquiries.filter((q) => t.match(effectiveStatus(q))).length]));
  const shown = inquiries.filter((q) => current.match(effectiveStatus(q)));

  return (
    <div className="p-4 sm:p-8">
      <h1 className="font-display text-h2 font-light text-ink">Inquiries</h1>
      <p className="mt-1 font-body text-small text-taupe">Requests from customers. Reply with a quotation to hold their date.</p>

      <div role="tablist" aria-label="Inquiry status" className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-2 font-body text-small ${tab === t.id ? "border-ink bg-ink text-gold-50" : "border-line bg-white text-ink hover:border-ink"}`}
          >
            {t.label} <span className={tab === t.id ? "text-gold-200" : "text-taupe"}>({counts[t.id]})</span>
          </button>
        ))}
      </div>

      {isPending ? (
        <div role="status" aria-label="Loading" className="mt-6 space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-card-md bg-gold-100" />)}</div>
      ) : isError ? (
        <p className="mt-6 font-body text-body text-taupe">Inquiries could not be loaded right now.</p>
      ) : shown.length === 0 ? (
        <p className="mt-6 rounded-card-md border border-dashed border-line bg-cream p-6 font-body text-small text-taupe">Nothing here right now.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {shown.map((q) => (
            <li key={q._id}>
              <Link to={`/owner/inquiries/${q._id}`} className="flex flex-col gap-2 rounded-card-md border border-line bg-white p-4 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-body text-body text-ink">{q.customer?.name ?? q.contactName} <span className="text-taupe">· {q.venue?.venueName}</span></p>
                  <p className="mt-1 font-body text-small text-taupe">
                    {shortDate(q.preferredDate)}{q.preferredShift ? ` · ${shiftLabel(q.preferredShift)}` : ""} · {q.numberOfGuests} guests · {q.eventType}
                  </p>
                </div>
                <StatusBadge inquiry={q} role="owner" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
