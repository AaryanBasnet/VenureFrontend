import { useEffect, useState } from "react";
import { venueTypeLabel } from "../../features/venues/venueTypes";
import { Link } from "react-router-dom";
import { Building2, Check, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, MapPin, Search, User, X } from "lucide-react";
import { toast } from "react-toastify";
import { EmptyState, ErrorState, PageHeader, Panel, Pill, RowsSkeleton } from "../../components/dashboard/ui";
import { btnDanger, btnOutline, btnPrimary, npr, shortDate } from "../../components/dashboard/styles";
import { inputClass, labelClass } from "../../components/ui/formStyles";
import { useGetVenues } from "../../hooks/admin/useGetVenues";
import { useVenueStatusCounts } from "../../hooks/admin/useVenueStatusCounts";
import { useChangeVenueStatus } from "../../hooks/admin/useChangeVenueStatus";
import { useToggleVenueFeatured } from "../../hooks/admin/useToggleVenueFeatured";
import { useDebounce } from "../../hooks/useDebounce";
import { getErrorMessage } from "../../api/api";
import { assetUrl } from "../../utils/assetUrl";
import { plural } from "../../utils/plural";
import { useRovingTabs } from "../../hooks/useRovingTabs";

const LIMIT = 10;

const TABS = [
  { id: "pending", label: "Pending", empty: "No venues are waiting for review. New listings from owners appear here." },
  { id: "approved", label: "Approved", empty: "No approved venues yet." },
  { id: "rejected", label: "Rejected", empty: "No rejected venues." },
  { id: "all", label: "All", empty: "No venues have been listed yet." },
];

const STATUS_TONE = { approved: "success", pending: "gold", rejected: "danger" };
const STATUS_LABEL = { approved: "Approved", pending: "Pending review", rejected: "Rejected" };

const categoryLabel = (c) => venueTypeLabel(c) ?? "No venue type";

