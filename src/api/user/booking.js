import instance from "../api";

export const createBookingApi = (bookingData) => {
  return instance.post("/bookings/createBooking", bookingData);
};

export const getMyBookings = async () => {
  const res = await instance.get("/bookings/my-bookings");
  return res.data.data;
};

///owner/bookings/total
export const getTotalBookingsForOwner = async () => {
  return await instance.get("/bookings/owner-count");
};

export const createPaymentIntentApi = async ({
  amount,
  venueId,
  bookingDate,
  timeSlot,
}) => {
  const res = await instance.post("/payment/create-payment-intent", {
    amount,
    venueId,
    bookingDate,
    timeSlot,
  });

  return res.data.clientSecret;
};
