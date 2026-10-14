import { Link } from "react-router-dom";
import Logo from "./Logo";
import Button from "./Button";

// Full-page message (404, access denied). It renders outside the site layout, so it carries its own logo link.
export default function StatusPage({ code, title, children, actions }) {
  return (
    <main id="main-content" className="flex min-h-screen flex-col bg-cream">
      <header className="container-site flex h-[var(--spacing-header)] items-center">
        <Link to="/" aria-label="Venure home" className="text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">
          <Logo className="w-16" label="Venure" />
        </Link>
      </header>

      <div className="container-site flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <p aria-hidden="true" className="font-display text-[clamp(6rem,22vw,12rem)] font-light italic leading-none text-gold/50">
          {code}
        </p>
        <h1 className="-mt-2 font-display text-h2 font-light text-ink">{title}</h1>
        <p className="mt-4 max-w-md font-body text-body-lg font-light text-gold-800">{children}</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">{actions}</div>
      </div>
    </main>
  );
}

export function HomeButtons() {
  return (
    <>
      <Button to="/" arrow>
        Back to home
      </Button>
      <Button to="/venues" variant="outline-dark">
        Browse venues
      </Button>
    </>
  );
}
