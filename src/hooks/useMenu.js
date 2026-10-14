import { useCallback, useEffect, useId, useRef, useState } from "react";

// Behaviour shared by the header pop-up menus (account menu, notifications), so they all work the same way:
//  - opens and closes from the trigger button; only one menu is open at a time
//  - closes on Escape (focus goes back to the trigger), on a click or tap outside, and when focus tabs out
//  - ArrowDown / ArrowUp / Home / End move through the items marked with data-menu-item
//  - opened with the keyboard, focus lands on the first item
// Usage: const m = useMenu(); <div ref={m.rootRef} onKeyDown={m.onKeyDown}> <button ref={m.buttonRef} onClick={m.toggle} .../> {m.open && <div id={m.panelId}>...</div>} </div>
export function useMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const viaKeyboard = useRef(false);
  const id = useId();

  const close = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  }, []);

  const toggle = useCallback((e) => {
    viaKeyboard.current = e?.detail === 0; // a keyboard "click" has no pointer
    setOpen((o) => !o);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    const onFocusIn = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    const onOther = (e) => e.detail !== id && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("focusin", onFocusIn);
    window.addEventListener("venure:menu-open", onOther);
    window.dispatchEvent(new CustomEvent("venure:menu-open", { detail: id }));
    if (viaKeyboard.current) rootRef.current?.querySelector("[data-menu-item]")?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("venure:menu-open", onOther);
    };
  }, [open, id]);

  const onKeyDown = useCallback(
    (e) => {
      if (!open) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        close(true);
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
      const items = [...(rootRef.current?.querySelectorAll("[data-menu-item]") ?? [])];
      if (items.length === 0) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement);
      const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : e.key === "ArrowDown" ? (i + 1) % items.length : (i <= 0 ? items.length : i) - 1;
      items[next].focus();
    },
    [open, close]
  );

  return { open, close, toggle, rootRef, buttonRef, onKeyDown, panelId: `menu-${id.replace(/:/g, "")}` };
}
