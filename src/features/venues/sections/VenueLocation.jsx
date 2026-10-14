import { ExternalLink, MapPin } from "lucide-react";
import SectionHeading from "../../../components/ui/SectionHeading";
import { mapsUrl } from "../venueFormat";

// Figma 385:316 "Easy to reach": address and a maps link. The Figma map is an illustration
// supplied per venue; there is no such image or travel-time data in the backend yet.
export default function VenueLocation({ venue }) {
  const { address, city, state, country } = venue.location ?? {};
  const lines = [address, [city, state].filter(Boolean).join(", "), country].filter(Boolean);
  if (lines.length === 0) return null;

  return (
    <section id="location" aria-labelledby="location-title" className="scroll-mt-[calc(var(--spacing-header)+72px)] bg-cream py-16 lg:py-[88px]">
      <div className="container-site grid gap-8 lg:grid-cols-2 lg:gap-16">
        <SectionHeading
          id="location-title"
          eyebrow="Location"
          title="Find your way"
          accent={venue.venueName}
          className="[&_h2]:text-h2"
        />
        <div className="flex flex-col gap-5">
          <address className="flex items-start gap-3 font-body text-body not-italic text-ink">
            <MapPin aria-hidden="true" className="mt-1 size-5 shrink-0 text-gold-800" />
            <span>
              {lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </span>
          </address>
          <a
            href={mapsUrl(venue)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-ink px-6 py-3 font-body text-button uppercase text-gold-50 transition-colors hover:bg-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Open in maps <ExternalLink aria-hidden="true" className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
