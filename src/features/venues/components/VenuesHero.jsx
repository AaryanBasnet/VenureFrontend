import { MapPin, Search, Users } from "lucide-react";
import ResponsiveImage from "../../../components/ui/ResponsiveImage";
import Select from "../../../components/ui/Select";
import { images } from "../../../assets/landing/images";
import { CITIES } from "../venueFilters";
import { digitsOnly, useDebouncedField } from "../hooks/useDebouncedField";

const fieldLabel = "block font-body text-eyebrow uppercase text-taupe";
const bare =
  "w-full min-w-0 rounded-sm bg-transparent py-0.5 font-body text-body text-charcoal placeholder:text-taupe focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink";

// Page hero with the floating search bar. City applies at once; the guest count follows after a short pause;
// "Search spaces" takes the visitor to the results.
export default function VenuesHero({ city, guests, onChange, onSearch }) {
  const [guestsText, setGuestsText] = useDebouncedField(guests, digitsOnly, (v) => onChange({ guests: v }, { replace: true }));

  return (
    <section aria-labelledby="venues-title" className="relative isolate overflow-hidden bg-ink">
      <ResponsiveImage image={images.heritageCourtyards} alt="" sizes="100vw" priority className="absolute inset-0 -z-20 size-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-[rgb(10_6_3/0.45)] via-[rgb(10_6_3/0.45)] to-[rgb(10_6_3/0.8)]" />

      <div className="container-site py-12 text-white lg:py-16">
        <p className="font-body text-eyebrow uppercase text-gold-200">Bookable spaces</p>
        <h1 id="venues-title" className="mt-4 max-w-3xl font-display text-h2 font-light text-gold-50 lg:text-display">
          Find a place <em className="font-light text-gold-200">worth gathering in</em>
        </h1>
        <p className="mt-4 max-w-xl font-body text-body-lg font-light text-white/90">
          Handpicked heritage homes, gardens and mountain hideaways across Nepal, each ready to become the setting for your occasion.
        </p>

        <form
          role="search"
          aria-label="Find a venue"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch();
          }}
          className="mt-8 grid gap-1 rounded-card-lg bg-cream p-2 text-ink shadow-[0_18px_42px_rgb(31_20_8/0.35)] md:mt-10 md:grid-cols-[1.4fr_1fr_auto] md:items-center md:gap-0 md:rounded-full"
        >
          <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-1">
            <MapPin aria-hidden="true" className="size-5 shrink-0 text-gold-800" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <label htmlFor="hero-city" className={fieldLabel}>Where</label>
              <Select id="hero-city" value={city} onChange={(e) => onChange({ city: e.target.value })} className={bare}>
                <option value="">All of Nepal</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-line px-4 py-3 md:border-l md:border-t-0 md:px-6 md:py-1">
            <Users aria-hidden="true" className="size-5 shrink-0 text-gold-800" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <label htmlFor="hero-guests" className={fieldLabel}>Guests</label>
              <input
                id="hero-guests"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={guestsText}
                onChange={(e) => setGuestsText(e.target.value.replace(/\D/g, ""))}
                placeholder="Add guests"
                autoComplete="off"
                className={bare}
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-gold-800 bg-gold-800 px-7 font-body text-button uppercase text-white transition-colors hover:border-gold hover:bg-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:ml-2 md:mt-0"
          >
            Search spaces <Search aria-hidden="true" className="size-4" strokeWidth={1.75} />
          </button>
        </form>
      </div>
    </section>
  );
}
