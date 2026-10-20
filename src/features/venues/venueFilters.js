import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { categoryLabel, priceFormatter, spaceTypeLabel } from "./venueFormat";
import { SPACE_TYPE_LABELS, VENUE_TYPE_LABELS } from "./venueTypes";

export const PAGE_SIZE = 9;
export const CITIES = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Nagarkot", "Dhulikhel", "Chitwan"];
export const AMENITIES = ["Wifi", "Parking", "Air Conditioning", "Catering", "Sound System", "Garden", "Projector", "Lake View"];
export const GUEST_PRESETS = [50, 100, 200, 500];
// Price slider, in NPR per plate. The top of the slider means "no upper limit".
export const PRICE_MAX = 10000;
export const PRICE_STEP = 100;

// "newest" is the curated default and is never written to the URL.
export const SORT_OPTIONS = [
  { value: "newest", label: "Curated" },
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Top rated" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];
const SORT_VALUES = SORT_OPTIONS.map((s) => s.value);

const whole = (value, digits) => (new RegExp(`^[1-9][0-9]{0,${digits - 1}}$`).test(value ?? "") ? value : "");

// Reads every filter from the URL. Anything malformed is dropped rather than sent to the API.
export function readFilters(params) {
  const sortParam = params.get("sort") ?? "";
  let minPrice = whole(params.get("minPrice"), 7);
  let maxPrice = whole(params.get("maxPrice"), 7);
  if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) [minPrice, maxPrice] = [maxPrice, minPrice];
  // Only known values reach the API. An older link such as ?category=garden-estates (that was a venue category
  // before it became a kind of space) still works: it is read as the space type it is now.
  const categoryParam = params.get("category") ?? "";
  const spaceParam = params.get("spaceType") ?? "";
  const isSpaceType = (v) => Object.hasOwn(SPACE_TYPE_LABELS, v);
  const spaceType = isSpaceType(spaceParam) ? spaceParam : isSpaceType(categoryParam) ? categoryParam : "";
  return {
    q: params.get("q") ?? "",
    city: params.get("city") ?? "",
    category: Object.hasOwn(VENUE_TYPE_LABELS, categoryParam) ? categoryParam : "",
    spaceType,
    guests: whole(params.get("guests"), 6),
    minPrice,
    maxPrice,
    sort: SORT_VALUES.includes(sortParam) ? sortParam : "newest",
    amenities: (params.get("amenities") ?? "").split(",").filter(Boolean),
    page: Math.max(parseInt(params.get("page")) || 1, 1),
  };
}

// The query the venues API understands (the search text is called `search` there).
export function toApiFilters(f) {
  return {
    search: f.q || undefined,
    city: f.city || undefined,
    category: f.category || undefined,
    spaceType: f.spaceType || undefined,
    guests: f.guests || undefined,
    minPrice: f.minPrice || undefined,
    maxPrice: f.maxPrice || undefined,
    amenities: f.amenities.join(",") || undefined,
    sort: f.sort !== "newest" ? f.sort : undefined,
    page: f.page,
    limit: PAGE_SIZE,
  };
}

export const priceLabel = (f) => {
  const fmt = (n) => `NPR ${priceFormatter.format(Number(n))}`;
  if (f.minPrice && f.maxPrice) return `${fmt(f.minPrice)} to ${fmt(f.maxPrice)} per plate`;
  if (f.minPrice) return `From ${fmt(f.minPrice)} per plate`;
  if (f.maxPrice) return `Up to ${fmt(f.maxPrice)} per plate`;
  return "";
};

// One removable chip per active filter: `clear` is the URL patch that removes it.
export function activeChips(f) {
  const chips = [];
  if (f.q) chips.push({ key: "q", label: `“${f.q}”`, clear: { q: "" } });
  if (f.city) chips.push({ key: "city", label: f.city, clear: { city: "" } });
  if (f.category) chips.push({ key: "category", label: categoryLabel(f.category) ?? f.category, clear: { category: "" } });
  if (f.spaceType) chips.push({ key: "spaceType", label: spaceTypeLabel(f.spaceType) ?? f.spaceType, clear: { spaceType: "" } });
  if (f.guests) chips.push({ key: "guests", label: `${priceFormatter.format(Number(f.guests))}+ guests`, clear: { guests: "" } });
  if (f.minPrice || f.maxPrice) chips.push({ key: "price", label: priceLabel(f), clear: { minPrice: "", maxPrice: "" } });
  f.amenities.forEach((a) => chips.push({ key: `amenity-${a}`, label: a, clear: { amenities: f.amenities.filter((x) => x !== a).join(",") } }));
  return chips;
}

// Filters live in the URL, so a search can be shared, bookmarked and stepped back through. `replace` keeps typing out of the history.
export function useVenueFilters() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => readFilters(params), [params]);

  // An older link with ?category=garden-estates is rewritten to ?spaceType=garden-estates so the chip and the clear button agree with the address bar.
  useEffect(() => {
    const legacy = params.get("category");
    if (legacy && Object.hasOwn(SPACE_TYPE_LABELS, legacy)) {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("category");
          if (!next.get("spaceType")) next.set("spaceType", legacy);
          return next;
        },
        { replace: true }
      );
    }
  }, [params, setParams]);

  const update = useCallback(
    (patch, { replace = false } = {}) => {
      // Start from the address bar, not from the last render: two quick choices (a type, then a kind of space) must both
      // survive even when the first update has not been rendered yet.
      const next = new URLSearchParams(window.location.search);
      Object.entries(patch).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
      if (!("page" in patch)) next.delete("page");
      setParams(next, { replace });
    },
    [setParams]
  );

  // Removes every filter but keeps the chosen sort order.
  const clear = useCallback(() => {
    setParams((prev) => (prev.get("sort") ? new URLSearchParams({ sort: prev.get("sort") }) : new URLSearchParams()), { replace: true });
  }, [setParams]);

  return { filters, update, clear, chips: useMemo(() => activeChips(filters), [filters]) };
}
