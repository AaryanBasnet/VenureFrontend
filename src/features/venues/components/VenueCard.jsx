import { Link } from "react-router-dom";
import { Heart, Star, Users } from "lucide-react";
import VenueImage from "./VenueImage";
import { cloudinaryTransform, CARD_TRANSFORM } from "../../../utils/cloudinary";
import { categoryLabel, cheapestPlatePrice, priceFormatter } from "../venueFormat";
import { plural } from "../../../utils/plural";

const NEW_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

// Tags come only from real data: NEW = listed in the last 30 days; POPULAR = at least 3 reviews averaging 4.5 or more.
const venueTag = (venue) => {
  if (venue.totalReviews >= 3 && venue.averageRating >= 4.5) return "Popular";
  const created = Date.parse(venue.createdAt);
  return Number.isFinite(created) && Date.now() - created < NEW_DAYS * DAY ? "New" : null;
};

export function VenueCardSkeleton() {
  return <li aria-hidden="true" className="aspect-[4/3.6] animate-pulse sm:aspect-[4/4.4] rounded-card-lg bg-gold-200" />;
}

// Photo card with the details on a dark glass panel. The whole card links to the venue; the heart sits above that link.
export default function VenueCard({ venue, isFavorite = false, onToggleFavorite, favoriteBusy = false }) {
  const photo = venue.venueImages?.[0]?.url;
  const category = categoryLabel(venue.category);
  const from = cheapestPlatePrice(venue);
  const hasRating = venue.totalReviews > 0;
  const tag = venueTag(venue);

  return (
    <li className="group relative isolate flex aspect-[4/3.6] flex-col sm:aspect-[4/4.4] justify-end overflow-hidden rounded-card-lg bg-ink outline-ink transition-shadow duration-300 hover:shadow-xl has-[a:focus-visible]:shadow-xl has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2">
      <VenueImage
        src={photo ? cloudinaryTransform(photo, CARD_TRANSFORM) : null}
        loading="lazy"
        iconClassName="size-10"
        className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[rgb(10_6_3/0.25)] via-transparent via-40% to-[rgb(10_6_3/0.7)]" />

      {tag && (
        <span className="absolute left-4 top-4 rounded-full bg-ink/75 px-3 py-1 font-body text-eyebrow uppercase text-gold-50 backdrop-blur">{tag}</span>
      )}

      <div className="m-3 rounded-card-md border border-white/20 bg-ink/45 px-4 py-3.5 text-white backdrop-blur-md">
        <div className="min-w-0">
          <p className="truncate font-body text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-gold-200">{venue.location?.city || "Nepal"}</p>
          <h2 className="mt-1 font-display text-h5 font-normal leading-tight [overflow-wrap:anywhere]">
            <Link to={`/venue/${venue._id}`} className="line-clamp-2 after:absolute after:inset-0 after:z-0 focus-visible:outline-none">
              {venue.venueName}
            </Link>
          </h2>
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
            {from > 0 ? (
              <>
                <span className="font-body text-caption text-white/75">From</span>
                <span className="font-display text-h5 font-normal leading-tight">NPR {priceFormatter.format(from)}</span>
                <span className="font-body text-caption text-white/75">per plate</span>
              </>
            ) : (
              <span className="font-body text-caption text-white/75">Price on request</span>
            )}
          </p>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-caption text-white/85">
          {venue.maxCapacity > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Users aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.5} />
              <span>
                {category ? `${category} · ` : ""}Up to {venue.maxCapacity} {venue.maxCapacity === 1 ? "guest" : "guests"}
                {venue.spaceCount > 1 && ` · ${plural(venue.spaceCount, "space")}`}
              </span>
            </span>
          ) : (
            <span>
              {category ? `${category} · ` : ""}
              {venue.maxCapacity === 0 ? "Spaces coming soon" : ""}
            </span>
          )}
          {hasRating && (
            <span className="inline-flex items-center gap-1">
              <Star aria-hidden="true" className="size-3.5 fill-gold text-gold" />
              <span className="sr-only">Rated </span>
              {venue.averageRating.toFixed(1)}
              <span className="text-white/70">
                <span aria-hidden="true">({venue.totalReviews})</span>
                <span className="sr-only"> out of 5 from {venue.totalReviews} {venue.totalReviews === 1 ? "review" : "reviews"}</span>
              </span>
            </span>
          )}
        </div>
      </div>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={() => onToggleFavorite(venue._id)}
          disabled={favoriteBusy}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remove ${venue.venueName} from favorites` : `Save ${venue.venueName} to favorites`}
          className="absolute right-3 top-3 z-10 flex size-11 items-center justify-center rounded-full bg-ink/45 text-white backdrop-blur transition-colors hover:bg-ink/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
        >
          <Heart aria-hidden="true" className={`size-5 ${isFavorite ? "fill-gold text-gold" : ""}`} strokeWidth={1.5} />
        </button>
      )}
    </li>
  );
}
