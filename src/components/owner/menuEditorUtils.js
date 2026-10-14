// Form rows <-> API payload for a venue's food packages and drink options.
// Highlights and items are typed one per line.

export const emptyPackage = () => ({ name: "", tagline: "", pricePerPlate: "", minPlates: "", highlightsText: "" });
export const emptyDrink = () => ({ name: "", description: "", itemsText: "" });

const lines = (text) => text.split("\n").map((s) => s.trim()).filter(Boolean);

export const packagesFromVenue = (list = []) =>
  list.map((p) => ({
    name: p.name,
    tagline: p.tagline || "",
    pricePerPlate: String(p.pricePerPlate ?? ""),
    minPlates: p.minPlates > 1 ? String(p.minPlates) : "",
    highlightsText: (p.highlights || []).join("\n"),
  }));

export const drinksFromVenue = (list = []) =>
  list.map((d) => ({ name: d.name, description: d.description || "", itemsText: (d.items || []).join("\n") }));

export const packagesToPayload = (rows) =>
  rows
    .filter((r) => r.name.trim())
    .map((r) => ({
      name: r.name.trim(),
      ...(r.tagline.trim() ? { tagline: r.tagline.trim() } : {}),
      pricePerPlate: Number(r.pricePerPlate) || 0,
      minPlates: Math.max(1, Math.round(Number(r.minPlates) || 1)),
      highlights: lines(r.highlightsText).slice(0, 8),
    }));

export const drinksToPayload = (rows) =>
  rows
    .filter((r) => r.name.trim())
    .map((r) => ({
      name: r.name.trim(),
      ...(r.description.trim() ? { description: r.description.trim() } : {}),
      items: lines(r.itemsText).slice(0, 12),
    }));

// A package with a name but no price would be saved as free, so ask for the price first.
export const menuError = (packages) => {
  const bad = packages.find((p) => p.name.trim() && !(Number(p.pricePerPlate) > 0));
  return bad ? `Enter a price per plate for "${bad.name.trim()}".` : "";
};
