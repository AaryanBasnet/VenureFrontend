import ResponsiveImage from "../../../components/ui/ResponsiveImage";
import { images } from "../../../assets/landing/images";

/**
 * Tall seasonal photo card (Figma component 91:524, hover spec from the
 * design-system page's "primary"/"hover" pair, node 143:7672/143:7681).
 * Resting state is the compact "Venure / Summer" label; hovering (desktop)
 * darkens the photo and reveals a title + description. Touch devices have
 * no hover, so below `lg` the richer content is shown permanently instead.
 */
export default function SeasonCard({ season }) {
  // `sizes` describes the rendered image width, not the card width: these are
  // landscape photos cover-fitted into tall cards, so they scale to the card height.
  return (
    <li className="group relative isolate aspect-[3/4] overflow-hidden sm:aspect-[294/642] rounded-card-sm bg-stone/20">
      <ResponsiveImage
        image={images[season.imageKey]}
        alt=""
        sizes="(min-width: 1440px) 1000px, (min-width: 1024px) 75vw, (min-width: 640px) 155vw, 190vw"
        className="absolute inset-0 -z-20 size-full object-cover opacity-85 transition-[opacity,transform] duration-700 ease-out lg:opacity-100 lg:group-hover:scale-105 lg:group-hover:opacity-85 motion-reduce:transition-none motion-reduce:lg:group-hover:scale-100"
      />

      {/* Resting gradient (lg-only look before hover) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden bg-gradient-to-t from-black/50 via-45% via-black/50 to-55% to-black/10 transition-opacity duration-500 lg:block lg:group-hover:opacity-0"
      />
      {/* Hover gradient — permanent on touch, fades in on hover at lg+ */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-[58%] via-black/35 to-[89%] to-black/10 transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100"
      />

      {/* Resting label — lg-only, fades out on hover */}
      <div className="absolute inset-x-0 bottom-0 hidden flex-col p-4 transition-opacity duration-300 lg:flex lg:group-hover:opacity-0">
        <span className="font-body text-eyebrow uppercase text-gold-200">Season</span>
        <span className="font-display pt-1 text-h5 font-light text-white">{season.name}</span>
      </div>

      {/* Rich content — permanent on touch, revealed on hover at lg+ */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 px-4 pb-6 pt-8 transition-opacity duration-300 lg:opacity-0 lg:group-hover:opacity-100">
        <span className="font-body text-eyebrow uppercase text-gold-200">{season.name}</span>
        <span className="font-display text-[1.9rem] leading-[2.09rem] font-light text-white">{season.title}</span>
        <p className="font-body text-small font-light text-white">{season.description}</p>
      </div>
    </li>
  );
}
