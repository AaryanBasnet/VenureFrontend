import { Link } from "react-router-dom";
import { Heart, MapPin, Star, Users } from "lucide-react";
import ResponsiveImage from "../../../components/ui/ResponsiveImage";
import { images } from "../../../assets/landing/images";
import { cloudinaryTransform, CARD_TRANSFORM } from "../../../utils/cloudinary";
import { categoryLabel, cheapestPlatePrice, locationLine, priceFormatter } from "../venueFormat";

export function VenueCardSkeleton() {
  return (
    <li aria-hidden="true" className="overflow-hidden rounded-card-xl border border-line bg-white">
      <div className="aspect-[4/3] animate-pulse bg-gold-100" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-2/3 animate-pulse rounded bg-gold-100" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gold-100" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-gold-100" />
      </div>
    </li>
  );
}

// Venue card for the listing and favorites pages. The whole card links to the venue; the heart sits above that link.
export default function VenueCard({ venue, isFavorite = false, onToggleFavorite, favoriteDisabled = false }) {
  const photo = venue.venueImages?.[0]?.url;
  const category = categoryLabel(venue.category);
  const from = cheapestPlatePrice(venue);
  const hasRating = venue.totalReviews > 0;

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-card-xl border border-line bg-white transition-shadow duration-300 hover:shadow-xl focus-within:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {photo ? (
          <img
            src={cloudinaryTransform(photo, CARD_TRANSFORM)}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <ResponsiveImage image={images.heritageCourtyards} alt="" sizes="400px" className="size-full object-cover opacity-70" />
        )}
        {category && (
          <span className="absolute left-4 top-4 rounded-full bg-ink/75 px-3 py-1 font-body text-eyebrow uppercase text-gold-50 backdrop-blur">
            {category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-h4 font-light text-ink">
          <Link
            to={`/venue/${venue._id}`}
            className="after:absolute after:inset-0 after:z-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            {venue.venueName}
          </Link>
        </h3>
        <p className="mt-2 flex items-center gap-1.5 font-body text-small text-taupe">
          <MapPin aria-hidden="true" className="size-4 shrink-0 text-gold-800" strokeWidth={1.5} />
          <span className="truncate">{locationLine(venue.location)}</span>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-small text-ink">
          {venue.maxCapacity > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Users aria-hidden="true" className="size-4 text-gold-800" strokeWidth={1.5} />
              Up to {venue.maxCapacity} guests
              {venue.spaceCount > 1 && <span className="text-taupe">· {venue.spaceCount} spaces</span>}
            </span>
          ) : (
            <span className="text-taupe">Spaces coming soon</span>
          )}
          {hasRating && (
            <span className="inline-flex items-center gap-1">
              <Star aria-hidden="true" className="size-4 fill-gold text-gold" />
              {venue.averageRating.toFixed(1)} <span className="text-taupe">({venue.totalReviews})</span>
            </span>
          )}
        </div>

        <p className="mt-auto pt-5 font-body text-small text-taupe">
          {from > 0 ? (
            <>
              From <span className="font-display text-h5 font-normal text-ink">NPR {priceFormatter.format(from)}</span> per plate
            </>
          ) : (
            "Request a quotation"
          )}
        </p>
      </div>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={() => onToggleFavorite(venue._id)}
          disabled={favoriteDisabled}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remove ${venue.venueName} from favorites` : `Save ${venue.venueName} to favorites`}
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-cream/90 text-ink shadow transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
        >
          <Heart aria-hidden="true" className={`size-5 ${isFavorite ? "fill-gold-800 text-gold-800" : ""}`} strokeWidth={1.5} />
        </button>
      )}
    </li>
  );
}
