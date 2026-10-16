import { useQuery } from "@tanstack/react-query";
import api from "../../../api/api";

// Booked time ranges from the first day shown in the calendar and the 45 days after it, which
// covers a full AD or BS month (public, no personal details). The window starts a day early and ends a day
// late: the visitor's midnight is not Kathmandu's, so a visitor far west of Nepal (whose midnight comes
// hours after a Kathmandu day shift has ended) would otherwise miss the first day's bookings.
export const useAvailability = (venueId, firstDay) => {
  const from = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() - 1);
  const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 47);
  return useQuery({
    queryKey: ["availability", venueId, from.toISOString()],
    queryFn: async () => (await api.get(`/venues/${venueId}/availability`, { params: { from: from.toISOString(), to: to.toISOString() } })).data.data ?? [],
    enabled: !!venueId,
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });
};
