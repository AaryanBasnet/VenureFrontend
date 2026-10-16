import { useId, useState } from "react";
import { Plus } from "lucide-react";

/**
 * Accessible disclosure list: each question is a button with aria-expanded that controls its answer.
 * Enter/Space toggle (native button). Several answers can be open at once.
 */
export default function FaqList({ items }) {
  const baseId = useId();
  const [open, setOpen] = useState(() => new Set());

  const toggle = (index) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <ul className="divide-y divide-line border-y border-line">
      {items.map((item, index) => {
        const isOpen = open.has(index);
        const buttonId = `${baseId}-q${index}`;
        const panelId = `${baseId}-a${index}`;
        return (
          <li key={item.question}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-6 py-5 text-left font-display text-h5 font-light text-ink hover:text-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                <span>{item.question}</span>
                <Plus
                  aria-hidden="true"
                  className={`size-5 shrink-0 text-gold-800 transition-transform duration-300 motion-reduce:transition-none ${isOpen ? "rotate-45" : ""}`}
                  strokeWidth={1.5}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="pb-6 pr-10 font-body text-body text-gold-800"
            >
              {item.answer}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
