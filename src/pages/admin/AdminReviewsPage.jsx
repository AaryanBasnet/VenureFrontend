import { useEffect, useId, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, MessageCircle, Search, SearchX, Star, Trash2 } from "lucide-react";
import { EmptyState, ErrorState, PageHeader, Panel, Pill, RowsSkeleton } from "../../components/dashboard/ui";
import { btnDanger, btnOutline, shortDate } from "../../components/dashboard/styles";
import { inputClass, labelClass } from "../../components/ui/formStyles";
import { useDebounce } from "../../hooks/useDebounce";
import { useAdminReviews } from "../../hooks/admin/useAdminReviews";
import { useToggleReviewFeatured } from "../../hooks/admin/useToggleReviewFeatured";
import { useDeleteReview } from "../../hooks/admin/useDeleteReview";
import Select from "../../components/ui/Select";

const LIMIT = 10;
const avatarBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace("/api", "");
const FILTERS = [
  { value: "", label: "All" },
  { value: "true", label: "Featured" },
  { value: "false", label: "Not featured" },
];

function Stars({ rating }) {
  return (
    <span role="img" aria-label={`${rating} out of 5 stars`} className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} aria-hidden="true" className={`size-4 ${i < rating ? "fill-gold text-gold" : "text-border-strong"}`} />
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

function FeatureSwitch({ isFeatured, pending, onToggle }) {
  const id = useId();
  const on = Boolean(isFeatured);
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={on}
        aria-labelledby={`${id}-label`}
        disabled={pending}
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50 ${
          on ? "border-ink bg-ink" : "border-border-strong bg-sand"
        }`}
      >
        <span aria-hidden="true" className={`inline-block size-4 rounded-full transition-transform ${on ? "translate-x-6 bg-gold-50" : "translate-x-1 bg-taupe"}`} />
      </button>
      <label id={`${id}-label`} htmlFor={id} className="cursor-pointer font-body text-small text-ink">
        Show on the landing page
      </label>
    </div>
  );
}

function ReviewCard({ review, onToggle, toggling, toggleFailed, onDelete, deleting, deleteFailed }) {
  const [confirming, setConfirming] = useState(false);
  const venue = review.venue;
  const lowRating = review.isFeatured && review.rating < 4;

  return (
    <li className="px-4 py-5 sm:px-6">
      <div className="flex gap-4">
        <Avatar user={review.user} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="font-body text-body text-ink">{review.user?.name ?? "Deleted account"}</p>
            <time dateTime={review.createdAt} className="font-body text-caption text-taupe">{shortDate(review.createdAt)}</time>
          </div>
          <p className="mt-0.5 font-body text-small text-taupe">
            {venue ? (
              <Link to={`/venue/${venue._id}`} className="text-gold-800 underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                {venue.venueName}
              </Link>
            ) : (
              "Venue no longer listed"
            )}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Stars rating={review.rating} />
            {review.isFeatured && <Pill tone="gold">Featured</Pill>}
          </div>
          {review.title && <p className="mt-2 break-words font-display text-h5 font-light text-ink">{review.title}</p>}
          <p className="mt-1 break-words font-body text-small text-ink">{review.comment}</p>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <FeatureSwitch isFeatured={review.isFeatured} pending={toggling} onToggle={onToggle} />
            {!confirming && (
              <button type="button" onClick={() => setConfirming(true)} className={`${btnDanger} !px-4 !py-2`}>
                <Trash2 aria-hidden="true" className="size-4" /> Delete
              </button>
            )}
          </div>

          {lowRating && (
            <p className="mt-2 font-body text-caption text-taupe">
              Only reviews rated 4 stars or more are shown on the landing page, so this one stays hidden there.
            </p>
          )}
          {toggleFailed && <p role="alert" className="mt-2 font-body text-small text-red-700">We could not change this review. Please try again.</p>}

          {confirming && (
            <div role="alertdialog" aria-label="Confirm deleting this review" className="mt-4 rounded-card-md border border-red-300 bg-red-50 p-4 font-body text-small text-ink">
              <p>Delete this review by {review.user?.name ?? "this guest"}? It is removed for good and the venue&apos;s rating is recalculated.</p>
              {deleteFailed && <p role="alert" className="mt-2 text-red-700">We could not delete it. Please try again.</p>}
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" onClick={onDelete} disabled={deleting} className={btnDanger}>
                  {deleting ? "Deleting..." : "Yes, delete"}
                </button>
                <button type="button" onClick={() => setConfirming(false)} disabled={deleting} className={btnOutline}>
                  Keep review
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

export default function AdminReviewsPage() {
  const [params, setParams] = useSearchParams();
  const featured = ["true", "false"].includes(params.get("featured")) ? params.get("featured") : "";
  const rating = ["1", "2", "3", "4", "5"].includes(params.get("rating")) ? params.get("rating") : "";
  const urlSearch = params.get("q") ?? "";
  const page = Math.max(parseInt(params.get("page")) || 1, 1);

  const [text, setText] = useState(urlSearch);
  const search = useDebounce(text.trim(), 400);
  const searchId = useId();
  const ratingId = useId();

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (search !== urlSearch) update({ q: search, page: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const { data, isPending, isError, refetch } = useAdminReviews({ page, limit: LIMIT, rating, featured, search: urlSearch });
  const toggle = useToggleReviewFeatured();
  const remove = useDeleteReview();

  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(data?.pages ?? 1, 1);
  const filtered = Boolean(urlSearch || rating || featured);
  const from = (page - 1) * LIMIT + 1;
  const to = Math.min(page * LIMIT, total);

  const clear = () => {
    setText("");
    setParams({}, { replace: true });
  };

  return (
    <>
      <PageHeader
        eyebrow="Moderation"
        title="Reviews"
        description={'Featured reviews appear under "What guests say" on the home page. A few good ones are enough, and only reviews rated 4 stars or more are shown there.'}
      />

      <div className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="w-full sm:max-w-sm">
          <label htmlFor={searchId} className={labelClass}>Search reviews</label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-taupe" />
            <input id={searchId} type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Words, guest or venue name" className={`${inputClass} pl-11`} />
          </div>
        </div>
        <div className="w-full sm:w-44">
          <label htmlFor={ratingId} className={labelClass}>Rating</label>
          <Select id={ratingId} value={rating} onChange={(e) => update({ rating: e.target.value, page: "" })} className={inputClass}>
            <option value="">All ratings</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} {n === 1 ? "star" : "stars"}</option>
            ))}
          </Select>
        </div>
        <div role="group" aria-label="Show reviews" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = featured === f.value;
            return (
              <button
                key={f.label}
                type="button"
                aria-pressed={active}
                onClick={() => update({ featured: f.value, page: "" })}
                className={`rounded-full border px-4 py-2.5 font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                  active ? "border-ink bg-ink text-gold-50" : "border-border-strong text-ink hover:border-ink hover:bg-ink/5"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <Panel bodyClassName="p-0">
        {isPending ? (
          <RowsSkeleton rows={4} />
        ) : isError ? (
          <ErrorState onRetry={refetch}>We could not load the reviews. Please try again.</ErrorState>
        ) : reviews.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={SearchX}
              title="No reviews match"
              action={<button type="button" onClick={clear} className={btnOutline}>Clear filters</button>}
            >
              Try a different search, rating or filter.
            </EmptyState>
          ) : (
            <EmptyState icon={MessageCircle} title="No reviews yet">
              Guests can review a venue once their event is completed. Their reviews will show up here.
            </EmptyState>
          )
        ) : (
          <>
            <ul className="divide-y divide-line">
              {reviews.map((r) => (
                <ReviewCard
                  key={r._id}
                  review={r}
                  onToggle={() => toggle.mutate(r._id)}
                  toggling={toggle.isPending && toggle.variables === r._id}
                  toggleFailed={toggle.isError && toggle.variables === r._id}
                  onDelete={() => remove.mutate(r._id)}
                  deleting={remove.isPending && remove.variables === r._id}
                  deleteFailed={remove.isError && remove.variables === r._id}
                />
              ))}
            </ul>
            <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-4 sm:px-6">
              <p className="font-body text-small text-taupe" aria-live="polite">
                {from}-{to} of {total} {total === 1 ? "review" : "reviews"}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => update({ page: page - 1 > 1 ? String(page - 1) : "" })} disabled={page <= 1} className={`${btnOutline} !px-4 !py-2`}>
                  <ChevronLeft aria-hidden="true" className="size-4" /> Previous
                </button>
                <span className="px-2 font-body text-small text-taupe">Page {page} of {totalPages}</span>
                <button type="button" onClick={() => update({ page: String(page + 1) })} disabled={page >= totalPages} className={`${btnOutline} !px-4 !py-2`}>
                  Next <ChevronRight aria-hidden="true" className="size-4" />
                </button>
              </div>
            </nav>
          </>
        )}
      </Panel>
    </>
  );
}
