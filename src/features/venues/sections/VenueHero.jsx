import { MapPin, Star } from "lucide-react";
import { cloudinaryTransform } from "../../../utils/cloudinary";
import { categoryLabel, locationLine, priceFormatter, tagline } from "../venueFormat";

const HERO_TRANSFORM = "f_auto,q_auto,w_1800,c_limit";

function Stat({ value, label }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-1 font-body text-eyebrow uppercase text-gold-200">{label}</dt>
      <dd className="font-body text-body-lg text-gold-50">{value}</dd>
    </div>
  );
}

// Figma 385:316 hero. Stats come from real data (spaces, rating); the Figma's
// distance/altitude stats need venue fields the backend does not have yet.
export default function VenueHero({ venue, maxCapacity, spaceCount, fromPlate, onCheckDate }) {
  const photo = venue.venueImages?.[0]?.url;
  const category = categoryLabel(venue.category);
  const hasRating = venue.totalReviews > 0;

  return (
    <section aria-labelledby="venue-title" className="relative isolate overflow-hidden bg-ink text-gold-50">
      {photo && (
        <img
          src={cloudinaryTransform(photo, HERO_TRANSFORM)}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-20 size-full object-cover"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-44 bg-gradient-to-b from-black/60 to-transparent" />

      <div className="container-site flex min-h-[560px] flex-col justify-end pb-10 pt-[calc(var(--spacing-header)+3rem)] lg:min-h-[640px]">
        <div className="flex flex-wrap gap-2">
          {category && (
            <span className="rounded-full border border-white/30 px-3 py-1 font-body text-eyebrow uppercase">{category}</span>
          )}
          {venue.location?.city && (
            <span className="rounded-full border border-white/30 px-3 py-1 font-body text-eyebrow uppercase">
              {venue.location.city}
            </span>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 id="venue-title" className="font-display text-display font-light">
              {venue.venueName}
            </h1>
            <p className="mt-4 flex items-center gap-2 font-body text-body text-gold-50">
              <MapPin aria-hidden="true" className="size-4 text-gold" />
              {locationLine(venue.location)}
            </p>
            {venue.description && (
              <p className="mt-3 max-w-xl font-body text-body text-gold-50/90">{tagline(venue.description)}</p>
            )}
          </div>

          <div className="hidden shrink-0 flex-col items-end gap-3 lg:flex">
            {fromPlate > 0 && (
              <p className="text-right font-body text-small text-gold-200">
                From <span className="font-display text-h3 font-light text-gold-50">NPR {priceFormatter.format(fromPlate)}</span> per plate
                <span className="block text-caption">The venue sends the final quote.</span>
              </p>
            )}
            <button
              type="button"
              onClick={onCheckDate}
              className="rounded-full border border-gold-50/70 px-7 py-3 font-body text-button uppercase transition-colors hover:bg-gold-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Request a date →
            </button>
          </div>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-white/20 pt-6 lg:grid-cols-4">
          <Stat value={maxCapacity ? `Up to ${maxCapacity}` : "—"} label="Guests" />
          <Stat value={spaceCount ? `${spaceCount} ${spaceCount === 1 ? "space" : "spaces"}` : "—"} label="Halls & spaces" />
          <Stat
            value={
              hasRating ? (
                <span className="inline-flex items-center gap-1.5">
                  <Star aria-hidden="true" className="size-4 fill-gold text-gold" />
                  {venue.averageRating.toFixed(1)}
                </span>
              ) : (
                "New"
              )
            }
            label={hasRating ? `${venue.totalReviews} reviews` : "No reviews yet"}
          />
          <Stat value={category ?? "Venue"} label="Type" />
        </dl>
      </div>
    </section>
  );
}
