import { ArrowRight, Loader2 } from "lucide-react";

/** Dark pill button with a circular gold icon badge (Figma "Primary action"). */
export default function AuthSubmitButton({ pending, pendingLabel, children, ...props }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="relative flex h-[54px] w-full cursor-pointer items-center justify-center rounded-xl bg-ink px-12 transition-colors hover:bg-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-70"
      {...props}
    >
      <span className="font-body text-body-lg font-medium text-paper-white">
        {pending ? pendingLabel : children}
      </span>
      <span className="absolute right-[11px] flex size-[30px] items-center justify-center rounded-full bg-gold-icon">
        {pending ? (
          <Loader2 aria-hidden="true" className="size-[15px] animate-spin text-white" strokeWidth={2} />
        ) : (
          <ArrowRight aria-hidden="true" className="size-[15px] text-white" strokeWidth={2} />
        )}
      </span>
    </button>
  );
}
