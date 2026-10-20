import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Inbox } from "lucide-react";
import { useOwnerInquiries } from "../../features/inquiry/hooks/useInquiries";
import { effectiveStatus, serverDay, shiftLabel } from "../../features/inquiry/inquiryOptions";
import { bsLabel } from "../../features/inquiry/bsCalendar";
import { EmptyState, ErrorState, PageHeader, Panel, RowsSkeleton, StatusPill } from "../../components/dashboard/ui";
import { shortDate } from "../../components/dashboard/styles";
import Pagination from "../../features/venues/components/Pagination";
import { useRovingTabs } from "../../hooks/useRovingTabs";
import { plural } from "../../utils/plural";

const TABS = [
  { id: "needs", label: "Needs a reply", group: "pending", empty: "No requests waiting. New requests from customers show up here." },
  { id: "waiting", label: "Waiting for customer", group: "quoted", empty: "Nothing is waiting on a customer right now." },
  { id: "booked", label: "Booked", group: "booked", empty: "No booked requests yet." },
  { id: "closed", label: "Closed", group: "closed", empty: "No closed requests." },
];

const TAB_IDS = TABS.map((t) => t.id);
const PAGE_SIZE = 15;
const tabDomId = (id) => `tab-${id}`;

export default function OwnerInquiriesPage() {
  const [tab, setTab] = useState("needs");
  const [page, setPage] = useState(1);
  const current = TABS.find((t) => t.id === tab);
  const { data, isPending, isError, refetch } = useOwnerInquiries({ group: current.group, page, limit: PAGE_SIZE });
  const selectTab = (id) => { setTab(id); setPage(1); };
  // The last request on the last page moved to another tab: step back a page
  useEffect(() => { if (data && data.page > data.pages) setPage(data.pages); }, [data]);
  const roving = useRovingTabs({ ids: TAB_IDS, selected: tab, onSelect: selectTab, idFor: tabDomId });
  const counts = Object.fromEntries(TABS.map((t) => [t.id, data?.counts[t.group] ?? 0]));
  const shown = data?.items ?? [];

  return (
    <>
      <PageHeader eyebrow="Inbox" title="Inquiries" description="Requests from customers. Reply with a quotation to hold their date." />

      <div role="tablist" aria-label="Request status" {...roving.listProps} className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            {...roving.tabProps(t.id)}
            aria-controls="inquiry-panel"
            className={`min-h-11 rounded-full border px-4 py-2 font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
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
                        {shortDate(q.preferredDate)} <span className="text-taupe">({bsLabel(serverDay(q.preferredDate))})</span>
                        {q.preferredShift ? ` · ${shiftLabel(q.preferredShift)}` : ""} · {plural(q.numberOfGuests, "guest")} · {q.eventType}
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
      {data && <div className="mt-6"><Pagination page={data.page} totalPages={data.pages} total={data.total} shown={shown.length} pageSize={PAGE_SIZE} onPage={setPage} noun="request" /></div>}
    </>
  );
}
