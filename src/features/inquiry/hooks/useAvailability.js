import { useQuery } from "@tanstack/react-query";
import api from "../../../api/api";

// Booked time ranges for the month being shown in the calendar (public, no personal details).
export const useAvailability = (venueId, month) => {
  const from = new Date(month.getFullYear(), month.getMonth(), 1);
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  return useQuery({
    queryKey: ["availability", venueId, from.toISOString()],
    queryFn: async () => (await api.get(`/venues/${venueId}/availability`, { params: { from: from.toISOString(), to: to.toISOString() } })).data.data ?? [],
    enabled: !!venueId,
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });
};
