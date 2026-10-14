import { useQuery } from "@tanstack/react-query";
import { getVenueSpaces } from "../../../services/user/venueService";

export const useVenueSpaces = (venueId) =>
  useQuery({
    queryKey: ["venue_spaces", venueId],
    queryFn: () => getVenueSpaces(venueId),
    enabled: !!venueId,
  });
