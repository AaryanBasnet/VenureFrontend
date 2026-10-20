import { useQuery } from "@tanstack/react-query";
import api from "../../../api/api";
import { images } from "../../../assets/landing/images";
import { landingDefaults } from "../content/landingContent";

const fallback = { content: landingDefaults, categoryCounts: {}, spaceTypeCounts: {} };

// Keep a list item's image only if the frontend really has it; otherwise use the bundled item at the same position.
const withKnownImages = (items, defaults, keys) =>
  Array.isArray(items) && items.length
    ? items.map((item, index) => {
        const fixed = { ...item };
        for (const key of keys) {
          if (!images[item?.[key]]) fixed[key] = defaults[index % defaults.length]?.[key] ?? defaults[0][key];
        }
        return fixed;
      })
    : defaults;

// Merge the backend copy over the bundled one section by section, so a missing or odd section never leaves a hole.
function normalise(data) {
  const remote = data?.content;
  if (!remote || typeof remote !== "object") return fallback;
  const d = landingDefaults;
  const content = { ...d };
  for (const key of ["hero", "venueTypesIntro", "storiesIntro", "seasonsIntro", "featuredIntro", "testimonialsIntro", "partnerCta"]) {
    if (remote[key] && typeof remote[key] === "object") content[key] = { ...d[key], ...remote[key] };
  }
  content.venueTypes = withKnownImages(remote.venueTypes, d.venueTypes, ["imageKey", "badgeKey"]);
  content.stories = withKnownImages(remote.stories, d.stories, ["imageKey"]);
  content.seasons = withKnownImages(remote.seasons, d.seasons, ["imageKey"]);
  return { content, categoryCounts: data.categoryCounts ?? {}, spaceTypeCounts: data.spaceTypeCounts ?? {} };
}

/**
 * The home page's editorial copy and venue counts, from one request (GET /api/landing): categoryCounts per venue type,
 * spaceTypeCounts per kind of space (the five cards on the home page).
 * The bundled copy is what renders first and whenever the request fails, so there is never an empty shell,
 * a layout shift or a flash of different text; fetched content swaps in when it differs.
 */
export function useLanding() {
  const query = useQuery({
    queryKey: ["landing"],
    queryFn: async () => (await api.get("/landing")).data.data,
    select: normalise,
    placeholderData: fallback,
    staleTime: 60 * 1000,
    retry: 1,
  });
  return { ...(query.data ?? fallback), isPending: query.isPending, isError: query.isError };
}
