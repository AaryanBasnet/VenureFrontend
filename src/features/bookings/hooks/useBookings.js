import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyBookings } from "../../../api/user/booking";
import { cancelBooking, completeBooking, fetchBookingsForOwner, settleBalance } from "../../../api/owner/venueBooking";

export const useMyBookingList = (enabled = true) => useQuery({ queryKey: ["my-bookings"], queryFn: getMyBookings, enabled });
export const useOwnerBookingList = () => useQuery({ queryKey: ["owner-bookings"], queryFn: fetchBookingsForOwner });

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
