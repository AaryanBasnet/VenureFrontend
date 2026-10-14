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
      <h3 className="mt-2 font-display text-h4 font-light [overflow-wrap:anywhere]">{pkg.name}</h3>
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
          {pkg.highlights.map((h, i) => (
            <li key={`${h}-${i}`} className="flex items-start gap-2.5 font-body text-small">
              <CheckCircle2 aria-hidden="true" className={`mt-0.5 size-4 shrink-0 ${dark ? "text-gold" : "text-gold-800"}`} />
              {h}
            </li>
          ))}
        </ul>
      )}

      <div className={`mb-5 mt-6 rounded-card-md p-4 ${dark ? "bg-white/10" : "bg-sand"}`}>
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
        aria-label={`${selected ? "Selected" : "Select this package"}: ${pkg.name}`}
        onClick={onSelect}
        className={`mt-auto min-h-11 rounded-full border px-5 py-3 font-body text-button uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
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
    <li
      className={`relative flex flex-col rounded-card-lg border p-6 transition-colors has-[button:focus-visible]:outline-2 has-[button:focus-visible]:outline-offset-2 has-[button:focus-visible]:outline-ink ${
        selected ? "border-gold bg-gold-50 shadow-[0_0_0_1px_var(--color-gold)]" : "border-line bg-white hover:border-ink"
      }`}
    >
      <p className="font-body text-eyebrow uppercase text-gold-800">{selected ? "Selected" : "Drinks"}</p>
      <h3 className="mt-2 font-display text-h4 font-light text-ink">
        <button
          type="button"
          aria-pressed={selected}
          onClick={onSelect}
          className="text-left after:absolute after:inset-0 after:rounded-card-lg focus-visible:outline-none [overflow-wrap:anywhere]"
        >
          {option.name}
        </button>
      </h3>
      {option.description && <p className="mt-1 font-body text-small text-taupe">{option.description}</p>}
      {option.items?.length > 0 && (
        <ul className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-2">
          {option.items.map((item, i) => (
            <li key={`${item}-${i}`} className="flex items-start gap-2 font-body text-caption text-ink">
              <CheckCircle2 aria-hidden="true" className="mt-px size-3.5 shrink-0 text-gold-800" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

// Figma 385:316 "Food packages" and "Choose drinks for your event". Venues price per plate by
// package. Choices here are a preference sent with the request, not a booking: the venue
// confirms the menu and the final price in its quotation.
export default function VenuePackages({ packages = [], drinkOptions = [], selectedPackage, onSelectPackage, selectedDrink, onSelectDrink, onRequest }) {
  const [guests, setGuests] = useState(100);
  if (packages.length === 0 && drinkOptions.length === 0) return null;

  const keyOf = (item) => item._id ?? item.name;
  const chosenPackage = packages.find((p) => keyOf(p) === selectedPackage);
  const chosenDrink = drinkOptions.find((d) => keyOf(d) === selectedDrink);
  const packageColumns = packages.length === 1 ? "lg:grid-cols-1 lg:max-w-md" : packages.length === 2 ? "lg:grid-cols-2 lg:max-w-4xl" : "lg:grid-cols-3";

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
                  onChange={(e) => setGuests(e.target.value === "" ? "" : String(Math.min(Math.max(Number(e.target.value) || 1, 1), 5000)))}
                  className="min-h-11 w-40 rounded-card-sm border border-border-strong bg-white px-4 py-3 font-body text-body text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                />
                <p className="font-body text-caption text-taupe">
                  A guide only. Your choice is sent with your request, and the venue confirms the final menu and price.
                </p>
              </div>
            </div>
            <ul className={`mt-10 grid gap-5 ${packageColumns}`}>
              {packages.map((pkg) => (
                <PackageCard
                  key={keyOf(pkg)}
                  pkg={pkg}
                  guests={guests}
                  selected={selectedPackage === keyOf(pkg)}
                  onSelect={() => onSelectPackage(selectedPackage === keyOf(pkg) ? null : keyOf(pkg))}
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
              {drinkOptions.map((option) => (
                <DrinkCard
                  key={keyOf(option)}
                  option={option}
                  selected={selectedDrink === keyOf(option)}
                  onSelect={() => onSelectDrink(selectedDrink === keyOf(option) ? null : keyOf(option))}
                />
              ))}
            </ul>
          </div>
        )}

        {(chosenPackage || chosenDrink) && (
          <div role="status" className="mt-10 flex flex-col gap-4 rounded-card-lg border border-gold bg-gold-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-body text-small text-ink">
              <span className="font-medium">Your choice:</span>{" "}
              {[chosenPackage?.name, chosenDrink?.name].filter(Boolean).join(" with ")}
              <span className="block text-caption text-taupe">It is sent with your request. The venue confirms the final menu and price.</span>
            </p>
            {onRequest && (
              <button
                type="button"
                onClick={onRequest}
                className="min-h-11 shrink-0 rounded-full bg-ink px-6 py-3 font-body text-button uppercase text-gold-50 transition-colors hover:bg-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Request a date
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