const linkBtn =
  "inline-flex items-center gap-1.5 font-body text-small text-ink underline underline-offset-4 hover:text-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function FeaturedSwitch({ venue, onToggle, busy }) {
  const approved = venue.status === "approved";
  const on = Boolean(venue.isFeatured);
  const labelId = `feat-label-${venue._id}`;
  const hintId = `feat-hint-${venue._id}`;
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        aria-describedby={hintId}
        disabled={!approved || busy}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50 ${
          on ? "border-ink bg-ink" : "border-border-strong bg-sand"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block size-4 rounded-full transition-transform ${on ? "translate-x-6 bg-gold-50" : "translate-x-1 bg-taupe"}`}
        />
      </button>
      <div className="min-w-0">
        <p id={labelId} className="font-body text-small text-ink">Featured on landing page</p>
        <p id={hintId} className="font-body text-caption text-taupe">
          {approved ? (on ? "Shown in the featured section." : "Not shown in the featured section.") : "Only approved venues can be featured."}
        </p>
      </div>
    </div>
  );
}

function VenueRow({ venue, onSetStatus, onToggleFeatured, statusBusy, featuredBusy }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(null); // "approved" | "rejected" | null
  const image = venue.venueImages?.[0]?.url;
  const place = [venue.location?.city, venue.location?.country].filter(Boolean).join(", ");
  const prices = (venue.packages ?? []).map((p) => Number(p.pricePerPlate)).filter((n) => n > 0);
  const cheapest = prices.length ? Math.min(...prices) : 0;
  const amenities = venue.amenities ?? [];
  const photoCount = venue.venueImages?.length ?? 0;
  const detailsId = `venue-details-${venue._id}`;
  const canApprove = venue.status !== "approved";
  const canReject = venue.status !== "rejected";

  const confirmText =
    confirm === "approved"
      ? "Approve this venue? It goes live on the site and the owner is notified."
      : venue.status === "approved"
        ? "Reject this venue? It is taken off the site and the owner is notified."
        : "Reject this venue? The owner is notified and it stays off the site.";

  return (
    <li className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="h-40 w-full shrink-0 overflow-hidden rounded-card-md bg-gold-100 sm:h-24 sm:w-32">
          {image ? (
            <img src={assetUrl(image)} alt="" className="size-full object-cover" loading="lazy" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Building2 aria-hidden="true" className="size-7 text-gold-800" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="min-w-0 break-words font-display text-h5 font-light text-ink">{venue.venueName}</h2>
            <Pill tone={STATUS_TONE[venue.status] ?? "neutral"}>{STATUS_LABEL[venue.status] ?? venue.status}</Pill>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-small text-taupe">
            {place && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-4 text-gold-800" strokeWidth={1.5} /> {place}
              </span>
            )}
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <User aria-hidden="true" className="size-4 shrink-0 text-gold-800" strokeWidth={1.5} />
              <span className="break-all">
                {venue.owner?.name ?? "Unknown owner"}
                {venue.owner?.email ? ` (${venue.owner.email})` : ""}
              </span>
            </span>
          </div>
          <p className="mt-1 font-body text-caption text-taupe">
            {categoryLabel(venue.category)} · Listed {shortDate(venue.createdAt)}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <button type="button" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen((v) => !v)} className={linkBtn}>
              <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
              {open ? "Hide details" : "Review details"}
            </button>
            <Link to={`/venue/${venue._id}`} target="_blank" rel="noopener noreferrer" className={linkBtn}>
              <ExternalLink aria-hidden="true" className="size-4" strokeWidth={1.5} /> View on site
              <span className="sr-only"> (opens in a new tab)</span>
            </Link>
          </div>
        </div>
      </div>

      {open && (
        <div id={detailsId} className="mt-4 rounded-card-md bg-cream p-4">
          <p className="whitespace-pre-line break-words font-body text-small text-ink">
            {venue.description || "The owner has not written a description."}
          </p>
          <dl className="mt-4 grid gap-x-6 gap-y-3 font-body text-small sm:grid-cols-2">
            <div>
              <dt className="text-caption uppercase text-taupe">Address</dt>
              <dd className="break-words text-ink">{[venue.location?.address, venue.location?.state].filter(Boolean).join(", ") || "Not given"}</dd>
            </div>
            <div>
              <dt className="text-caption uppercase text-taupe">Photos</dt>
              <dd className="text-ink">{photoCount === 0 ? "None uploaded" : `${photoCount} ${photoCount === 1 ? "photo" : "photos"}`}</dd>
            </div>
            <div>
              <dt className="text-caption uppercase text-taupe">Pricing</dt>
              <dd className="text-ink">
                {cheapest > 0 ? `Packages from ${npr(cheapest)} per plate` : "No food packages yet"}
                {venue.packages?.length > 1 ? ` (${plural(venue.packages.length, "package")})` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-caption uppercase text-taupe">Business phone</dt>
              <dd className="text-ink">{venue.contactPhone || "Not given"}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <p className="font-body text-caption uppercase text-taupe">Amenities</p>
            {amenities.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <li key={a}>
                    <Pill>{a}</Pill>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 font-body text-small text-ink">None listed</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <FeaturedSwitch venue={venue} onToggle={onToggleFeatured} busy={featuredBusy} />
        {!confirm && (
          <div className="flex flex-wrap gap-3">
            {canApprove && (
              <button type="button" onClick={() => setConfirm("approved")} disabled={statusBusy} aria-label={`Approve ${venue.venueName}`} className={btnPrimary}>
                <Check aria-hidden="true" className="size-4" strokeWidth={1.5} /> Approve
              </button>
            )}
            {canReject && (
              <button type="button" onClick={() => setConfirm("rejected")} disabled={statusBusy} aria-label={`Reject ${venue.venueName}`} className={btnDanger}>
                <X aria-hidden="true" className="size-4" strokeWidth={1.5} /> Reject
              </button>
            )}
          </div>
        )}
      </div>

      {confirm && (
        <div role="alert" className={`mt-4 flex flex-wrap items-center gap-3 rounded-card-sm p-3 ${confirm === "rejected" ? "bg-red-50" : "bg-gold-50"}`}>
          <p className={`mr-auto min-w-0 break-words font-body text-small ${confirm === "rejected" ? "text-red-700" : "text-ink"}`}>{confirmText}</p>
          <button
            type="button"
            disabled={statusBusy}
            onClick={async () => {
              const ok = await onSetStatus(confirm);
              if (ok) setConfirm(null);
            }}
            className={confirm === "rejected" ? btnDanger : btnPrimary}
          >
            {statusBusy ? "Saving..." : confirm === "approved" ? "Yes, approve" : "Yes, reject"}
          </button>
          <button type="button" onClick={() => setConfirm(null)} disabled={statusBusy} className={btnOutline}>
            Cancel
          </button>
        </div>
      )}
    </li>
  );
}

const TAB_IDS = TABS.map((t) => t.id);
const tabDomId = (id) => `venue-tab-${id}`;

export default function AdminVenuePage() {
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search.trim(), 400);

  useEffect(() => {
    setPage(1);
  }, [tab, debounced]);

  const { data, isPending, isError, isFetching, refetch } = useGetVenues(page, LIMIT, tab, debounced);
  const { data: counts } = useVenueStatusCounts();
  const statusMutation = useChangeVenueStatus();
  const featuredMutation = useToggleVenueFeatured();

  const venues = data?.venues ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, data?.pages ?? 1);
  const roving = useRovingTabs({ ids: TAB_IDS, selected: tab, onSelect: setTab, idFor: tabDomId });
  const current = TABS.find((t) => t.id === tab);

  const setStatus = async (venue, status) => {
    try {
      await statusMutation.mutateAsync({ venueId: venue._id, status });
      toast.success(`${venue.venueName} was ${status}. The owner has been notified.`);
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err));
      return false;
    }
  };

  const toggleFeatured = async (venue) => {
    try {
      const updated = await featuredMutation.mutateAsync(venue._id);
      toast.success(updated?.isFeatured ? `${venue.venueName} is now featured.` : `${venue.venueName} is no longer featured.`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Moderation"
        title="Venues"
        description="Review new listings before they go live, and choose which approved venues are featured on the landing page."
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div role="tablist" aria-label="Venue status" {...roving.listProps} className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              {...roving.tabProps(t.id)}
              aria-controls="venue-panel"
              className={`min-h-11 rounded-full border px-4 py-2 font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                tab === t.id ? "border-ink bg-ink text-gold-50" : "border-line bg-white text-ink hover:border-ink"
              }`}
            >
              {t.label}
              {counts && <span className={tab === t.id ? "text-gold-200" : "text-taupe"}> ({counts[t.id]})</span>}
            </button>
          ))}
        </div>
        <div className="sm:w-72">
          <label htmlFor="venue-search" className={labelClass}>Search by venue name</label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-taupe" strokeWidth={1.5} />
            <input id="venue-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. Garden" className={`${inputClass} pl-10`} />
          </div>
        </div>
      </div>

      <Panel bodyClassName="p-0">
        <div id="venue-panel" role="tabpanel" aria-labelledby={`venue-tab-${tab}`} aria-busy={isFetching}>
          {isPending ? (
            <RowsSkeleton rows={4} />
          ) : isError ? (
            <ErrorState onRetry={refetch}>Venues could not be loaded right now.</ErrorState>
          ) : venues.length === 0 ? (
            <EmptyState icon={Building2} title={debounced ? "No matching venues" : "Nothing here"}>
              {debounced ? `No venue in this list is named like "${debounced}".` : current.empty}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {venues.map((v) => (
                <VenueRow
                  key={v._id}
                  venue={v}
                  onSetStatus={(status) => setStatus(v, status)}
                  onToggleFeatured={() => toggleFeatured(v)}
                  statusBusy={statusMutation.isPending && statusMutation.variables?.venueId === v._id}
                  featuredBusy={featuredMutation.isPending && featuredMutation.variables === v._id}
                />
              ))}
            </ul>
          )}
        </div>

        {venues.length > 0 && pages > 1 && (
          <nav aria-label="Venue pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
            <p className="font-body text-caption text-taupe" aria-live="polite">
              Page {page} of {pages} · {total} {total === 1 ? "venue" : "venues"}
            </p>
            <div className="flex gap-2">
              <button type="button" className={btnOutline} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.5} /> Previous
              </button>
              <button type="button" className={btnOutline} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </nav>
        )}
      </Panel>
    </>
  );
}
