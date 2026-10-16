import { useCallback, useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import Button from "../../components/ui/Button";
import Select from "../../components/ui/Select";
import VenueCard, { VenueCardSkeleton } from "../../features/venues/components/VenueCard";
import VenuesHero from "../../features/venues/components/VenuesHero";
import FilterPanel from "../../features/venues/components/FilterPanel";
import FilterDrawer from "../../features/venues/components/FilterDrawer";
import ActiveFilters from "../../features/venues/components/ActiveFilters";
import Pagination from "../../features/venues/components/Pagination";
import ConciergeBand from "../../features/venues/components/ConciergeBand";
import { useVenues } from "../../features/venues/hooks/useVenues";
import { PAGE_SIZE, SORT_OPTIONS, toApiFilters, useVenueFilters } from "../../features/venues/venueFilters";
import { useCategoryCounts } from "../../features/landing/hooks/useCategoryCounts";
import { rememberPendingFavorite, useFavorites, usePendingFavorite, useToggleFavorite } from "../../features/favorites/hooks/useFavorites";
import { useGoToLogin } from "../../auth/returnTo";
import { plural } from "../../utils/plural";

const sortPill = "!min-h-11 !w-auto !rounded-full !border-border-strong !bg-cream !py-2 !pl-4 !pr-3 !text-caption !text-ink";
const grid = "grid gap-6 sm:grid-cols-2 xl:grid-cols-3";

// Venue discovery. Every filter lives in the URL, so a search can be shared, bookmarked and used with the back button.
export default function VenuesPage() {
  const { filters, update, clear, chips } = useVenueFilters();
  const { page, sort } = filters;
  const { counts } = useCategoryCounts();
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const resultsRef = useRef(null);

  const { venues, total, totalPages, isPending, isFetching, isError, refetch } = useVenues(toApiFilters(filters));

  const favorites = useFavorites();
  const { ids: favoriteIds, enabled: canSave } = favorites;
  const toggle = useToggleFavorite();
  const goToLogin = useGoToLogin();
  usePendingFavorite(favorites, toggle);
  // Signed out: the heart takes the visitor to sign in, then brings them back and saves the venue.
  const onToggleFavorite = canSave
    ? toggle.mutate
    : (venueId) => {
        rememberPendingFavorite(venueId);
        goToLogin();
      };

  // A page number past the end (an old link, a shorter list) goes back to the first page.
  useEffect(() => {
    if (!isPending && !isFetching && !isError && page > 1 && venues.length === 0 && total > 0) update({ page: "" }, { replace: true });
  }, [isPending, isFetching, isError, page, venues.length, total, update]);

  const toResults = () => resultsRef.current?.scrollIntoView({ block: "start" });
  const changePage = (n) => {
    update({ page: n > 1 ? String(n) : "" });
    toResults();
  };

  const panelProps = {
    filters,
    update,
    counts,
    total,
    isCounting: isPending || isError,
    activeCount: chips.length,
    onClear: clear,
  };

  let status = "Loading venues";
  if (!isPending) {
    if (isError) status = "Venues could not be loaded";
    else if (total === 0) status = "No venues found";
    else if (totalPages > 1) status = `${plural(total, "venue")} · showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + venues.length}`;
    else status = plural(total, "venue");
  }

  return (
    <>
      <VenuesHero city={filters.city} guests={filters.guests} onChange={update} onSearch={toResults} />

      <section ref={resultsRef} aria-labelledby="results-title" className="scroll-mt-[calc(var(--spacing-header)+16px)] bg-gold-100 py-12 lg:py-16">
        <div className="container-site">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-body text-eyebrow uppercase text-gold-800">The collection</p>
              <h2 id="results-title" className="mt-3 font-display text-h2 font-light text-ink">Spaces to make your own</h2>
              <p aria-live="polite" className="mt-2 font-body text-small text-taupe">{status}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSheetOpen(true)}
                aria-haspopup="dialog"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong bg-cream px-4 font-body text-caption text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink lg:hidden"
              >
                <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.5} />
                Filters
                {chips.length > 0 && (
                  <span className="rounded-full bg-ink px-2 py-0.5 text-caption text-gold-50">
                    {chips.length}
                    <span className="sr-only"> active</span>
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2">
                <label htmlFor="v-sort" className="font-body text-caption text-taupe">Sort by</label>
                <div>
                  <Select id="v-sort" value={sort} onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })} className={sortPill}>
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-10">
            <aside
              aria-label="Filters"
              className="hidden rounded-card-md bg-cream p-6 shadow-[0_8px_24px_rgb(43_27_10/0.07)] lg:block [@media(min-height:1200px)]:lg:sticky [@media(min-height:1200px)]:lg:top-[calc(var(--spacing-header)+16px)]"
            >
              <FilterPanel idPrefix="d" {...panelProps} onShow={toResults} />
            </aside>

            <div className="min-w-0 space-y-6">
              <ActiveFilters chips={chips} onRemove={(patch) => update(patch)} onClear={clear} />

              {isPending ? (
                <ul className={grid}>{Array.from({ length: 6 }, (_, i) => <VenueCardSkeleton key={i} />)}</ul>
              ) : isError ? (
                <div role="alert" className="rounded-card-lg border border-dashed border-border-strong bg-cream p-10 text-center">
                  <p className="font-display text-h4 font-light text-ink">We could not load the venues</p>
                  <p className="mt-2 font-body text-small text-taupe">Please check your connection and try again.</p>
                  <Button type="button" className="mt-6" onClick={() => refetch()}>Try again</Button>
                </div>
              ) : venues.length === 0 ? (
                <div className="rounded-card-lg border border-dashed border-border-strong bg-cream p-10 text-center">
                  <p className="font-display text-h4 font-light text-ink">No venues match those filters</p>
                  <p className="mt-2 font-body text-small text-taupe">
                    {filters.guests ? `No venue has a space for ${plural(filters.guests, "guest")} with these filters. ` : ""}
                    Try fewer filters, a different city, a wider price range or a smaller guest count.
                  </p>
                  {chips.length > 0 && <Button type="button" variant="outline-dark" className="mt-6" onClick={clear}>Clear filters</Button>}
                </div>
              ) : (
                <ul className={`${grid} ${isFetching ? "opacity-70 transition-opacity" : ""}`}>
                  {venues.map((v) => (
                    <VenueCard key={v._id} venue={v} isFavorite={favoriteIds.has(v._id)} onToggleFavorite={onToggleFavorite} favoriteBusy={toggle.isPending && toggle.variables === v._id} />
                  ))}
                </ul>
              )}

              {!isPending && !isError && <Pagination page={page} totalPages={totalPages} total={total} shown={venues.length} pageSize={PAGE_SIZE} onPage={changePage} />}
            </div>
          </div>
        </div>
      </section>

      <ConciergeBand />

      <FilterDrawer open={sheetOpen} onClose={closeSheet}>
        <FilterPanel
          sheet
          idPrefix="m"
          {...panelProps}
          onShow={() => {
            closeSheet();
            toResults();
          }}
        />
      </FilterDrawer>
    </>
  );
}
