import { useLanding } from "./useLanding";

/**
 * Approved-venue counts, keyed by slug, from the same request as the home page copy.
 * counts: per venue type (e.g. { "hotel-resort": 4 }); spaceCounts: venues having each kind of space.
 * Missing keys mean zero venues, so the cards render without a count.
 */
export function useCategoryCounts() {
  const { categoryCounts, spaceTypeCounts, isPending } = useLanding();
  return { counts: categoryCounts, spaceCounts: spaceTypeCounts, isPending };
}
