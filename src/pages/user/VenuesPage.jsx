import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import PageHero from "../../components/ui/PageHero";
import Button from "../../components/ui/Button";
import { inputClass, labelClass } from "../../components/ui/formStyles";
import VenueCard, { VenueCardSkeleton } from "../../features/venues/components/VenueCard";
import { useVenues } from "../../features/venues/hooks/useVenues";
import { useFavorites, useToggleFavorite } from "../../features/favorites/hooks/useFavorites";
import Select from "../../components/ui/Select";
import { venueTypes } from "../../features/landing/content/landingContent";
import { images } from "../../assets/landing/images";

const PAGE_SIZE = 9;
const CITIES = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Nagarkot", "Dhulikhel", "Chitwan"];
const AMENITIES = ["Wifi", "Parking", "Air Conditioning", "Catering", "Sound System", "Garden", "Projector"];

const chip = (active) =>
  `rounded-full border px-4 py-2 font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
    active ? "border-ink bg-ink text-gold-50" : "border-border-strong bg-paper-white text-ink hover:border-ink"
  }`;

// Venue discovery. Every filter lives in the URL, so a search can be shared, bookmarked and used with the back button.
export default function VenuesPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const city = params.get("city") ?? "";
  const category = params.get("category") ?? "";
  const guests = params.get("guests") ?? "";
  const sort = params.get("sort") ?? "newest";
  const amenities = (params.get("amenities") ?? "").split(",").filter(Boolean);
  const page = Math.max(parseInt(params.get("page")) || 1, 1);

  const [search, setSearch] = useState(q);
  const [showMore, setShowMore] = useState(amenities.length > 0);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    if (!("page" in patch)) next.delete("page");
    setParams(next, { replace: true });
  };

  // Typing in the search box updates the URL after a short pause.
  useEffect(() => {
    if (search === q) return undefined;
    const t = setTimeout(() => update({ q: search.trim() }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filters = useMemo(
    () => ({
      search: q || undefined,
      city: city || undefined,
      category: category || undefined,
      guests: guests || undefined,
      amenities: amenities.join(",") || undefined,
      sort: sort === "rating" ? "rating" : undefined,
      page,
      limit: PAGE_SIZE,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, city, category, guests, params.get("amenities"), sort, page]
  );
  const { venues, totalPages, isPending, isFetching, isError } = useVenues(filters);

  const { ids: favoriteIds, enabled: canSave } = useFavorites();
  const toggle = useToggleFavorite();

  const active = [q, city, category, guests, amenities.length ? "x" : "", sort !== "newest" ? "x" : ""].filter(Boolean).length;
  const clear = () => {
    setSearch("");
    setParams({}, { replace: true });
  };
  const toggleAmenity = (name) => update({ amenities: (amenities.includes(name) ? amenities.filter((a) => a !== name) : [...amenities, name]).join(",") });

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1);

  return (
    <>
      <PageHero image={images.heritageCourtyards} eyebrow="Venues" title="Find a place" accent="worth gathering in" id="venues-title" compact>
        Heritage courtyards, garden estates and mountain retreats across Nepal. Filter by guests, place and what you need.
      </PageHero>

      <section aria-label="Filters" className="border-b border-line bg-cream py-8">
        <div className="container-site space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <label htmlFor="v-search" className={labelClass}>Search by name</label>
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-taupe-light" />
                <input id="v-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. Garden Hall" className={`${inputClass} pl-11`} />
              </div>
            </div>
            <div>
              <label htmlFor="v-city" className={labelClass}>Where</label>
              <Select id="v-city" value={city} onChange={(e) => update({ city: e.target.value })}>
                <option value="">Anywhere in Nepal</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </div>
            <div>
              <label htmlFor="v-guests" className={labelClass}>Guests</label>
              <input id="v-guests" type="number" min="1" inputMode="numeric" value={guests} onChange={(e) => update({ guests: e.target.value })} placeholder="How many?" className={inputClass} />
            </div>
            <div>
              <label htmlFor="v-sort" className={labelClass}>Sort by</label>
              <Select id="v-sort" value={sort} onChange={(e) => update({ sort: e.target.value === "newest" ? "" : e.target.value })}>
                <option value="newest">Newest</option>
                <option value="rating">Top rated</option>
              </Select>
            </div>
          </div>

          <fieldset>
            <legend className={labelClass}>Type of venue</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={!category} onClick={() => update({ category: "" })} className={chip(!category)}>All</button>
              {venueTypes.map((t) => (
                <button key={t.slug} type="button" aria-pressed={category === t.slug} onClick={() => update({ category: category === t.slug ? "" : t.slug })} className={chip(category === t.slug)}>
                  {t.name}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <button type="button" onClick={() => setShowMore((s) => !s)} aria-expanded={showMore} className="inline-flex items-center gap-2 font-body text-small text-gold-800 hover:text-ink">
              <SlidersHorizontal aria-hidden="true" className="size-4" strokeWidth={1.5} /> {showMore ? "Fewer filters" : "More filters"}
              {amenities.length > 0 && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-caption">{amenities.length}</span>}
            </button>
            {showMore && (
              <fieldset className="mt-4">
                <legend className={labelClass}>The venue should have</legend>
                <div className="flex flex-wrap gap-2">
                  {AMENITIES.map((a) => (
                    <button key={a} type="button" aria-pressed={amenities.includes(a)} onClick={() => toggleAmenity(a)} className={chip(amenities.includes(a))}>{a}</button>
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        </div>
      </section>

      <section aria-label="Results" className="bg-cream py-12 lg:py-16">
        <div className="container-site">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3" aria-live="polite">
            <p className="font-body text-small text-taupe">
              {isPending ? "Loading venues" : isError ? "Venues could not be loaded" : `${venues.length} ${venues.length === 1 ? "venue" : "venues"} on this page${totalPages > 1 ? ` (page ${page} of ${totalPages})` : ""}`}
            </p>
            {active > 0 && <button type="button" onClick={clear} className="font-body text-small text-gold-800 underline underline-offset-4 hover:text-ink">Clear all filters</button>}
          </div>

          {isPending ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <VenueCardSkeleton key={i} />)}</ul>
          ) : isError ? (
            <div className="rounded-card-xl border border-dashed border-line bg-white p-10 text-center">
              <p className="font-display text-h4 font-light text-ink">We could not load the venues</p>
              <p className="mt-2 font-body text-small text-taupe">Please check your connection and try again.</p>
              <Button type="button" className="mt-6" onClick={() => window.location.reload()}>Reload</Button>
            </div>
          ) : venues.length === 0 ? (
            <div className="rounded-card-xl border border-dashed border-line bg-white p-10 text-center">
              <p className="font-display text-h4 font-light text-ink">No venues match those filters</p>
              <p className="mt-2 font-body text-small text-taupe">Try fewer filters, a different city, or a smaller guest count.</p>
              {active > 0 && <Button type="button" variant="outline-dark" className="mt-6" onClick={clear}>Clear filters</Button>}
            </div>
          ) : (
            <ul className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? "opacity-70 transition-opacity" : ""}`}>
              {venues.map((v) => (
                <VenueCard key={v._id} venue={v} isFavorite={favoriteIds.has(v._id)} onToggleFavorite={canSave ? toggle.mutate : undefined} favoriteDisabled={toggle.isPending} />
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <nav aria-label="Pages" className="mt-12 flex items-center justify-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} aria-label="Previous page" className="flex size-11 items-center justify-center rounded-full border border-border-strong text-ink hover:border-ink disabled:opacity-40"><ChevronLeft aria-hidden="true" className="size-5" /></button>
              {pageNumbers.map((n, i) => (
                <span key={n} className="flex items-center gap-2">
                  {i > 0 && n - pageNumbers[i - 1] > 1 && <span aria-hidden="true" className="text-taupe">…</span>}
                  <button type="button" aria-current={n === page ? "page" : undefined} onClick={() => update({ page: String(n) })} className={`flex size-11 items-center justify-center rounded-full border font-body text-small ${n === page ? "border-ink bg-ink text-gold-50" : "border-border-strong text-ink hover:border-ink"}`}>{n}</button>
                </span>
              ))}
              <button type="button" disabled={page >= totalPages} onClick={() => update({ page: String(page + 1) })} aria-label="Next page" className="flex size-11 items-center justify-center rounded-full border border-border-strong text-ink hover:border-ink disabled:opacity-40"><ChevronRight aria-hidden="true" className="size-5" /></button>
            </nav>
          )}

          {!canSave && venues.length > 0 && (
            <p className="mt-10 text-center font-body text-small text-taupe">
              Want to save venues for later? <Link to="/login" className="text-gold-800 underline underline-offset-4">Sign in</Link> to use favorites.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
