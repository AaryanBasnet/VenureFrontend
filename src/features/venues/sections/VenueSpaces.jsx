import { Clock, Users } from "lucide-react";
import SectionHeading from "../../../components/ui/SectionHeading";
import { cloudinaryTransform, GALLERY_TRANSFORM } from "../../../utils/cloudinary";
import { SHIFT_LABELS } from "../venueFormat";
import VenueImage from "../components/VenueImage";

// "10:00" -> "10 am", "17:30" -> "5:30 pm"
const clock = (value = "") => {
  const [h, m] = String(value).split(":").map(Number);
  if (!Number.isFinite(h)) return value;
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
};

function SpaceCard({ space, single, featured, onCheckDate }) {
  const photo = space.spaceImages?.[0]?.url;
  const shifts = Object.entries(space.resolvedShifts ?? {});

  return (
    <li
      className={`flex flex-col overflow-hidden rounded-card-lg border border-line bg-white ${single ? "lg:flex-row" : ""} ${
        featured ? "lg:row-span-2" : ""
      }`}
    >
      <div className={`shrink-0 bg-sand ${photo ? (featured ? "aspect-[4/3] lg:aspect-auto lg:min-h-[320px] lg:flex-1" : single ? "aspect-[16/9] lg:aspect-auto lg:w-1/2" : "aspect-[16/9]") : single ? "h-24 lg:h-auto lg:w-1/3" : "h-24"}`}>
        <VenueImage
          src={photo ? cloudinaryTransform(photo, GALLERY_TRANSFORM) : null}
          alt={`${space.name} at this venue`}
          loading="lazy"
          iconClassName="size-8"
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-display text-h4 font-light text-ink [overflow-wrap:anywhere]">{space.name}</h3>
        {space.description && (
          <p className="line-clamp-3 font-body text-small text-taupe [overflow-wrap:anywhere]">{space.description}</p>
        )}
        <p className="flex items-center gap-2 font-body text-small text-ink">
          <Users aria-hidden="true" className="size-4 text-gold-800" />
          Up to {space.capacity} {space.capacity === 1 ? "guest" : "guests"}
        </p>
        {shifts.length > 0 && (
          <p className="flex items-start gap-2 font-body text-caption text-taupe">
            <Clock aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-gold-800" />
            <span>
              {shifts.map(([key, t]) => `${SHIFT_LABELS[key] ?? key} ${clock(t.startTime)} to ${clock(t.endTime)}`).join(" · ")}
            </span>
          </p>
        )}
        <div className="mt-auto flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onCheckDate(space)}
            aria-label={`Request this space: ${space.name}`}
            className="min-h-11 rounded-full border border-ink px-5 py-2 font-body text-button uppercase text-ink transition-colors hover:bg-ink hover:text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Request this space
          </button>
        </div>
      </div>
    </li>
  );
}

// Figma 385:316 "Choose the space": the venue's bookable halls, first one featured when there are three.
export default function VenueSpaces({ spaces = [], isPending, onCheckDate }) {
  if (!isPending && spaces.length === 0) return null;

  const featureFirst = spaces.length === 3;

  return (
    <section id="spaces" aria-labelledby="spaces-title" className="scroll-mt-[calc(var(--spacing-header)+72px)] bg-sand py-16 lg:py-[88px]">
      <div className="container-site">
        <SectionHeading
          id="spaces-title"
          eyebrow="Halls & spaces"
          title="Choose the space."
          accent="Or book the whole venue."
          className="[&_h2]:text-h2"
        />
        {isPending ? (
          <div role="status" aria-label="Loading spaces" className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className="h-72 animate-pulse rounded-card-lg bg-gold-100" />
            <div className="h-72 animate-pulse rounded-card-lg bg-gold-100" />
          </div>
        ) : (
          <ul className={`mt-10 grid gap-5 ${spaces.length > 1 ? "lg:grid-cols-2" : ""}`}>
            {spaces.map((space, i) => (
              <SpaceCard key={space._id} space={space} single={spaces.length === 1} featured={featureFirst && i === 0} onCheckDate={onCheckDate} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
