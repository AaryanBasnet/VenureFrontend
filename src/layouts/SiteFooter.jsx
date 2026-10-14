import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Logo from "../components/ui/Logo";
import { venueTypes } from "../features/landing/content/landingContent";
import { useNewsletterSignup } from "../features/landing/hooks/useNewsletterSignup";

const SPACES_LINKS = venueTypes.map((type) => ({ label: type.name, to: `/venues?category=${type.slug}` }));

// These sit in the Figma design but have no page behind them yet — rendered as
// plain text instead of dead links until Company/Experiences/Resources content exists.
const EXPERIENCES_LABELS = ["Weddings", "Corporate", "Private Dining", "Festival Events"];
const COMPANY_LINKS = [{ label: "Our Story", to: "/about" }, { label: "The Team" }, { label: "Press" }, { label: "Sustainability" }];
const RESOURCES_LINKS = [
  { label: "Planning Guide" },
  { label: "Vendor Partners" },
  { label: "FAQs" },
  { label: "Contact", to: "/contact" },
];

// No privacy/terms/cookies pages exist yet either — plain text, same as the columns above.
const LEGAL_LABELS = ["Privacy Policy", "Terms of Use", "Cookie Policy"];

function FooterColumn({ title, items }) {
  return (
    <div>
      <p className="font-body text-caption font-medium uppercase tracking-[0.15em] text-gold">{title}</p>
      <ul className="mt-5 flex flex-col gap-3">
        {items.map((item) =>
          item.to ? (
            <li key={item.label}>
              <Link
                to={item.to}
                className="font-body text-small font-light text-white/90 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {item.label}
              </Link>
            </li>
          ) : (
            <li key={item.label} className="font-body text-small font-light text-white/60">
              {item.label}
            </li>
          )
        )}
      </ul>
    </div>
  );
}

function NewsletterForm() {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const { mutate, isPending, isSuccess } = useNewsletterSignup();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    mutate(email, { onSuccess: () => setEmail("") });
  };

  return (
    <div className="pt-7">
      <label htmlFor={inputId} className="font-body text-caption font-normal uppercase tracking-[0.15em] text-white">
        Stay inspired
      </label>
      <form onSubmit={handleSubmit} className="mt-3 flex h-11 items-center rounded-full border border-white/35">
        <input
          id={inputId}
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
          className="min-w-0 flex-1 rounded-full bg-transparent px-4 font-body text-small text-gold-200 placeholder:text-gold-200/80 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          aria-label="Subscribe"
          className="m-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-gold text-white transition-colors hover:bg-gold-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
        >
          <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
        </button>
      </form>
      <p role="status" className="mt-2 font-body text-caption text-gold-200">
        {isSuccess ? "You're subscribed — thank you!" : " "}
      </p>
    </div>
  );
}

// Figma 46:314
export default function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.07] bg-ink pb-8 pt-16 lg:pt-20">
      <div className="container-site">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[384px_repeat(4,172px)] lg:justify-between lg:gap-6">
          <div>
            <Link to="/" className="inline-block text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <Logo height={65} label="Venure home" />
            </Link>
            <p className="max-w-sm pt-6 font-body text-body-light font-light text-white">
              Curated heritage venues for life&apos;s most meaningful occasions — rooted in Nepali tradition.
            </p>
            <NewsletterForm />
          </div>

          <FooterColumn title="Spaces" items={SPACES_LINKS} />
          <FooterColumn title="Experiences" items={EXPERIENCES_LABELS.map((label) => ({ label }))} />
          <FooterColumn title="Company" items={COMPANY_LINKS} />
          <FooterColumn title="Resources" items={RESOURCES_LINKS} />
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/[0.07] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-caption text-white">© {new Date().getFullYear()} Venure Ltd. All rights reserved.</p>
          <ul className="flex gap-6">
            {LEGAL_LABELS.map((label) => (
              <li key={label} className="font-body text-caption text-white/60">
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
