import { useMemo, useState } from "react";
import { MessageCircle, Star, ThumbsUp } from "lucide-react";
import { EmptyState, ErrorState, PageHeader, Panel, RowsSkeleton, Stat } from "../../components/dashboard/ui";
import { shortDate } from "../../components/dashboard/styles";
import { inputClass, labelClass } from "../../components/ui/formStyles";
import { useOwnerVenueReviews } from "../../hooks/owner/useOwnerVenueReviews";

const avatarBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace("/api", "");

// Five stars, filled up to the rating. The text label carries the meaning, the icons are decoration.
function Stars({ rating, size = "size-4" }) {
  const filled = Math.round(rating);
  return (
    <span role="img" aria-label={`${Number(rating).toFixed(Number.isInteger(rating) ? 0 : 1)} out of 5 stars`} className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} aria-hidden="true" className={`${size} ${i < filled ? "fill-gold text-gold" : "text-border-strong"}`} />
      ))}
    </span>
  );
}

function Avatar({ user }) {
  const initial = (user?.name ?? "?").charAt(0).toUpperCase();
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-100 font-display text-h5 font-light text-gold-800">
      {initial}
      {user?.avatar && (
        <img
          src={`${avatarBaseUrl}${user.avatar}`}
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
    </span>
  );
}

export default function OwnerVenueReviewsPage() {
  const { data, isPending, isError, refetch } = useOwnerVenueReviews();
  const [search, setSearch] = useState("");
  const [venueFilter, setVenueFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");

  const venues = useMemo(() => data ?? [], [data]);
  const totalReviews = venues.reduce((s, v) => s + (v.totalReviews ?? v.reviews?.length ?? 0), 0);
  const allReviews = venues.flatMap((v) => v.reviews ?? []);
  const overall = allReviews.length ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length : 0;
  const fiveStar = allReviews.filter((r) => r.rating === 5).length;

  const q = search.trim().toLowerCase();
  const shown = useMemo(
    () =>
      venues
        .filter((v) => venueFilter === "all" || v._id === venueFilter)
        .map((v) => ({
          ...v,
          visible: (v.reviews ?? []).filter(
            (r) =>
              (ratingFilter === "all" || r.rating === Number(ratingFilter)) &&
              (!q || `${r.comment ?? ""} ${r.user?.name ?? ""}`.toLowerCase().includes(q)),
          ),
        })),
    [venues, venueFilter, ratingFilter, q],
  );
  const filtering = q || ratingFilter !== "all";
  const matchCount = shown.reduce((s, v) => s + v.visible.length, 0);

  return (
    <>
      <PageHeader eyebrow="Reviews" title="What guests say" description="Reviews from customers whose events took place at your venues." />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Reviews" value={totalReviews} hint="Across all your venues" icon={MessageCircle} loading={isPending} />
        <Stat label="Average rating" value={allReviews.length ? overall.toFixed(1) : "None yet"} hint={allReviews.length ? "Out of 5" : "No reviews to average"} icon={Star} loading={isPending} />
        <Stat label="Five-star reviews" value={fiveStar} hint="Guests who loved it" icon={ThumbsUp} loading={isPending} />
      </div>

      {isPending ? (
        <Panel className="mt-6" bodyClassName="p-0">
          <RowsSkeleton rows={3} />
        </Panel>
      ) : isError ? (
        <Panel className="mt-6" bodyClassName="p-0">
          <ErrorState onRetry={refetch} />
        </Panel>
      ) : venues.length === 0 ? (
        <Panel className="mt-6" bodyClassName="p-0">
          <EmptyState icon={MessageCircle} title="No reviews yet">
            Once guests review an event at one of your venues, their feedback shows up here.
          </EmptyState>
        </Panel>
      ) : (
        <>
          <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-6 grid gap-4 rounded-card-lg border border-line bg-white p-5 sm:grid-cols-3">
            <div>
              <label htmlFor="review-search" className={labelClass}>Search</label>
              <input id="review-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Guest name or words in the review" className={inputClass} />
            </div>
            <div>
              <label htmlFor="review-venue" className={labelClass}>Venue</label>
              <select id="review-venue" value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)} className={inputClass}>
                <option value="all">All venues</option>
                {venues.map((v) => (
                  <option key={v._id} value={v._id}>{v.venueName}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="review-rating" className={labelClass}>Rating</label>
              <select id="review-rating" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className={inputClass}>
                <option value="all">All ratings</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "star" : "stars"}</option>
                ))}
              </select>
            </div>
          </form>

          <p role="status" className="sr-only">{matchCount} {matchCount === 1 ? "review" : "reviews"} shown</p>

          <div className="mt-6 space-y-6">
            {shown.map((v) => (
              <Panel
                key={v._id}
                title={v.venueName}
                description={`${v.totalReviews ?? v.reviews?.length ?? 0} ${(v.totalReviews ?? v.reviews?.length) === 1 ? "review" : "reviews"}`}
                bodyClassName="p-0"
                action={
                  v.reviews?.length ? (
                    <div className="flex items-center gap-2">
                      <Stars rating={v.averageRating} />
                      <span className="font-display text-h5 font-light text-ink">{Number(v.averageRating).toFixed(1)}</span>
                    </div>
                  ) : null
                }
              >
                {v.visible.length === 0 ? (
                  <EmptyState icon={MessageCircle} title={filtering ? "No reviews match" : "No reviews yet"}>
                    {filtering ? "Try a different search or rating." : "Reviews will appear here once guests leave feedback."}
                  </EmptyState>
                ) : (
                  <ul className="divide-y divide-line">
                    {v.visible.map((r) => (
                      <li key={r._id} className="flex gap-4 px-6 py-5">
                        <Avatar user={r.user} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                            <p className="font-body text-body text-ink">{r.user?.name ?? "Guest"}</p>
                            <time dateTime={r.createdAt} className="font-body text-caption text-taupe">{shortDate(r.createdAt)}</time>
                          </div>
                          <div className="mt-1"><Stars rating={r.rating} /></div>
                          {r.comment && <p className="mt-2 break-words font-body text-small text-ink">{r.comment}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            ))}
          </div>
        </>
      )}
    </>
  );
}
