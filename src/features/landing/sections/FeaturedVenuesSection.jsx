import SectionHeading, { Eyebrow } from "../../../components/ui/SectionHeading";
import ArrowPillLink from "../../../components/ui/ArrowPillLink";
import { featuredFallbackImages } from "../content/landingContent";
import { useLanding } from "../hooks/useLanding";
import FeaturedVenueCard from "../components/FeaturedVenueCard";
import { useFeaturedVenues } from "../hooks/useFeaturedVenues";

// Card heights/proportions mirror Figma 46:167's masonry-style row (580 / 460 / 360).
const CARD_STYLES = [
  { height: "lg:h-[580px]", flex: "lg:flex-[1.3]" },
  { height: "lg:h-[460px]", flex: "lg:flex-1" },
  { height: "lg:h-[360px]", flex: "lg:flex-1" },
];

// Figma 46:167 — three admin-curated venues in a bottom-aligned masonry row.
export default function FeaturedVenuesSection() {
  const { featuredIntro } = useLanding().content;
  const { venues, isPending, isError } = useFeaturedVenues();

  // Nothing to show (or the list could not load): leave the section out rather than show a heading over empty space
  if (isError || (!isPending && venues.length === 0)) return null;

  return (
    <section id="finest-spaces" aria-labelledby="featured-title" className="bg-cream py-16 lg:py-[74px]">
      <div className="container-site flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <SectionHeading id="featured-title" title={featuredIntro.title} accent={featuredIntro.accent} />
        <div className="flex flex-col gap-4 lg:max-w-sm">
          <Eyebrow as="span">{featuredIntro.eyebrow}</Eyebrow>
          <p className="font-body text-body text-gold-800">{featuredIntro.description}</p>
        </div>
        <ArrowPillLink to="/venues" className="self-start lg:self-auto">
          Explore collection
        </ArrowPillLink>
      </div>

      <div className="container-site">
        <ul className="mt-10 flex flex-col gap-5 lg:mt-12 lg:flex-row lg:items-end">
          {isPending &&
            CARD_STYLES.map((style, index) => (
              <li key={index} aria-hidden="true" className={`aspect-[4/3] animate-pulse rounded-card-xl bg-sand ${style.height} ${style.flex}`} />
            ))}
          {venues.slice(0, 3).map((venue, index) => (
            <FeaturedVenueCard
              key={venue._id}
              venue={venue}
              fallbackImage={featuredFallbackImages[index]}
              imageSizes={index === 0 ? "(min-width: 1024px) 38vw, 100vw" : "(min-width: 1024px) 29vw, 100vw"}
              className={`aspect-[4/3] ${CARD_STYLES[index].height} ${CARD_STYLES[index].flex}`}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
