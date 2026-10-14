import { useContext, useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import Logo from "../components/ui/Logo";
import { venueTypes } from "../features/landing/content/landingContent";
import { AuthContext } from "../auth/AuthProvider";
import { useNewsletterSignup } from "../features/landing/hooks/useNewsletterSignup";

// Every item is a real page or section: nothing here is a placeholder.
const SPACES_LINKS = venueTypes.map((type) => ({ label: type.name, to: `/venues?category=${type.slug}` }));
const EXPLORE_LINKS = [
  { label: "All venues", to: "/venues" },
  { label: "Seasons", to: "/#experiences" },
  { label: "Venue stories", to: "/#stories" },
];
const COMPANY_LINKS = [
  { label: "About Venure", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "List your venue", to: "/contact?topic=partner" },
];

function FooterColumn({ title, items }) {
  return (
    <nav aria-label={title}>
      <p className="font-body text-caption font-medium uppercase tracking-[0.15em] text-gold">{title}</p>
      <ul className="mt-5 flex flex-col">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              to={item.to}
              className="inline-block py-2.5 font-body lg:py-1.5 text-small font-light text-white/90 transition-colors hover:text-white hover:underline hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NewsletterForm() {
  const inputId = useId();
  const statusId = useId();
  const [email, setEmail] = useState("");
  const { mutate, isPending, isSuccess, isError, reset } = useNewsletterSignup();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    mutate(email.trim(), { onSuccess: () => setEmail("") });
  };

  return (
    <div className="pt-7">
      <label htmlFor={inputId} className="font-body text-caption font-normal uppercase tracking-[0.15em] text-white">
        Stay inspired
      </label>
      <form
        onSubmit={handleSubmit}
        className="mt-3 flex h-12 items-center rounded-full border border-white/35 focus-within:border-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white"
      >
        <input
          id={inputId}
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (isError || isSuccess) reset();
          }}
          disabled={isPending}
          aria-describedby={statusId}
          className="min-w-0 flex-1 rounded-full bg-transparent px-5 font-body text-small text-gold-50 placeholder:text-gold-200/80 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          aria-label="Subscribe"
          className="m-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-800 text-white transition-colors hover:bg-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-60"
        >
          {isPending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.75} />}
        </button>
      </form>
      <p id={statusId} role={isError ? "alert" : "status"} className={`mt-2 min-h-[1.25rem] font-body text-caption ${isError ? "text-red-200" : "text-gold-200"}`}>
        {isSuccess ? "You are subscribed. Thank you." : isError ? "We could not subscribe you. Please try again." : ""}
      </p>
    </div>
  );
}

// Figma 46:314
export default function SiteFooter() {
  const { user } = useContext(AuthContext);
  const company = user ? COMPANY_LINKS : [...COMPANY_LINKS, { label: "Sign in", to: "/login" }];
  return (
    <footer className="border-t border-white/[0.07] bg-ink pb-8 pt-16 lg:pt-20">
      <div className="container-site">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-[384px_repeat(3,172px)] lg:justify-between">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              <Logo height={65} label="Venure home" />
            </Link>
            <p className="max-w-sm pt-6 font-body text-body font-light text-white">
              Curated heritage venues for life&apos;s most meaningful occasions, rooted in Nepali tradition.
            </p>
            <NewsletterForm />
          </div>

          <FooterColumn title="Spaces" items={SPACES_LINKS} />
          <FooterColumn title="Explore" items={EXPLORE_LINKS} />
          <FooterColumn title="Company" items={company} />
        </div>

        <div className="mt-14 border-t border-white/[0.07] pt-8">
          <p className="font-body text-caption text-white/80">&copy; {new Date().getFullYear()} Venure. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
