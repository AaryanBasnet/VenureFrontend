import { useQuery } from "@tanstack/react-query";
import api from "../../../api/api";

// Booked time ranges from the first day shown in the calendar and the 45 days after it, which
// covers a full AD or BS month (public, no personal details).
export const useAvailability = (venueId, firstDay) => {
  const from = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate());
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 45);
  return useQuery({
    queryKey: ["availability", venueId, from.toISOString()],
    queryFn: async () => (await api.get(`/venues/${venueId}/availability`, { params: { from: from.toISOString(), to: to.toISOString() } })).data.data ?? [],
    enabled: !!venueId,
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });
};
