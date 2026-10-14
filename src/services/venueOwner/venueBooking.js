import { fetchBookingsForOwner, cancelBooking, getMonthlyEarningsForOwner } from "../../api/owner/venueBooking";
import { getTotalBookingsForOwner } from "../../api/user/booking";

export const fetchBookingsForOwnerService = async () => {
  try {
    const response = await fetchBookingsForOwner();
    return response ?? [];
  } catch {
    return [];
  }
};

export const cancelBookingService = async (bookingId) => {
  return await cancelBooking(bookingId);
};

export const getMonthlyEarningsForOwnerService = async () => {
  const res = await getMonthlyEarningsForOwner();
  return res.data.data;
};

export const getTotalBookingsForOwnerService = async () => {
  const res = await getTotalBookingsForOwner();
  return res.data.data;
};

