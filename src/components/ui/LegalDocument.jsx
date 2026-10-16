import { Link } from "react-router-dom";

// Shared layout for the plain-language Terms and Privacy pages.
export const LEGAL_UPDATED = "15 October 2026";

export function LegalSection({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-h4 font-light text-ink">{title}</h2>
      <div className="mt-3 space-y-3 font-body text-body text-ink/85">{children}</div>
    </section>
  );
}

export default function LegalDocument({ title, intro, children }) {
  return (
    <div className="bg-cream">
      <div className="container-site page-pad">
      <div className="measure-reading">
        <p className="font-body text-eyebrow uppercase text-gold-800">Venure</p>
        <h1 className="mt-2 font-display text-h2 font-light text-ink">{title}</h1>
        <p className="mt-2 font-body text-small text-taupe">Last updated {LEGAL_UPDATED}</p>

        <p role="note" className="mt-6 rounded-card-md border border-line bg-white px-4 py-3 font-body text-small text-ink">
          This is a plain-language summary written for a project in development. It is not legal advice.
        </p>

        <p className="mt-8 font-body text-body-lg text-ink/85">{intro}</p>
        {children}

        <p className="mt-12 border-t border-line pt-6 font-body text-small text-taupe">
          Questions about this page? Please use the{" "}
          <Link to="/contact" className="text-gold-800 underline underline-offset-4 hover:text-ink">
            contact page
          </Link>
          .
        </p>
      </div>
      </div>
    </div>
  );
}
