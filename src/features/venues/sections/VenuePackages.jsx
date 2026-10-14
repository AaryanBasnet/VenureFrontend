import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import SectionHeading from "../../../components/ui/SectionHeading";
import { estimateForGuests, priceFormatter } from "../venueFormat";

function PackageCard({ pkg, guests, selected, onSelect }) {
  const { plates, total, minApplied } = estimateForGuests(pkg, guests);
  const dark = selected;

  return (
    <li
      className={`flex flex-col rounded-card-lg border p-6 transition-colors ${
        dark ? "border-ink bg-ink text-gold-50" : "border-line bg-white text-ink"
      }`}
    >
      {pkg.tagline && (
        <p className={`font-body text-eyebrow uppercase ${dark ? "text-gold-200" : "text-gold-800"}`}>{pkg.tagline}</p>
      )}
      <h3 className="mt-2 font-display text-h4 font-light">{pkg.name}</h3>
      <p className="mt-3 font-display text-h3 font-light">
        NPR {priceFormatter.format(pkg.pricePerPlate)}
        <span className={`ml-2 font-body text-caption ${dark ? "text-gold-200" : "text-taupe"}`}>per plate</span>
      </p>
      {pkg.minPlates > 1 && (
        <p className={`mt-1 font-body text-eyebrow uppercase ${dark ? "text-gold-200" : "text-taupe"}`}>
          Minimum {pkg.minPlates} plates
        </p>
      )}

      {pkg.highlights?.length > 0 && (
        <ul className={`mt-5 space-y-2.5 border-t pt-5 ${dark ? "border-white/20" : "border-line"}`}>
          {pkg.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2.5 font-body text-small">
              <CheckCircle2 aria-hidden="true" className={`mt-0.5 size-4 shrink-0 ${dark ? "text-gold" : "text-gold-800"}`} />
              {h}
            </li>
          ))}
        </ul>
      )}

      <div className={`mt-6 rounded-card-md p-4 ${dark ? "bg-white/10" : "bg-sand"}`}>
        <p className={`font-body text-eyebrow uppercase ${dark ? "text-gold-200" : "text-taupe"}`}>
          Estimate for {plates} {plates === 1 ? "plate" : "plates"}
        </p>
        <p className="mt-1 font-display text-h4 font-light">NPR {priceFormatter.format(Math.round(total))}</p>
        <p className={`mt-1 font-body text-caption ${dark ? "text-gold-200" : "text-taupe"}`}>
          Includes 13% VAT, drinks excluded{minApplied ? `, minimum ${pkg.minPlates} plates applied` : ""}
        </p>
      </div>

      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={`mt-5 rounded-full border px-5 py-3 font-body text-button uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
          dark
            ? "border-gold bg-gold text-ink hover:bg-gold-200 focus-visible:outline-white"
            : "border-ink text-ink hover:bg-ink hover:text-gold-50 focus-visible:outline-ink"
        }`}
      >
        {selected ? "Selected" : "Select this package"}
      </button>
    </li>
  );
}

function DrinkCard({ option, selected, onSelect }) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={`flex h-full w-full flex-col rounded-card-lg border p-6 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
          selected ? "border-gold bg-gold-50 shadow-[0_0_0_1px_var(--color-gold)]" : "border-line bg-white hover:border-ink"
        }`}
      >
        <span className="font-body text-eyebrow uppercase text-gold-800">{selected ? "Selected" : "Drinks"}</span>
        <span className="mt-2 font-display text-h4 font-light text-ink">{option.name}</span>
        {option.description && <span className="mt-1 font-body text-small text-taupe">{option.description}</span>}
        {option.items?.length > 0 && (
          <ul className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-2">
            {option.items.map((item) => (
              <li key={item} className="flex items-start gap-2 font-body text-caption text-ink">
                <CheckCircle2 aria-hidden="true" className="mt-px size-3.5 shrink-0 text-gold-800" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </button>
    </li>
  );
}

// Figma 385:316 "Food packages" and "Choose drinks for your event". Venues price per plate by
// package. Choices here are a preference sent with the request, not a booking: the venue
// confirms the menu and the final price in its quotation.
export default function VenuePackages({ packages = [], drinkOptions = [], selectedPackage, onSelectPackage, selectedDrink, onSelectDrink }) {
  const [guests, setGuests] = useState(100);
  if (packages.length === 0 && drinkOptions.length === 0) return null;

  return (
    <section id="menu" aria-labelledby="menu-title" className="scroll-mt-[calc(var(--spacing-header)+72px)] bg-cream py-16 lg:py-[88px]">
      <div className="container-site">
        {packages.length > 0 && (
          <>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading
                id="menu-title"
                eyebrow="Food packages"
                title="Choose your"
                accent="celebration feast"
                className="[&_h2]:text-h2"
              />
              <div className="flex flex-col gap-2 lg:max-w-xs">
                <label htmlFor="guest-estimate" className="font-body text-eyebrow uppercase text-taupe">
                  Estimate for how many guests?
                </label>
                <input
                  id="guest-estimate"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="5000"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-40 rounded-card-sm border border-border-strong bg-white px-4 py-3 font-body text-body text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                />
                <p className="font-body text-caption text-taupe">
                  A guide only. Your choice is sent with your request, and the venue confirms the final menu and price.
                </p>
              </div>
            </div>
            <ul className="mt-10 grid gap-5 lg:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg._id ?? pkg.name}
                  pkg={pkg}
                  guests={guests}
                  selected={selectedPackage === (pkg._id ?? pkg.name)}
                  onSelect={() => onSelectPackage(selectedPackage === (pkg._id ?? pkg.name) ? null : pkg._id ?? pkg.name)}
                />
              ))}
            </ul>
          </>
        )}

        {drinkOptions.length > 0 && (
          <div className={packages.length ? "mt-16" : ""}>
            <h2 id={packages.length ? undefined : "menu-title"} className="font-display text-h3 font-light text-ink">
              Choose drinks for your event
            </h2>
            <p className="mt-2 font-body text-small text-taupe">
              Drinks are added on their own and are not part of a food package.
            </p>
            <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drinkOptions.map((option) => {
                const key = option._id ?? option.name;
                return (
                  <DrinkCard
                    key={key}
                    option={option}
                    selected={selectedDrink === key}
                    onSelect={() => onSelectDrink(selectedDrink === key ? null : key)}
                  />
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
