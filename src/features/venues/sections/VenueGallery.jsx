import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Grid2x2, X } from "lucide-react";
import { Eyebrow } from "../../../components/ui/SectionHeading";
import { cloudinaryTransform, GALLERY_TRANSFORM } from "../../../utils/cloudinary";

const FULL_TRANSFORM = "f_auto,q_auto,w_1600,c_limit";

function Lightbox({ images, start, onClose }) {
  const [index, setIndex] = useState(start);
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const step = (d) => setIndex((i) => (i + d + images.length) % images.length);
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  const step = (d) => setIndex((i) => (i + d + images.length) % images.length);

  return (
    <div role="dialog" aria-modal="true" aria-label="Venue photos" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4">
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close photos" className="absolute right-5 top-5 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
        <X className="size-5" />
      </button>
      {images.length > 1 && (
        <>
          <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
            <ChevronLeft className="size-6" />
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
      <img src={cloudinaryTransform(images[index].url, FULL_TRANSFORM)} alt="" className="max-h-full max-w-full rounded-card-md object-contain" />
      <p className="absolute bottom-5 font-body text-small text-white/80">
        {index + 1} / {images.length}
      </p>
    </div>
  );
}

// Figma 385:316 gallery: one large photo plus up to four tiles; "View all" opens the full set.
export default function VenueGallery({ images = [] }) {
  const [open, setOpen] = useState(null);
  if (images.length === 0) return null;

  const tiles = images.slice(1, 5);
  const tile = (img, i, extra = "") => (
    <button
      key={img.url}
      type="button"
      onClick={() => setOpen(i)}
      aria-label={`Open photo ${i + 1} of ${images.length}`}
      className={`group relative overflow-hidden rounded-card-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${extra}`}
    >
      <img
        src={cloudinaryTransform(img.url, GALLERY_TRANSFORM)}
        alt=""
        loading="lazy"
        className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
      />
    </button>
  );

  return (
    <section aria-label="Photos" className="bg-sand py-12 lg:py-16">
      <div className="container-site">
        <div className="flex items-center justify-between">
          <Eyebrow>Photos</Eyebrow>
          {images.length > 1 && (
            <button type="button" onClick={() => setOpen(0)} className="inline-flex items-center gap-2 font-body text-small text-ink hover:text-gold-800">
              <Grid2x2 aria-hidden="true" className="size-4" /> View all {images.length} photos
            </button>
          )}
        </div>
        <div className={`mt-5 grid gap-3 ${tiles.length ? "lg:grid-cols-4 lg:grid-rows-2" : ""}`}>
          {tile(
            images[0],
            0,
            `aspect-[4/3] ${tiles.length ? "lg:col-span-2 lg:row-span-2 lg:aspect-auto lg:min-h-[420px]" : "lg:aspect-[16/7]"}`
          )}
          {tiles.map((img, i) => tile(img, i + 1, "hidden aspect-[4/3] lg:block"))}
        </div>
      </div>
      {open !== null && <Lightbox images={images} start={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
