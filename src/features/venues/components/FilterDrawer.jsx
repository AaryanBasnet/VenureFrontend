import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Bottom sheet for the filters on small screens. Focus stays inside while it is open, Escape closes it,
// the page behind cannot scroll, and focus returns to the button that opened it.
export default function FilterDrawer({ open, onClose, children }) {
  const sheet = useRef(null);
  const opener = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    opener.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    sheet.current?.querySelector(FOCUSABLE)?.focus();

    const onKey = (e) => {
      // A dropdown inside the sheet closes itself on Escape first
      if (e.key === "Escape" && !e.defaultPrevented && !document.querySelector('[role="listbox"]')) {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !sheet.current) return;
      const items = [...sheet.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-ink/50" />
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col rounded-t-card-lg bg-cream shadow-2xl"
      >
        <div className="flex items-center justify-end px-3 pt-2">
          <button type="button" onClick={onClose} aria-label="Close filters" className="flex size-11 items-center justify-center rounded-full text-ink hover:bg-sand focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ink">
            <X aria-hidden="true" className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 pb-3">{children}</div>
      </div>
    </div>
  );
}
