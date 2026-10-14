import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, Users, Heart, ArrowRight } from "lucide-react";
import { cheapestPlatePrice } from "../venueFormat";

// ── Skeleton loader ───────────────────────────────────────────────────────────
// Exported so any list consumer can render N skeletons while isPending is true.
export function VenueCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 animate-pulse">
      <div className="h-56 bg-gradient-to-br from-slate-200 to-slate-300" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-slate-200 rounded-full w-3/4" />
        <div className="h-3.5 bg-slate-100 rounded-full w-2/3" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-16 bg-rose-100 rounded-full" />
          <div className="h-6 w-20 bg-rose-100 rounded-full" />
          <div className="h-6 w-14 bg-rose-100 rounded-full" />
        </div>
        <div className="h-10 bg-slate-100 rounded-full mt-2" />
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
/**
 * VenueCard — feature-slice card component.
 *
 * Image handling: the new backend streams images to Cloudinary and returns
 * absolute URLs, so venue.venueImages[0].url is used directly — no local
 * BASE_URL prefix required.
 *
 * Props
 * ─────
 * venue             Venue document from the backend
 * index             Stagger delay index for Framer Motion entry animation
 * isFavorite        Controls the heart fill state
 * onToggleFavorite  Called when the heart button is pressed
 */
export default function VenueCard({
  venue,
  index = 0,
  isFavorite = false,
  onToggleFavorite,
}) {
  const navigate = useNavigate();

  // Cloudinary absolute URL — no prefix needed
  const imageUrl =
    venue.venueImages?.[0]?.url ||
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&q=80";

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.07 }}
      whileHover={{ y: -4 }}
      className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-gray-100"
    >
      {/* ── Image ── */}
      <div className="relative h-56 overflow-hidden">
        <img
          src={imageUrl}
          alt={venue.venueName}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Bottom-fade overlay — makes price badge legible on any image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Favorite toggle */}
        {onToggleFavorite && (
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
            className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2.5 rounded-full shadow-lg hover:bg-white transition-colors duration-200"
          >
            <Heart
              size={17}
              className={`transition-all duration-200 ${
                isFavorite ? "text-rose-500 fill-rose-500" : "text-gray-400"
              }`}
            />
          </motion.button>
        )}

        {/* Price badge */}
        {cheapestPlatePrice(venue) > 0 && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
            <span className="text-sm font-semibold text-rose-600">
              From Rs.&nbsp;{cheapestPlatePrice(venue).toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-gray-400 ml-1">/ plate</span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-5">
        <h3 className="text-xl font-serif text-gray-800 mb-2 leading-snug line-clamp-1">
          {venue.venueName}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
          <span className="flex items-center gap-1.5">
            <MapPin size={13} className="text-rose-400 shrink-0" />
            {venue.location?.city}, {venue.location?.state}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={13} className="text-rose-400 shrink-0" />
            {venue.capacity} guests
          </span>
        </div>

        {/* Amenity chips — first 3 visible, rest collapsed */}
        {venue.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {venue.amenities.slice(0, 3).map((amenity, i) => (
              <span
                key={i}
                className="text-xs bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full"
              >
                {amenity}
              </span>
            ))}
            {venue.amenities.length > 3 && (
              <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
                +{venue.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        <button
          onClick={() => navigate(`/venue/${venue._id}`)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-rose-200 text-rose-500 text-sm font-medium rounded-full hover:bg-rose-50 hover:border-rose-400 transition-all duration-200 group/btn"
        >
          View Details
          <ArrowRight
            size={14}
            className="group-hover/btn:translate-x-1 transition-transform duration-200"
          />
        </button>
      </div>
    </motion.article>
  );
}
