import { useQuery } from "@tanstack/react-query";
import { getAllVenues } from "../../api/admin/venueManagementApi";

// How many venues each owner has listed, counted from the admin venue list (owner is populated there).
// The venue list is paged; we read up to 50 and report whether that covered everything.
export const useOwnerVenueCounts = () => {
  return useQuery({
    queryKey: ["admin_owner_venue_counts"],
    queryFn: async () => {
      const res = await getAllVenues({ page: 1, limit: 50 });
      const { venues = [], total = 0 } = res.data ?? {};
      const counts = {};
      for (const v of venues) {
        const id = v.owner?._id;
        if (id) counts[id] = (counts[id] ?? 0) + 1;
      }
      return { counts, complete: venues.length >= total };
    },
  });
};
