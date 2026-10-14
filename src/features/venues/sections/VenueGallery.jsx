import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Grid2x2, X } from "lucide-react";
import { Eyebrow } from "../../../components/ui/SectionHeading";
import { cloudinaryTransform, GALLERY_TRANSFORM } from "../../../utils/cloudinary";
import VenueImage from "../components/VenueImage";

const FULL_TRANSFORM = "f_auto,q_auto,w_1600,c_limit";
const SWIPE_DISTANCE = 50;

const lightboxBtn =
  "rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

// Full-screen viewer: arrow keys and swipe move between photos, Escape closes, Tab stays inside,
// the page behind does not scroll, and focus goes back to where it was.
function Lightbox({ images, start, venueName, onClose }) {
  const [index, setIndex] = useState(start);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const touchX = useRef(null);
  const count = images.length;

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIndex((i) => (i + 1) % count);
      else if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + count) % count);
      else if (e.key === "Tab") {
        const items = [...(dialogRef.current?.querySelectorAll("button") ?? [])];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!dialogRef.current?.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [count, onClose]);

  // Load the neighbours ahead of time so stepping through feels instant.
  useEffect(() => {
    [index + 1, index - 1].forEach((i) => {
      const img = images[(i + count) % count];
      if (img) new Image().src = cloudinaryTransform(img.url, FULL_TRANSFORM);
    });
  }, [index, images, count]);

  const step = (d) => setIndex((i) => (i + d + count) % count);
  const onTouchEnd = (e) => {
    if (touchX.current === null || count < 2) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > SWIPE_DISTANCE) step(dx < 0 ? 1 : -1);
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${venueName} photos`}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4 pb-14 pt-16"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={onTouchEnd}
    >
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close photos" className={`absolute right-4 top-4 ${lightboxBtn}`}>
        <X aria-hidden="true" className="size-5" />
      </button>
      {count > 1 && (
        <>
          <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className={`absolute left-3 top-1/2 -translate-y-1/2 ${lightboxBtn}`}>
            <ChevronLeft aria-hidden="true" className="size-6" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next photo" className={`absolute right-3 top-1/2 -translate-y-1/2 ${lightboxBtn}`}>
            <ChevronRight aria-hidden="true" className="size-6" />
          </button>
        </>
      )}
      <VenueImage
        key={index}
        src={cloudinaryTransform(images[index].url, FULL_TRANSFORM)}
        alt={`${venueName}, photo ${index + 1} of ${count}`}
        iconClassName="size-12"
        className="max-h-full max-w-full rounded-card-md object-contain"
      />
      <p aria-live="polite" className="absolute bottom-4 font-body text-small text-white/85">
        {index + 1} / {count}
      </p>
    </div>
  );
}

// How the tiles beside the large first photo fill the grid, so any number of photos leaves no holes (large screens).
const tileSpan = (total, i) => {
  if (total === 3) return "lg:col-span-2";
  if (total === 4) return i === 1 ? "lg:col-span-2" : "";
  return "";
};

// Figma 385:316 gallery: one large photo plus up to four tiles; "View all" opens the full set.
export default function VenueGallery({ images = [], venueName = "Venue" }) {
  const [open, setOpen] = useState(null);
  if (images.length === 0) return null;

  const total = images.length;
  const shown = Math.min(total, 5);
  const extra = total - shown;
  const gridCols = total === 1 ? "" : total === 2 ? "lg:grid-cols-2" : "lg:auto-rows-[200px] lg:grid-cols-4";
  const mainClass =
    total === 1
      ? "aspect-[4/3] lg:aspect-[16/7]"
      : total === 2
        ? "aspect-[4/3]"
        : "aspect-[4/3] lg:col-span-2 lg:row-span-2 lg:aspect-auto";

  const tile = (img, i, className) => (
    <button
      key={`${img.url}-${i}`}
      type="button"
      onClick={() => setOpen(i)}
      aria-label={`Open photo ${i + 1} of ${total}`}
      className={`group relative overflow-hidden rounded-card-md bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
    >
      <VenueImage
        src={cloudinaryTransform(img.url, GALLERY_TRANSFORM)}
        alt={`${venueName}, photo ${i + 1}`}
        loading={i === 0 ? "eager" : "lazy"}
        iconClassName="size-10"
        className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
      />
      {i === 0 && total > 1 && (
        <span className="absolute bottom-3 right-3 rounded-full bg-ink/75 px-3 py-1.5 font-body text-caption text-gold-50 backdrop-blur lg:hidden">
          1 / {total}
        </span>
      )}
      {i === shown - 1 && extra > 0 && (
        <span className="absolute inset-0 hidden items-center justify-center bg-ink/55 font-body text-small text-gold-50 lg:flex">+{extra} more</span>
      )}
    </button>
  );

  return (
    <section aria-label="Photos" className="bg-sand py-12 lg:py-16">
      <div className="container-site">
        <div className="flex items-center justify-between">
          <Eyebrow>Photos</Eyebrow>
          {total > 1 && (
            <button
              type="button"
              onClick={() => setOpen(0)}
              className="inline-flex min-h-11 items-center gap-2 font-body text-small text-ink hover:text-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <Grid2x2 aria-hidden="true" className="size-4" /> View all {total} photos
            </button>
          )}
        </div>
        <div className={`mt-2 grid gap-3 ${gridCols}`}>
          {tile(images[0], 0, mainClass)}
          {images.slice(1, shown).map((img, i) => tile(img, i + 1, `hidden aspect-[4/3] lg:block lg:aspect-auto ${tileSpan(total, i + 1)}`))}
        </div>
      </div>
      {open !== null && <Lightbox images={images} start={open} venueName={venueName} onClose={() => setOpen(null)} />}
    </section>
  );
}
