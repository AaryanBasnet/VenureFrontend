import { useQuery } from "@tanstack/react-query";
import { getVenue } from "../../services/admin/adminVenueService";

// One tiny request per status (limit 1) just to read the total for the tab counts.
export const useVenueStatusCounts = () =>
  useQuery({
    queryKey: ["admin_venue_counts"],
    queryFn: async () => {
      const [pending, approved, rejected] = await Promise.all(
        ["pending", "approved", "rejected"].map((status) => getVenue({ page: 1, limit: 1, status }))
      );
      return {
        pending: pending.total,
        approved: approved.total,
        rejected: rejected.total,
        all: pending.total + approved.total + rejected.total,
      };
    },
  });
