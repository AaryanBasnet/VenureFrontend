import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import { EmptyState, ErrorState, PageHeader, Panel, Pill, RowsSkeleton } from "../../components/dashboard/ui";
import { btnOutline, shortDate } from "../../components/dashboard/styles";
import { useApplications } from "../../hooks/admin/useVenueApplications";
import { useRovingTabs } from "../../hooks/useRovingTabs";
import { VENUE_TYPE_LABELS } from "../../features/listVenue/applicationLabels";

const TABS = [
  { id: "pending", label: "Waiting", empty: "No applications are waiting. New ones from venue owners show up here." },
  { id: "approved", label: "Approved", empty: "No approved applications yet." },
  { id: "rejected", label: "Rejected", empty: "No rejected applications." },
  { id: "", label: "All", empty: "No applications yet." },
];
const TAB_IDS = TABS.map((t) => t.id || "all");
const TONE = { pending: ["Waiting", "gold"], approved: ["Approved", "success"], rejected: ["Rejected", "danger"] };

export default function AdminApplicationsPage() {
  const [tab, setTab] = useState("pending");
  const [page, setPage] = useState(1);
  const current = TABS.find((t) => (t.id || "all") === tab);
  const { data, isPending, isError, refetch, isPlaceholderData } = useApplications({ status: current.id, page });
  const roving = useRovingTabs({
    ids: TAB_IDS,
    selected: tab,
    onSelect: (id) => {
      setTab(id);
      setPage(1);
    },
    idFor: (id) => `app-tab-${id}`,
  });
  const items = data?.items ?? [];

  return (
    <>
      <PageHeader eyebrow="Venue owners" title="Applications" description="Owners who want to list a venue. Check their documents, then approve or reject." />

      <div role="tablist" aria-label="Application status" {...roving.listProps} className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const id = t.id || "all";
          return (
            <button
              key={id}
              {...roving.tabProps(id)}
              aria-controls="applications-panel"
              className={`min-h-11 rounded-full border px-4 py-2 font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                tab === id ? "border-ink bg-ink text-gold-50" : "border-line bg-white text-ink hover:border-ink"
              }`}
            >
              {t.label}
              {id === "pending" && data?.pending > 0 && <span className={tab === id ? " text-gold-200" : " text-taupe"}> ({data.pending})</span>}
            </button>
          );
        })}
      </div>

      <Panel bodyClassName="p-0">
        <div id="applications-panel" role="tabpanel" aria-labelledby={`app-tab-${tab}`} aria-busy={isPlaceholderData}>
          {isPending ? (
            <div className="p-6"><RowsSkeleton rows={4} /></div>
          ) : isError ? (
            <div className="p-6"><ErrorState onRetry={refetch}>The applications could not be loaded.</ErrorState></div>
          ) : items.length === 0 ? (
            <div className="p-6"><EmptyState icon={ClipboardList} title="Nothing here">{current.empty}</EmptyState></div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((a) => {
                const [label, tone] = TONE[a.status];
                return (
                  <li key={a._id}>
                    <Link to={`/admin/applications/${a._id}`} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 hover:bg-cream focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ink">
                      <span className="min-w-0">
                        <span className="block truncate font-display text-h5 font-light text-ink">{a.venueName}</span>
                        <span className="mt-0.5 block font-body text-small text-taupe">
                          {VENUE_TYPE_LABELS[a.venueType]} · {a.location.city}, {a.location.province} · {a.contactName} · {a.halls.length} {a.halls.length === 1 ? "hall" : "halls"}
                        </span>
                      </span>
                      <span className="flex items-center gap-4">
                        <span className="font-body text-caption text-taupe">Applied {shortDate(a.createdAt)}</span>
                        <Pill tone={tone}>{label}</Pill>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Panel>

      {data && data.pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center justify-between">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className={btnOutline}>
            <ChevronLeft aria-hidden="true" className="size-4" /> Previous
          </button>
          <span className="font-body text-small text-taupe">Page {page} of {data.pages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} className={btnOutline}>
            Next <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </nav>
      )}
    </>
  );
}
