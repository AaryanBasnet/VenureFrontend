import { Link } from "react-router-dom";
import ResponsiveImage from "../../../components/ui/ResponsiveImage";
import { images } from "../../../assets/landing/images";

import { cheapestPlatePrice, priceFormatter } from "../../venues/venueFormat";

/**
 * Featured venue card (Figma component 117:7364). Shows name + location/guests by
 * default; on lg+ (mouse-driven) screens, hover/focus reveals price + an Enquire
 * link inside the same glass panel. Below lg (touch), the row is visible from the
 * start, same simplification VenueTypeCard uses for hover-vs-touch.
 */
export default function FeaturedVenueCard({ venue, fallbackImage, imageSizes, className = "" }) {
  const photo = venue.venueImages?.[0]?.url;
  const location = [venue.location?.city, venue.location?.state].filter(Boolean).join(", ");

  return (
    <li className={`group relative isolate overflow-hidden rounded-card-xl bg-ink ${className}`}>
      {photo ? (
        <img src={photo} alt="" className="absolute inset-0 -z-20 size-full object-cover" loading="lazy" />
      ) : (
        <ResponsiveImage
          image={images[fallbackImage]}
          alt=""
          sizes={imageSizes}
          className="absolute inset-0 -z-20 size-full object-cover"
        />
      )}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-black/0 from-40% to-black/50" />

      <div className="absolute inset-x-4 bottom-4 rounded-[23px] border border-white/10 bg-black/5 p-5 backdrop-blur-md">
        <h3 className="font-display text-h5 font-normal text-gold-50">
          <Link
            to={`/venue/${venue._id}`}
            className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {venue.venueName}
          </Link>
        </h3>
        <p className="mt-2 font-body text-caption font-light text-white">
          {location}
          {venue.capacity ? ` · ${venue.capacity} guests` : ""}
        </p>

        <div className="grid grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none lg:grid-rows-[0fr] lg:group-hover:grid-rows-[1fr] lg:group-focus-within:grid-rows-[1fr]">
          <div className="flex min-h-0 items-center justify-between overflow-hidden pt-4 lg:pt-0 lg:group-hover:pt-4 lg:group-focus-within:pt-4">
            {cheapestPlatePrice(venue) > 0 ? (
              <span className="font-body text-body text-gold">
                From NPR {priceFormatter.format(cheapestPlatePrice(venue))} per plate
              </span>
            ) : (
              <span />
            )}
            <Link
              to={`/venue/${venue._id}/inquire`}
              className="relative z-10 rounded-full bg-gold px-4 py-2 font-body text-button uppercase text-white transition-colors hover:bg-gold-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Enquire →
            </Link>
          </div>
        </div>
      </div>
    </li>
  );
}
