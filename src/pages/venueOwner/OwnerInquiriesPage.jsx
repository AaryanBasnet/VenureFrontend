import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Inbox } from "lucide-react";
import { useOwnerInquiries } from "../../features/inquiry/hooks/useInquiries";
import { effectiveStatus, shiftLabel } from "../../features/inquiry/inquiryOptions";
import { bsLabel } from "../../features/inquiry/bsCalendar";
import { EmptyState, ErrorState, PageHeader, Panel, RowsSkeleton, StatusPill } from "../../components/dashboard/ui";
import { shortDate } from "../../components/dashboard/styles";

const TABS = [
  { id: "needs", label: "Needs a reply", match: (s) => s === "pending", empty: "No requests waiting. New requests from customers show up here." },
  { id: "waiting", label: "Waiting for customer", match: (s) => s === "quoted" || s === "accepted", empty: "Nothing is waiting on a customer right now." },
  { id: "booked", label: "Booked", match: (s) => s === "booked", empty: "No booked requests yet." },
  { id: "closed", label: "Closed", match: (s) => ["declined", "cancelled", "expired"].includes(s), empty: "No closed requests." },
];

export default function OwnerInquiriesPage() {
  const { data: inquiries = [], isPending, isError, refetch } = useOwnerInquiries();
  const [tab, setTab] = useState("needs");
  const current = TABS.find((t) => t.id === tab);
  const counts = Object.fromEntries(TABS.map((t) => [t.id, inquiries.filter((q) => t.match(effectiveStatus(q))).length]));
  const shown = inquiries.filter((q) => current.match(effectiveStatus(q)));

  return (
    <>
      <PageHeader eyebrow="Inbox" title="Inquiries" description="Requests from customers. Reply with a quotation to hold their date." />

      <div role="tablist" aria-label="Request status" className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls="inquiry-panel"
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-2 font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              tab === t.id ? "border-ink bg-ink text-gold-50" : "border-line bg-white text-ink hover:border-ink"
            }`}
          >
            {t.label} <span className={tab === t.id ? "text-gold-200" : "text-taupe"}>({counts[t.id]})</span>
          </button>
        ))}
      </div>

      <Panel bodyClassName="p-0">
        <div id="inquiry-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {isPending ? (
            <RowsSkeleton rows={4} />
          ) : isError ? (
            <ErrorState onRetry={refetch}>Requests could not be loaded right now.</ErrorState>
          ) : shown.length === 0 ? (
            <EmptyState icon={Inbox} title="Nothing here">{current.empty}</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {shown.map((q) => (
                <li key={q._id}>
                  <Link
                    to={`/owner/inquiries/${q._id}`}
                    className="flex flex-col gap-3 px-6 py-4 hover:bg-cream focus-visible:bg-cream focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-body text-body text-ink">
                        {q.customer?.name ?? q.contactName} <span className="text-taupe">· {q.venue?.venueName}</span>
                      </p>
                      <p className="mt-1 font-body text-caption text-taupe">
                        {shortDate(q.preferredDate)} <span className="text-taupe-light">({bsLabel(q.preferredDate)})</span>
                        {q.preferredShift ? ` · ${shiftLabel(q.preferredShift)}` : ""} · {q.numberOfGuests} guests · {q.eventType}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusPill status={effectiveStatus(q)} />
                      <ArrowRight aria-hidden="true" className="size-4 text-taupe" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </>
  );
}
