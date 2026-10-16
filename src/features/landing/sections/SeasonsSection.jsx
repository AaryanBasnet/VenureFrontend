import SectionHeading from "../../../components/ui/SectionHeading";
import { useLanding } from "../hooks/useLanding";
import SeasonCard from "../components/SeasonCard";

// Figma 46:119 — four tall seasonal photo cards.
export default function SeasonsSection() {
  const { seasonsIntro, seasons } = useLanding().content;
  return (
    <section id="experiences" aria-labelledby="seasons-title" className="bg-sand py-16 lg:py-[74px]">
      <div className="container-site">
        <SectionHeading
          id="seasons-title"
          eyebrow={seasonsIntro.eyebrow}
          title={seasonsIntro.title}
          accent={seasonsIntro.accent}
        />
        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:mt-12 lg:grid-cols-4 lg:gap-[34px]">
          {seasons.map((season) => (
            <SeasonCard key={season.name} season={season} />
          ))}
        </ul>
      </div>
    </section>
  );
}
