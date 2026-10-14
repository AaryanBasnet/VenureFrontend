export const priceFormatter = new Intl.NumberFormat("en-IN");

const CATEGORY_LABELS = {
  "heritage-courtyards": "Heritage courtyard",
  "garden-estates": "Garden estate",
  "intimate-halls": "Intimate hall",
  "mountain-retreats": "Mountain retreat",
  "rooftop-terraces": "Rooftop terrace",
};

export const categoryLabel = (slug) => CATEGORY_LABELS[slug] ?? null;

export const SHIFT_LABELS = { day: "Day", night: "Night", full_day: "Full day" };

export const locationLine = (location) =>
  [location?.city, location?.state].filter(Boolean).join(", ");

export const mapsUrl = (venue) => {
  const [lng, lat] = venue.geoCoordinates?.coordinates ?? [];
  const query =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? `${lat},${lng}`
      : [venue.venueName, venue.location?.address, venue.location?.city].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

// First sentence (or first ~140 chars) of the description, for the hero tagline.
export const tagline = (description = "") => {
  const first = description.split(/(?<=[.!?])\s/)[0] ?? "";
  return first.length > 160 ? `${first.slice(0, 157).trimEnd()}…` : first;
};

// Page sections reachable from the sticky nav (ids match the section elements).
export const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "spaces", label: "Halls & spaces" },
  { id: "menu", label: "Menu" },
  { id: "location", label: "Location" },
  { id: "reviews", label: "Reviews" },
];

// Nepal: VAT is 13%. Venues may add a service charge on top; the venue's quote is the final price.
export const VAT_RATE = 0.13;

export const cheapestPlatePrice = (venue) => {
  const prices = (venue?.packages ?? []).map((p) => p.pricePerPlate).filter((p) => p > 0);
  return prices.length ? Math.min(...prices) : 0;
};

export const estimateForGuests = (pkg, guests) => {
  const plates = Math.max(Number(guests) || 0, pkg.minPlates ?? 1);
  const subtotal = plates * pkg.pricePerPlate;
  return { plates, total: subtotal * (1 + VAT_RATE), minApplied: plates > (Number(guests) || 0) };
};

// wa.me needs the full international number. Nepali mobiles are typed as 98XXXXXXXX, so add 977.
export const toWhatsAppNumber = (raw = "") => {
  const trimmed = String(raw).trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return digits;
  if (digits.startsWith("977")) return digits;
  if (digits.length === 10 && digits.startsWith("9")) return `977${digits}`;
  if (digits.startsWith("0")) return `977${digits.slice(1)}`; // landline with a trunk 0, e.g. 01-4412345
  return digits;
};
