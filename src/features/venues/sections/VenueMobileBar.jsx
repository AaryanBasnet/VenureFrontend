import { useEffect, useState } from "react";
import { priceFormatter } from "../venueFormat";

// Bottom action bar for small screens. It slides away when the site footer comes into view, so it never covers footer links.
export default function VenueMobileBar({ fromPlate, onCheckDate }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return undefined;
    const observer = new IntersectionObserver(([entry]) => setHidden(entry.isIntersecting));
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      inert={hidden}
      className={`fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-line bg-cream/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 motion-reduce:transition-none lg:hidden ${
        hidden ? "translate-y-full" : ""
      }`}
    >
      {fromPlate > 0 && (
        <p className="min-w-0 font-body text-caption text-taupe">
          From
          <span className="block font-display text-h5 font-normal leading-tight text-ink">NPR {priceFormatter.format(fromPlate)}</span>
          per plate
        </p>
      )}
      <button
        type="button"
        onClick={onCheckDate}
        className="min-h-12 flex-1 rounded-full bg-ink px-5 py-3 font-body text-button uppercase text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Request a date
      </button>
    </div>
  );
}
