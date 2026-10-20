import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyBookings } from "../../../api/user/booking";
import { cancelBooking, completeBooking, fetchOwnerBookingPage, settleBalance } from "../../../api/owner/venueBooking";

// A page at a time; the previous page stays on screen while the next one loads
export const useMyBookingList = (params, enabled = true) => useQuery({ queryKey: ["my-bookings", params], queryFn: () => getMyBookings(params), enabled, placeholderData: keepPreviousData });
export const useOwnerBookingList = (params) => useQuery({ queryKey: ["owner-bookings", params], queryFn: () => fetchOwnerBookingPage(params), placeholderData: keepPreviousData });

function useRefreshing(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["owner-bookings"] });
      qc.invalidateQueries({ queryKey: ["inquiries"] });
      qc.invalidateQueries({ queryKey: ["inquiry"] });
      qc.invalidateQueries({ queryKey: ["owner-inquiries"] });
    },
  });
}

export const useCancelBookingNow = () => useRefreshing(cancelBooking);
export const useSettleBalance = () => useRefreshing(settleBalance);
export const useCompleteBooking = () => useRefreshing(completeBooking);
