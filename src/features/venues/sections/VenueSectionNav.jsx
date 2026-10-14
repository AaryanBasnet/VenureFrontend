import { useEffect, useState } from "react";
import { priceFormatter, SECTIONS } from "../venueFormat";


// Sticky bar under the site header (lg+): jump links to the page sections and the one primary action, so "Request a date" is never far from where the user is.
export default function VenueSectionNav({ venueName, fromPlate, onCheckDate, available }) {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!targets.length) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [available]);

  return (
    <nav
      aria-label="Venue sections"
      className="sticky top-[var(--spacing-header)] z-40 hidden border-b border-line bg-cream/95 backdrop-blur lg:block"
    >
      <div className="container-site flex items-center justify-between gap-6 py-3">
        <ul className="flex items-center gap-7">
          {SECTIONS.filter((s) => !available || available.includes(s.id)).map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "true" : undefined}
                className={`border-b-2 py-1 font-body text-label uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${
                  active === s.id ? "border-gold text-ink" : "border-transparent text-taupe hover:text-ink"
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-5">
          <p className="hidden font-display text-h5 font-light text-ink xl:block">{venueName}</p>
          {fromPlate > 0 && (
            <p className="font-body text-small text-taupe">
              From <span className="text-body text-ink">NPR {priceFormatter.format(fromPlate)}</span> per plate
            </p>
          )}
          <button
            type="button"
            onClick={onCheckDate}
            className="rounded-full bg-ink px-6 py-2.5 font-body text-button uppercase text-gold-50 transition-colors hover:bg-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Request a date
          </button>
        </div>
      </div>
    </nav>
  );
}
