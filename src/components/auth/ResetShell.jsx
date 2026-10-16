import { createContext, useContext } from "react";
import { X } from "lucide-react";

// Card used by every step of resetting a password, whether it sits in a dialog on the sign-in page
// or on its own page. `onClose` adds the close button.
export const RESET_TITLE_ID = "reset-title";

// The step title is an h2 inside the dialog (the sign-in page has its own h1); on the stand-alone page it is the h1.
export const ResetHeadingContext = createContext("h2");

export default function ResetShell({ title, subtitle, onClose, children }) {
  const Heading = useContext(ResetHeadingContext);
  return (
    <div className="max-h-[calc(100dvh-2rem)] w-full overflow-y-auto rounded-2xl border border-border bg-paper-white shadow-xl">
      <div className="flex items-start justify-between gap-4 bg-ink px-6 py-5 sm:px-8 sm:py-6">
        <div>
          <Heading id={RESET_TITLE_ID} className="font-display text-h4 font-light text-paper-white">
            {title}
          </Heading>
          <p className="mt-1.5 font-body text-small text-paper-white/80">{subtitle}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 flex size-11 shrink-0 items-center justify-center rounded-full text-paper-white/80 transition-colors hover:bg-white/10 hover:text-paper-white focus-visible:outline-2 focus-visible:outline-paper-white"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        )}
      </div>
      <div className="px-6 py-6 sm:px-8">{children}</div>
    </div>
  );
}

// Secondary text button under a step's main action
export function ResetTextButton({ children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center justify-center px-2 font-body text-small font-medium text-gold-900 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-900 disabled:cursor-not-allowed disabled:text-taupe disabled:no-underline"
      {...props}
    >
      {children}
    </button>
  );
}
