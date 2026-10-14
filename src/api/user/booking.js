import instance from "../api";

// The customer's bookings (the booking itself is created from an accepted quotation, see the inquiry flow).
export const getMyBookings = async () => {
  const res = await instance.get("/bookings/my-bookings");
  return res.data.data;
};

// How many confirmed or completed bookings the signed-in venue owner has.
export const getTotalBookingsForOwner = async () => {
  return await instance.get("/bookings/owner-count");
};
