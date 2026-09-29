import { ArrowRight, Loader2 } from "lucide-react";

/** Dark pill button with a circular gold icon badge (Figma "Primary action"). */
export default function AuthSubmitButton({ pending, pendingLabel, children, ...props }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="relative flex h-[54px] w-full items-center justify-center rounded-xl bg-ink px-[18px] transition-opacity disabled:opacity-70"
      {...props}
    >
      <span className="font-body text-[18px] font-semibold text-paper-white">
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
