import { Link } from "react-router-dom";
import ResponsiveImage from "../../../components/ui/ResponsiveImage";

/**
 * Tall photo card for a kind of space (Figma component 55:26569).
 * On pointer devices with hover (lg+), the hovered/focused card widens and its
 * title moves onto one line — handled by the parent flex row via `grow`. The labels of
 * the squeezed sibling cards fade out so they never clip.
 */
export default function VenueTypeCard({ type, image, badge, count }) {
  return (
    <li className="h-[300px] w-[44vw] min-w-40 shrink-0 snap-start overflow-hidden rounded-card-md sm:w-56 lg:h-[340px] lg:w-auto lg:min-w-0 lg:flex-1 lg:transition-[flex-grow] lg:duration-500 lg:ease-out lg:hover:grow-[2.2] lg:focus-within:grow-[2.2]">
      <Link
        to={`/venues?spaceType=${type.slug}`}
        className="group relative isolate block size-full overflow-hidden rounded-card-md focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
      >
        <ResponsiveImage
          image={image}
          alt=""
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 224px, 44vw"
          className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgb(10_6_3/0.78)] via-[rgb(10_6_3/0.1)] via-50% to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 flex items-end gap-2.5 px-4 pt-4 pb-5 transition-opacity duration-300 lg:group-has-[:hover]/row:opacity-0 lg:group-has-[:focus-visible]/row:opacity-0 lg:group-hover:!opacity-100 lg:group-focus-visible:!opacity-100">
          <span className="size-8 shrink-0 overflow-hidden rounded-full border border-white/25 bg-white/15 backdrop-blur-sm">
            <ResponsiveImage
              image={badge}
              alt=""
              sizes="32px"
              className="size-full object-cover"
            />
          </span>
          <span className="flex min-w-0 flex-col">
            {count != null && (
              <span className="font-body text-eyebrow uppercase text-white/90">
                {count} {count === 1 ? "venue" : "venues"}
              </span>
            )}
            <span className="font-display pt-0.5 text-[0.95rem] leading-tight text-white lg:max-w-24 lg:group-hover:max-w-none lg:group-hover:whitespace-nowrap lg:group-focus-visible:max-w-none lg:group-focus-visible:whitespace-nowrap">
              {type.name}
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}
