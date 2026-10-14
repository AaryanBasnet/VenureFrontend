import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/** Uppercase underlined link with a trailing arrow ("Explore all venues →"). */
export default function TextLink({ to, className = "", children }) {
  return (
    <Link
      to={to}
      className={`group relative inline-flex items-center gap-1.5 border-b after:absolute after:inset-x-0 after:-inset-y-3 after:content-[''] border-ink pb-1 font-body text-button uppercase text-ink transition-colors hover:border-gold-800 hover:text-gold-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ${className}`}
    >
      {children}
      <ArrowRight
        aria-hidden="true"
        className="size-3 transition-transform duration-300 group-hover:translate-x-0.5"
        strokeWidth={1.75}
      />
    </Link>
  );
}
