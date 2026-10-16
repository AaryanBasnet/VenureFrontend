import { useLanding } from "./useLanding";

/**
 * Approved-venue counts per category, keyed by slug (e.g. { "garden-estates": 4 }), from the same
 * request as the home page copy. Missing keys mean zero venues, so the cards render without a count.
 */
export function useCategoryCounts() {
  const { categoryCounts, isPending } = useLanding();
  return { counts: categoryCounts, isPending };
}
