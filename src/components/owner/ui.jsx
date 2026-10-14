import { Link } from "react-router-dom";

// Building blocks shared by every owner page, so the whole area reads as one product.
// They follow the customer site: cream surfaces, white cards, ink text, gold accents, Fraunces headings.

// Page title row: small gold label, big serif title, optional text and actions on the right.
export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="font-body text-eyebrow uppercase text-gold-800">{eyebrow}</p>}
        <h1 className="mt-1 font-display text-h2 font-light text-ink">{title}</h1>
        {description && <p className="mt-2 max-w-2xl font-body text-body text-taupe">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

// White card with an optional heading row.
export function Panel({ title, description, action, children, className = "", bodyClassName = "" }) {
  return (
    <section className={`rounded-card-lg border border-line bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div>
            {title && <h2 className="font-display text-h5 font-light text-ink">{title}</h2>}
            {description && <p className="mt-0.5 font-body text-caption text-taupe">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClassName || "p-6"}>{children}</div>
    </section>
  );
}

// One headline number. Links to the page behind it when `to` is set.
export function Stat({ label, value, hint, icon: Icon, to, loading }) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="font-body text-eyebrow uppercase text-taupe">{label}</p>
        {Icon && <Icon aria-hidden="true" className="size-5 text-gold-800" strokeWidth={1.5} />}
      </div>
      {loading ? (
        <div className="mt-3 h-9 w-24 animate-pulse rounded bg-gold-100" />
      ) : (
        <p className="mt-2 font-display text-[2rem] font-light leading-none text-ink">{value}</p>
      )}
      {hint && <p className="mt-2 font-body text-caption text-taupe">{hint}</p>}
    </>
  );
  const cls = "block rounded-card-lg border border-line bg-white p-5";
  return to ? (
    <Link to={to} className={`${cls} transition-colors hover:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const PILL_TONES = {
  success: "bg-success/10 text-success",
  gold: "bg-gold-100 text-gold-800",
  neutral: "bg-sand text-taupe",
  danger: "bg-red-50 text-red-700",
};

export function Pill({ tone = "neutral", children }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-body text-caption font-medium ${PILL_TONES[tone]}`}>{children}</span>;
}

// Booking and inquiry statuses in plain words, with one colour language across the area.
const STATUS = {
  confirmed: ["Confirmed", "success"],
  completed: ["Completed", "neutral"],
  cancelled: ["Cancelled", "danger"],
  pending_deposit: ["Deposit due", "gold"],
  pending: ["Needs a reply", "gold"],
  quoted: ["Quote sent", "neutral"],
  accepted: ["Accepted, deposit due", "gold"],
  booked: ["Booked", "success"],
  declined: ["Declined", "danger"],
  expired: ["Expired", "neutral"],
};
export function StatusPill({ status }) {
  const [label, tone] = STATUS[status] ?? [String(status ?? "").replace(/_/g, " "), "neutral"];
  return <Pill tone={tone}>{label}</Pill>;
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <span className="flex size-12 items-center justify-center rounded-full bg-gold-100">
          <Icon aria-hidden="true" className="size-5 text-gold-800" strokeWidth={1.5} />
        </span>
      )}
      <p className="mt-4 font-display text-h5 font-light text-ink">{title}</p>
      {children && <p className="mt-1 max-w-sm font-body text-small text-taupe">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function RowsSkeleton({ rows = 3 }) {
  return (
    <div role="status" aria-label="Loading" className="space-y-3 p-6">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-card-sm bg-gold-100" />
      ))}
    </div>
  );
}

export function ErrorState({ onRetry, children = "We could not load this. Please try again." }) {
  return (
    <div role="alert" className="px-6 py-10 text-center">
      <p className="font-body text-small text-red-700">{children}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 font-body text-button uppercase text-gold-800 underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  );
}
