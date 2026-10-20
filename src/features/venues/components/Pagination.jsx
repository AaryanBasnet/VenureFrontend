import { ChevronLeft, ChevronRight } from "lucide-react";
import { plural } from "../../../utils/plural";

const pageBtn =
  "flex size-11 items-center justify-center rounded-full border border-border-strong font-body text-small text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border-strong";

// "Showing 1–9 of 28 venues" on the left, page buttons on the right (stacked on a phone).
export default function Pagination({ page, totalPages, total, shown, pageSize, onPage, noun = "venue" }) {
  if (total === 0) return null;
  const numbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1);
  const from = (page - 1) * pageSize + 1;

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p className="font-body text-small text-taupe">
        {total <= shown ? `Showing all ${plural(total, noun)}` : `Showing ${from}–${from + shown - 1} of ${plural(total, noun)}`}
      </p>
      {totalPages > 1 && (
        <nav aria-label="Pages" className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page" className={pageBtn}>
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          {numbers.map((n, i) => (
            <span key={n} className="flex items-center gap-2">
              {i > 0 && n - numbers[i - 1] > 1 && <span aria-hidden="true" className="text-taupe">…</span>}
              <button
                type="button"
                aria-current={n === page ? "page" : undefined}
                aria-label={`Page ${n}`}
                onClick={() => onPage(n)}
                className={`${pageBtn} ${n === page ? "!border-ink bg-ink text-gold-50" : ""}`}
              >
                {n}
              </button>
            </span>
          ))}
          <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page" className={pageBtn}>
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </nav>
      )}
    </div>
  );
}
