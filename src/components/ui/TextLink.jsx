import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/** Uppercase underlined link with a trailing arrow ("Explore all venues →"). */
export default function TextLink({ to, className = "", children }) {
  return (
    <Link
      to={to}
      className={`group inline-flex min-h-11 items-center gap-1.5 font-body text-button uppercase text-ink transition-colors hover:text-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${className}`}
    >
      <span className="border-b border-ink pb-1 transition-colors group-hover:border-gold-800">{children}</span>
      <ArrowRight
        aria-hidden="true"
        className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
        strokeWidth={1.75}
      />
    </Link>
  );
}
