// A venue is one of three kinds (how people browse). Each hall inside it has its own kind of space.
// These slugs match VenureBackend model/venue.js VENUE_CATEGORIES and model/space.js SPACE_TYPES.
export const VENUE_TYPES = [
  ["banquet-party-palace", "Banquet hall and party palace"],
  ["hotel-resort", "Hotel and resort"],
  ["heritage-traditional", "Heritage and traditional"],
];

export const SPACE_TYPES = [
  ["heritage-courtyards", "Heritage courtyard"],
  ["garden-estates", "Garden estate"],
  ["intimate-halls", "Intimate hall"],
  ["mountain-retreats", "Mountain retreat"],
  ["rooftop-terraces", "Rooftop terrace"],
];

export const VENUE_TYPE_LABELS = Object.fromEntries(VENUE_TYPES);
export const SPACE_TYPE_LABELS = Object.fromEntries(SPACE_TYPES);

export const venueTypeLabel = (slug) => VENUE_TYPE_LABELS[slug] ?? null;
export const spaceTypeLabel = (slug) => SPACE_TYPE_LABELS[slug] ?? null;
