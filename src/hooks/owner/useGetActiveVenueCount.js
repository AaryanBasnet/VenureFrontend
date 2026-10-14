// useActiveVenueCount.js
import { useQuery } from "@tanstack/react-query";
import { getActiveVenues } from "../../api/owner/venueApi";

const useActiveVenueCount = (ownerId) => {
  return useQuery({
    queryKey: ["approved_venue_count", ownerId],
    queryFn: async () => (await getActiveVenues(ownerId)).data.data.count,
    // enabled: !!ownerId,  <-- Comment this out to force run
    keepPreviousData: true,
  });
};

export default useActiveVenueCount;
