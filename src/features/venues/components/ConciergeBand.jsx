import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ResponsiveImage from "../../../components/ui/ResponsiveImage";
import { images } from "../../../assets/landing/images";

const STEPS = [
  { n: "01", label: "Personal shortlist" },
  { n: "02", label: "Availability checked" },
  { n: "03", label: "Local planning support" },
];

// Closing band for visitors who cannot choose: it sends them to the contact page.
export default function ConciergeBand() {
  return (
    <section aria-labelledby="concierge-title" className="border-t border-line bg-cream py-12 lg:py-16">
      <div className="container-site grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <ResponsiveImage
          image={images.storyNewariCourtyard}
          alt="A host arranging a table in a Newari courtyard"
          sizes="(min-width: 1024px) 480px, 100vw"
          className="aspect-[16/10] w-full rounded-card-lg object-cover"
        />
        <div>
          <p className="font-body text-eyebrow uppercase text-gold-800">The Atithi concierge</p>
          <h2 id="concierge-title" className="mt-4 font-display text-h2 font-light text-ink">
            Not sure which space <em className="font-light text-gold-800">fits the moment?</em>
          </h2>
          <p className="mt-4 max-w-xl font-body text-body text-taupe">
            Share your occasion, guest count and the atmosphere you have in mind. Our local team will come back with a considered shortlist.
          </p>
          <ol className="mt-6 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="border-t border-line pt-3">
                <span className="block font-display text-h5 text-gold-800">{s.n}</span>
                <span className="font-body text-small text-ink">{s.label}</span>
              </li>
            ))}
          </ol>
          <Link
            to="/contact"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-7 font-body text-button uppercase text-gold-50 transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Ask our concierge <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </section>
  );
}
