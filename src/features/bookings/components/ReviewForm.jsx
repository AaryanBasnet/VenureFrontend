import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addReview } from "../../../api/reviews";
import { apiError } from "../../inquiry/hooks/useInquiries";
import { errorClass, inputClass, labelClass } from "../../../components/ui/formStyles";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

// A guest reviews one completed booking. The backend accepts one review per booking.
export default function ReviewForm({ booking }) {
  const qc = useQueryClient();
  const venueId = booking.venue?._id;
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const send = useMutation({
    mutationFn: () => addReview(venueId, { bookingId: booking._id, rating, title: title.trim() || undefined, comment: comment.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", venueId] });
      qc.invalidateQueries({ queryKey: ["venue_detail"] });
    },
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError("Choose a star rating.");
    if (comment.trim().length < 10) return setError("Please write at least a sentence about your event.");
    setError("");
    try {
      await send.mutateAsync();
    } catch (err) {
      setError(apiError(err));
    }
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

  return (
    <form onSubmit={submit} noValidate className="mt-4 space-y-4 rounded-card-md bg-sand p-5">
      <div>
        <p id={`rating-${booking._id}`} className={labelClass}>Your rating</p>
        <div role="radiogroup" aria-labelledby={`rating-${booking._id}`} className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}, ${LABELS[n]}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="rounded p-1 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
            >
              <Star aria-hidden="true" className={`size-7 transition-colors ${n <= shown ? "fill-gold text-gold" : "text-stone"}`} strokeWidth={1.5} />
            </button>
          ))}
          <span aria-hidden="true" className="ml-2 font-body text-small text-taupe">{LABELS[shown]}</span>
        </div>
      </div>
      <div>
        <label htmlFor={`rt-${booking._id}`} className={labelClass}>Headline (optional)</label>
        <input id={`rt-${booking._id}`} maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label htmlFor={`rc-${booking._id}`} className={labelClass}>How was your event?</label>
        <textarea id={`rc-${booking._id}`} rows={4} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} className={inputClass} />
      </div>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <button type="submit" disabled={send.isPending} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-2.5 font-body text-button uppercase text-gold-50 hover:bg-gold-800 disabled:opacity-60">
        {send.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        Post review
      </button>
    </form>
  );
}
