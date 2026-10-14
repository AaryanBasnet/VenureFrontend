import {
  Armchair,
  ParkingCircle,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Speaker,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";
import SectionHeading from "../../../components/ui/SectionHeading";
import { categoryLabel } from "../venueFormat";

const AMENITY_ICONS = {
  wifi: Wifi,
  parking: ParkingCircle,
  "air conditioning": Snowflake,
  "sound system": Speaker,
  catering: UtensilsCrossed,
  security: ShieldCheck,
  seating: Armchair,
};

function AmenityPill({ name }) {
  const Icon = AMENITY_ICONS[name.toLowerCase()] ?? Sparkles;
  return (
    <li className="flex items-center gap-3 rounded-card-md border border-line bg-cream px-4 py-3 font-body text-small text-ink">
      <Icon aria-hidden="true" className="size-5 shrink-0 text-gold-800" strokeWidth={1.5} />
      {name}
    </li>
  );
}

// Figma 385:316 "Venue overview": heading, description and tags, then the amenities as cards.
export default function VenueOverview({ venue }) {
  const category = categoryLabel(venue.category);
  const amenities = venue.amenities ?? [];

  return (
    <section id="overview" aria-labelledby="overview-title" className="scroll-mt-[calc(var(--spacing-header)+72px)] bg-cream py-16 lg:py-[88px]">
      <div className="container-site">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            id="overview-title"
            eyebrow="Venue overview"
            title="About"
            accent={venue.venueName}
            className="[&_h2]:text-h2"
          />
          <div className="flex flex-col gap-5">
            {venue.description && (
              <p className="font-body text-body text-ink/85 [overflow-wrap:anywhere]">{venue.description}</p>
            )}
            {category && (
              <ul className="flex flex-wrap gap-2">
                <li className="rounded-full border border-line px-3 py-1 font-body text-eyebrow uppercase text-gold-800">
                  {category}
                </li>
              </ul>
            )}
          </div>
        </div>

        {amenities.length > 0 && (
          <div className="mt-12">
            <h3 className="font-display text-h4 font-light text-ink">What is included</h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {amenities.map((name) => (
                <AmenityPill key={name} name={name} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
