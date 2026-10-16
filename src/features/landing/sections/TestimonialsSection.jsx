import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import SectionHeading from "../../../components/ui/SectionHeading";
import api from "../../../api/api";
import { useLanding } from "../hooks/useLanding";

// Real guest reviews that an admin has featured. The backend only features reviews of completed
// bookings, so nothing here is invented. With none featured the whole section stays out of the page.
const useFeaturedReviews = () =>
  useQuery({
    queryKey: ["featured-reviews"],
    queryFn: async () => (await api.get("/featured")).data.data ?? [],
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "G";
const shorten = (text, max = 240) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

export default function TestimonialsSection() {
  const { testimonialsIntro } = useLanding().content;
  const { data: reviews = [] } = useFeaturedReviews();
  if (reviews.length === 0) return null;
  const shown = reviews.slice(0, 3);

  return (
    <section id="testimonials" aria-labelledby="testimonials-title" className="bg-sand py-16 lg:py-[74px]">
      <div className="container-site">
        <SectionHeading id="testimonials-title" eyebrow={testimonialsIntro.eyebrow} title={testimonialsIntro.title} accent={testimonialsIntro.accent} />
        <ul className={`mt-10 grid grid-cols-1 gap-5 lg:mt-12 ${shown.length === 1 ? "max-w-xl" : shown.length === 2 ? "sm:grid-cols-2 lg:max-w-4xl" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {shown.map((r) => (
            <li key={r._id} className="flex flex-col rounded-card-lg border border-line bg-cream p-7">
              <span role="img" aria-label={`${r.rating} out of 5 stars`} className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} aria-hidden="true" className={`size-4 ${n <= r.rating ? "fill-gold text-gold" : "text-line"}`} />
                ))}
              </span>
              <blockquote className="mt-5 flex-1 font-display text-h5 font-light italic text-ink">&ldquo;{shorten(r.comment)}&rdquo;</blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold-100 font-body text-body text-gold-800">
                  {initials(r.user?.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-body text-body text-ink">{r.user?.name ?? "A guest"}</p>
                  <p className="truncate font-body text-caption text-taupe">{[r.venue?.venueName, r.venue?.location?.city].filter(Boolean).join(", ")}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
