import { useEffect, useRef, useState } from "react";
import { priceFormatter, SECTIONS } from "../venueFormat";

// A section counts as "current" once its top has passed this line below the sticky bars (header 78px + this bar).
const READING_LINE = 200;

// Sticky bar under the site header: jump links to the page sections, plus the one primary action on large screens
// (small screens have the bottom bar). The current section follows the scroll, and the last one is selected once the
// end of the page is in view, even when that section is too short to reach the reading line.
export default function VenueSectionNav({ venueName, fromPlate, onCheckDate, available }) {
  const items = SECTIONS.filter((s) => !available || available.includes(s.id));
  const [active, setActive] = useState(items[0]?.id);
  const listRef = useRef(null);
  const key = items.map((s) => s.id).join(",");

  useEffect(() => {
    const ids = key.split(",");
    let frame = 0;
    const measure = () => {
      frame = 0;
      let current = ids[0];
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= READING_LINE) current = id;
      });
      const last = document.getElementById(ids[ids.length - 1]);
      if (last && last.getBoundingClientRect().bottom <= window.innerHeight + 4) current = ids[ids.length - 1];
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [key]);

  // On small screens the list scrolls sideways: keep the current section's link in view.
  useEffect(() => {
    const list = listRef.current;
    const link = list?.querySelector("[aria-current]");
    if (!list || !link || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: link.offsetLeft - list.clientWidth / 2 + link.offsetWidth / 2, behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label="Venue sections" className="sticky top-[var(--spacing-header)] z-40 border-b border-line bg-cream/95 backdrop-blur">
      <div className="container-site flex items-center justify-between gap-6">
        <ul ref={listRef} className="relative -mx-1 flex min-w-0 items-center gap-1 overflow-x-auto px-1 [scrollbar-width:none] max-lg:[mask-image:linear-gradient(to_right,black_92%,transparent)] lg:gap-4 [&::-webkit-scrollbar]:hidden">
          {items.map((s) => (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                onClick={() => setActive(s.id)}
                aria-current={active === s.id ? "true" : undefined}
                className={`flex min-h-11 items-center border-b-2 px-2 font-body text-label uppercase transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
                  active === s.id ? "border-gold text-ink" : "border-transparent text-taupe hover:text-ink"
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-5 py-2 lg:flex">
          <p className="hidden max-w-[16rem] truncate font-display text-h5 font-light text-ink xl:block">{venueName}</p>
          {fromPlate > 0 && (
            <p className="whitespace-nowrap font-body text-small text-taupe">
              From <span className="text-body text-ink">NPR {priceFormatter.format(fromPlate)}</span> per plate
            </p>
          )}
          <button
            type="button"
            onClick={onCheckDate}
            className="min-h-11 rounded-full bg-ink px-6 py-2.5 font-body text-button uppercase text-gold-50 transition-colors hover:bg-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Request a date
          </button>
        </div>
      </div>
    </nav>
  );
}
