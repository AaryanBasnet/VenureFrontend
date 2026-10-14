import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addReview } from "../../../api/reviews";
import { apiError } from "../../inquiry/hooks/useInquiries";
import { errorClass, inputClass, labelClass } from "../../../components/ui/formStyles";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
const MIN_COMMENT = 10;

// A guest reviews one completed booking. The backend accepts one review per booking.
export default function ReviewForm({ booking, onClose }) {
  const qc = useQueryClient();
  const venueId = booking.venue?._id;
  const groupRef = useRef(null);
  const commentRef = useRef(null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState("");

  const send = useMutation({
    mutationFn: () => addReview(venueId, { bookingId: booking._id, rating, title: title.trim() || undefined, comment: comment.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", venueId] });
      qc.invalidateQueries({ queryKey: ["venue_detail"] });
    },
  });

  const ratingError = tried && !rating ? "Choose a star rating from 1 to 5." : "";
  const commentError = tried && comment.trim().length < MIN_COMMENT ? `Write at least ${MIN_COMMENT} characters about your event.` : "";

  const submit = async (e) => {
    e.preventDefault();
    setTried(true);
    if (!rating) return groupRef.current?.querySelector('[tabindex="0"]')?.focus();
    if (comment.trim().length < MIN_COMMENT) return commentRef.current?.focus();
    setServerError("");
    try {
      await send.mutateAsync();
    } catch (err) {
      setServerError(apiError(err));
    }
  };

  // Arrow keys move the rating like a native radio group; the checked star is the one tab stop.
  const onKeyDown = (e) => {
    const delta = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      pick(e.key === "Home" ? 1 : 5);
    } else if (delta) {
      e.preventDefault();
      pick(Math.min(5, Math.max(1, (rating || (delta > 0 ? 0 : 6)) + delta)));
    }
  };
  const pick = (n) => {
    setRating(n);
    requestAnimationFrame(() => groupRef.current?.querySelector(`[data-star="${n}"]`)?.focus());
  };

  if (send.isSuccess) {
    return (
      <div role="status" className="mt-4 rounded-card-md bg-sand p-4 font-body text-small text-ink">
        Thank you. Your review is now on the venue page.{" "}
        <Link to={`/venue/${venueId}#reviews`} className="text-gold-800 underline underline-offset-4">See it</Link>
      </div>
    );
  }

  const shown = hover || rating;
  const ratingId = `rating-${booking._id}`;

  return (
    <form onSubmit={submit} noValidate aria-label="Review this event" className="mt-4 space-y-4 rounded-card-md bg-sand p-5">
      <div>
        <p id={ratingId} className={labelClass}>Your rating</p>
        <div
          ref={groupRef}
          role="radiogroup"
          aria-labelledby={ratingId}
          aria-required="true"
          aria-invalid={!!ratingError}
          aria-describedby={ratingError ? `${ratingId}-error` : undefined}
          className="flex items-center gap-1"
          onMouseLeave={() => setHover(0)}
          onKeyDown={onKeyDown}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              data-star={n}
              aria-checked={rating === n}
              tabIndex={rating === n || (!rating && n === 1) ? 0 : -1}
              aria-label={`${n} ${n > 1 ? "stars" : "star"}, ${LABELS[n]}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="inline-flex size-11 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
            >
              <Star aria-hidden="true" className={`size-7 transition-colors ${n <= shown ? "fill-gold text-gold" : "text-taupe-light"}`} strokeWidth={1.5} />
            </button>
          ))}
          <span aria-hidden="true" className="ml-2 min-w-20 font-body text-small text-taupe">{LABELS[shown]}</span>
        </div>
        {ratingError && <p id={`${ratingId}-error`} role="alert" className={errorClass}>{ratingError}</p>}
      </div>
      <div>
        <label htmlFor={`rt-${booking._id}`} className={labelClass}>Headline (optional)</label>
        <input id={`rt-${booking._id}`} maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor={`rc-${booking._id}`} className={labelClass}>How was your event?</label>
        <textarea
          ref={commentRef}
          id={`rc-${booking._id}`}
          rows={4}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          aria-invalid={!!commentError}
          aria-describedby={commentError ? `rc-${booking._id}-error` : undefined}
          className={inputClass}
        />
        {commentError ? (
          <p id={`rc-${booking._id}-error`} role="alert" className={errorClass}>{commentError}</p>
        ) : (
          <p className="mt-1.5 text-right font-body text-caption text-taupe">{comment.length} of 1000 characters</p>
        )}
      </div>
      {serverError && <p role="alert" className={errorClass}>{serverError}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={send.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-6 py-2.5 font-body text-button uppercase text-gold-50 hover:bg-gold-800 disabled:opacity-60">
          {send.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
          {send.isPending ? "Posting" : "Post review"}
        </button>
        {onClose && (
          <button type="button" onClick={onClose} disabled={send.isPending} className="inline-flex min-h-11 items-center px-2 font-body text-small text-taupe underline underline-offset-4 hover:text-ink">
            Not now
          </button>
        )}
      </div>
    </form>
  );
}
