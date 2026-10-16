import { Children, isValidElement, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { inputClass } from "./formStyles";

// Dropdown that matches the site's inputs. Callers write plain <option> children and an onChange that reads
// e.target.value, exactly like a native <select>; the list itself is a styled listbox that opens below
// (or above, near the bottom of the screen), scrolls when long and never gets clipped by a modal.
//   - Keyboard: Arrow keys, Home/End, type to jump, Enter or Space to choose, Escape to close.
//   - A visually hidden native <select> carries the id, name and value, so forms, labels and
//     automated tests that talk to a real <select> keep working.
const MAX_LIST = 288; // px, 18rem
const GAP = 6;

function readOptions(children) {
  const out = [];
  const walk = (nodes) =>
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) return;
      if (child.type === "option") {
        const label = Children.toArray(child.props.children).join("");
        out.push({ value: String(child.props.value ?? label), label, disabled: !!child.props.disabled });
      } else if (child.props?.children) {
        walk(child.props.children); // fragments and optgroups
      }
    });
  walk(children);
  return out;
}

export default function Select({
  className = inputClass,
  children,
  id,
  name,
  value,
  defaultValue,
  onChange,
  onBlur,
  disabled = false,
  required,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}) {
  const autoId = useId();
  const baseId = id || autoId;
  const listId = `${baseId}-list`;
  const options = useMemo(() => readOptions(children), [children]);

  const controlled = value !== undefined;
  const [inner, setInner] = useState(String(defaultValue ?? options[0]?.value ?? ""));
  const current = String(controlled ? value : inner);
  const selected = options.find((o) => o.value === current);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [place, setPlace] = useState(null);
  const [labelId, setLabelId] = useState(undefined);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const typed = useRef({ text: "", timer: 0 });

  // Name the control with the <label for="id"> that points at it
  useEffect(() => {
    if (!id) return;
    const label = document.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (!label) return;
    if (!label.id) label.id = `${id}-label`;
    setLabelId(label.id);
  }, [id]);

  const enabledIndexes = useMemo(() => options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0), [options]);

  const commit = useCallback(
    (index) => {
      const option = options[index];
      if (!option || option.disabled) return;
      if (!controlled) setInner(option.value);
      if (option.value !== current) onChange?.({ target: { value: option.value, name, id }, currentTarget: { value: option.value, name, id } });
      setOpen(false);
      buttonRef.current?.focus();
    },
    [options, controlled, current, onChange, name, id]
  );

  const openList = useCallback(() => {
    if (disabled) return;
    const at = options.findIndex((o) => o.value === current);
    setActive(at >= 0 ? at : (enabledIndexes[0] ?? 0));
    setOpen(true);
  }, [disabled, options, current, enabledIndexes]);

  // Position the list under the button (above it when there is no room), and follow scroll and resize
  const measure = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const below = window.innerHeight - rect.bottom - GAP - 8;
    const above = rect.top - GAP - 8;
    const wanted = Math.min(MAX_LIST, options.length * 44 + 8);
    const up = below < wanted && above > below;
    setPlace({
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(120, Math.min(MAX_LIST, up ? above : below)),
      ...(up ? { bottom: window.innerHeight - rect.top + GAP } : { top: rect.bottom + GAP }),
    });
  }, [options.length]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure]);

  // Close on a click or tap outside
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (buttonRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  // Keep the highlighted option in view
  useEffect(() => {
    if (open) document.getElementById(`${baseId}-opt-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [open, active, place, baseId]);

  const move = (step) => {
    const at = enabledIndexes.indexOf(active);
    const next = enabledIndexes[Math.min(enabledIndexes.length - 1, Math.max(0, at + step))];
    if (next !== undefined) setActive(next);
  };

  const typeahead = (char) => {
    const t = typed.current;
    window.clearTimeout(t.timer);
    t.text += char.toLowerCase();
    t.timer = window.setTimeout(() => {
      t.text = "";
    }, 600);
    const from = t.text.length === 1 ? enabledIndexes.indexOf(active) + 1 : Math.max(0, enabledIndexes.indexOf(active));
    const ordered = [...enabledIndexes.slice(from), ...enabledIndexes.slice(0, from)];
    const hit = ordered.find((i) => options[i].label.toLowerCase().startsWith(t.text));
    if (hit !== undefined) {
      if (!open) openList();
      setActive(hit);
    }
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    const printable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      } else if (printable) {
        typeahead(e.key);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Home":
        e.preventDefault();
        setActive(enabledIndexes[0] ?? 0);
        break;
      case "End":
        e.preventDefault();
        setActive(enabledIndexes[enabledIndexes.length - 1] ?? 0);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(active);
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        if (printable) typeahead(e.key);
    }
  };

  const showsPlaceholder = current === "" && /^(select|choose)\b/i.test(selected?.label ?? "");

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${baseId}-opt-${active}` : undefined}
        aria-labelledby={labelId}
        aria-label={labelId ? undefined : ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (!listRef.current?.contains(e.relatedTarget)) onBlur?.({ target: { name, id, value: current }, type: "blur" });
        }}
        className={`${className} flex items-center justify-between gap-3 pr-4 text-left ${showsPlaceholder ? "text-taupe" : ""} ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? ""}</span>
        <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-taupe transition-transform duration-200 ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
      </button>

      {/* Carries the form value, name and id for forms and tests; never reachable by keyboard or screen reader */}
      <select
        id={baseId}
        name={name}
        value={current}
        required={required}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onFocus={() => buttonRef.current?.focus()}
        onChange={(e) => {
          if (!controlled) setInner(e.target.value);
          onChange?.(e);
        }}
        className="pointer-events-none absolute bottom-0 left-0 size-px opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>

      {open &&
        place &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            aria-label={labelId ? undefined : ariaLabel}
            style={{ position: "fixed", left: place.left, width: place.width, top: place.top, bottom: place.bottom, maxHeight: place.maxHeight }}
            className="z-[80] overflow-y-auto overscroll-contain rounded-card-sm border border-border-strong bg-paper-white py-1 shadow-xl"
          >
            {options.map((o, i) => {
              const isSelected = o.value === current;
              return (
                <li
                  key={o.value}
                  id={`${baseId}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={o.disabled || undefined}
                  onPointerEnter={() => !o.disabled && setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(i)}
                  className={`flex min-h-11 items-center justify-between gap-3 px-4 py-2.5 font-body text-body ${
                    o.disabled ? "cursor-not-allowed text-taupe/70" : "cursor-pointer text-charcoal"
                  } ${i === active && !o.disabled ? "bg-sand" : ""} ${isSelected ? "font-medium" : ""}`}
                >
                  <span className="min-w-0 truncate">{o.label}</span>
                  {isSelected && <Check aria-hidden="true" className="size-4 shrink-0 text-gold-800" strokeWidth={2} />}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}
