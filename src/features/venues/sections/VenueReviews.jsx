import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import SectionHeading from "../../../components/ui/SectionHeading";
import { useReviews } from "../../../hooks/useReviews";

const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "").replace("/api", "");

const avatarSrc = (avatar) => (!avatar ? null : /^https?:\/\//.test(avatar) ? avatar : `${API_ORIGIN}${avatar}`);

function Stars({ value, className = "size-4" }) {
  return (
    <span role="img" aria-label={`${value} out of 5 stars`} className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={`${className} ${n <= Math.round(value) ? "fill-gold text-gold" : "text-line"}`}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review }) {
  const name = review.user?.name || "Guest";
  const src = avatarSrc(review.user?.avatar);
  const date = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : "";

  return (
    <li className="flex flex-col gap-3 rounded-card-lg border border-line bg-white p-6">
      <div className="flex items-center gap-3">
        {src ? (
          <img src={src} alt="" className="size-10 rounded-full object-cover" loading="lazy" />
        ) : (
          <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-gold-100 font-display text-h5 text-gold-800">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <p className="font-body text-body text-ink">{name}</p>
          {date && <p className="font-body text-caption text-taupe">{date}</p>}
        </div>
        <div className="ml-auto">
          <Stars value={review.rating} />
        </div>
      </div>
      {review.title && <h3 className="font-display text-h5 font-normal text-ink">{review.title}</h3>}
      <p className="font-body text-small text-ink/85 [overflow-wrap:anywhere]">{review.comment}</p>
    </li>
  );
}

// Reviews are read-only here: the backend only accepts a review for a completed booking,
// so guests write theirs from "My bookings", not from the venue page.
export default function VenueReviews({ venue }) {
  const { reviews, isLoading, error } = useReviews(venue._id);
  const total = venue.totalReviews ?? reviews.length;
  const average = venue.averageRating ?? 0;
  const counts = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => Math.round(r.rating) === n).length }));
  const max = Math.max(1, ...counts.map((c) => c.count));

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-[calc(var(--spacing-header)+72px)] bg-sand py-16 lg:py-[88px]">
      <div className="container-site">
        <SectionHeading id="reviews-title" eyebrow="Guest reviews" title="What guests" accent="say about it" className="[&_h2]:text-h2" />

        {isLoading ? (
          <div role="status" aria-label="Loading reviews" className="mt-10 h-40 animate-pulse rounded-card-lg bg-gold-100" />
        ) : error ? (
          <p className="mt-10 font-body text-body text-taupe">Reviews could not be loaded right now.</p>
        ) : reviews.length === 0 ? (
          <div className="mt-10 max-w-xl rounded-card-lg border border-dashed border-line bg-cream p-8">
            <p className="font-display text-h4 font-light text-ink">No reviews yet</p>
            <p className="mt-2 font-body text-small text-taupe">
              Only guests who have completed a booking here can leave a review, so every review is from a real event.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[280px_1fr] lg:gap-12">
            <div className="flex flex-col gap-4">
              <p className="font-display text-display font-light leading-none text-ink">{Number(average).toFixed(1)}</p>
              <Stars value={average} className="size-5" />
              <p className="font-body text-small text-taupe">
                Based on {total} {total === 1 ? "review" : "reviews"}
              </p>
              <ul className="mt-2 space-y-2" aria-label="Rating breakdown">
                {counts.map(({ n, count }) => (
                  <li key={n} className="flex items-center gap-3 font-body text-caption text-taupe">
                    <span className="w-3 text-right">{n}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                      <span className="block h-full rounded-full bg-gold" style={{ width: `${(count / max) * 100}%` }} />
                    </span>
                    <span className="w-5">{count}</span>
                  </li>
                ))}
              </ul>
              <Link to="/my-bookings" className="mt-2 w-fit font-body text-small text-gold-800 underline underline-offset-4">
                Had an event here? Review it from My bookings
              </Link>
            </div>
            <ul className="grid gap-4 md:grid-cols-2">
              {reviews.map((r) => (
                <ReviewCard key={r._id} review={r} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
