import instance from "../api";

export const fetchBookingsForOwner = async () => (await instance.get("/bookings/owner-bookings")).data.data;

// One page: { items, total, page, pages, counts }. params: { group, page, limit }
export const fetchOwnerBookingPage = async (params = {}) => (await instance.get("/bookings/owner-bookings", { params: { page: 1, ...params } })).data.data;

export const getMonthlyEarningsForOwner = async () => instance.get("/bookings/owner-earnings");

// Owners and customers both cancel through the same route; the server decides the refund.
export const cancelBooking = async (bookingId) => (await instance.put(`/bookings/${bookingId}/cancel`)).data;

// The balance is paid to the venue directly (cash or bank transfer); the owner records that it arrived.
export const settleBalance = async ({ id, method, note }) =>
  (await instance.put(`/bookings/${id}/settle-balance`, { method, ...(note ? { note } : {}) })).data.data;

export const completeBooking = async (id) => (await instance.put(`/bookings/${id}/complete`)).data.data;
