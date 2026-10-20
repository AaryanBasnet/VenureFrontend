import SectionHeading from "../../../components/ui/SectionHeading";
import TextLink from "../../../components/ui/TextLink";
import { images } from "../../../assets/landing/images";
import VenueTypeCard from "../components/VenueTypeCard";
import { useLanding } from "../hooks/useLanding";

// Figma 46:17 — intro copy on the left, five expanding cards on the right. The cards are the five kinds of space
// (garden estates, intimate halls...), each one a link to the venues that have such a space.
export default function VenueTypesSection() {
  const { content, spaceTypeCounts: counts } = useLanding();
  const { venueTypes, venueTypesIntro } = content;

  return (
    <section id="venue-types" aria-labelledby="venue-types-title" className="bg-sand py-16 lg:py-[74px]">
      <div className="container-site grid gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-center lg:gap-16">
        <div className="flex flex-col items-start">
          <SectionHeading
            id="venue-types-title"
            eyebrow={venueTypesIntro.eyebrow}
            title={venueTypesIntro.title}
            accent={venueTypesIntro.accent}
          />
          <p className="mt-4 max-w-sm font-body text-body text-gold-800">{venueTypesIntro.description}</p>
          <TextLink to="/venues" className="mt-6">
            Explore all venues
          </TextLink>
        </div>

        {/* Mobile/tablet: horizontal scroll-snap row. Desktop: flex row with hover expansion. */}
        <ul
          className="group/row -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 md:-mx-10 md:scroll-px-10 md:px-10 lg:mx-0 lg:overflow-visible lg:px-0 lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {venueTypes.map((type) => (
            <VenueTypeCard
              key={type.slug}
              type={type}
              image={images[type.imageKey]}
              badge={images[type.badgeKey]}
              count={counts[type.slug]}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
