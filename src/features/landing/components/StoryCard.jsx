import { Link } from "react-router-dom";
import ResponsiveImage from "../../../components/ui/ResponsiveImage";
import { Eyebrow } from "../../../components/ui/SectionHeading";
import { images } from "../../../assets/landing/images";

/**
 * A venue-story card (Figma 46:76). `variant="feature"` is the large full-bleed
 * photo with text overlaid at the bottom; `variant="compact"` is a smaller
 * image-plus-text card on a sand background.
 */
export default function StoryCard({ story, variant = "compact", className = "" }) {
  const { eyebrow, title, description, imageKey, imageSizes, venueId, category } = story;
  // A story leads to its venue when one is set, else to its kind of space (the stored field is still called category); with neither it stays plain text.
  const to = venueId ? `/venue/${venueId}` : category ? `/venues?spaceType=${category}` : null;
  const heading = to ? (
    <Link to={to} className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">
      {title}
    </Link>
  ) : (
    title
  );

  if (variant === "feature") {
    return (
      <article className={`group relative isolate overflow-hidden rounded-card-xl ${className}`}>
        <ResponsiveImage
          image={images[imageKey]}
          alt=""
          sizes={imageSizes}
          className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgb(10_6_3/0.85)] via-[rgb(10_6_3/0.25)] via-55% to-transparent"
        />
        <div className="flex h-full min-h-[420px] flex-col justify-end p-6 sm:p-10">
          <Eyebrow className="text-gold-200">{eyebrow}</Eyebrow>
          <h3 className="font-display pt-3 text-h2 font-light text-white">{heading}</h3>
          <p className="mt-3 max-w-md font-body text-body text-white/90">{description}</p>
        </div>
      </article>
    );
  }

  return (
    <article className="relative grid grid-cols-1 overflow-hidden rounded-card-xl bg-sand sm:min-h-60 sm:grid-cols-2 lg:min-h-0 lg:flex-1">
      <ResponsiveImage
        image={images[imageKey]}
        alt=""
        sizes={imageSizes}
        pictureClassName="relative block aspect-[4/3] sm:aspect-auto"
        className="size-full object-cover sm:absolute sm:inset-0"
      />
      <div className="flex flex-col justify-center p-6 sm:p-7">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h3 className="font-display pt-2.5 text-h4 font-light text-ink">{heading}</h3>
        <p className="mt-2.5 font-body text-caption text-gold-800">{description}</p>
      </div>
    </article>
  );
}
