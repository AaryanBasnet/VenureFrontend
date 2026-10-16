import { useEffect, useRef, useState } from "react";
import { RESET_TITLE_ID } from "./ResetShell";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Modal shell for short account tasks (resetting a password from the sign-in page).
// It is a real dialog: it is named by the step heading, keeps Tab inside, closes on Escape, locks page scroll
// and hands focus back to whatever opened it.
export default function AuthDialog({ onClose, children }) {
  const ref = useRef(null);
  const mounted = useRef(false);
  // Read during the first render, before the step's own field takes focus
  const [opener] = useState(() => document.activeElement);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    mounted.current = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const items = [...ref.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !ref.current.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !ref.current.contains(document.activeElement))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      mounted.current = false;
      // Hand focus back only when the dialog really closed (not on a development-mode remount)
      window.setTimeout(() => {
        if (!mounted.current && opener instanceof HTMLElement && document.contains(opener)) opener.focus();
      }, 0);
    };
  }, [opener]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={RESET_TITLE_ID} className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
