import instance from "../api";

export const fetchActivityLogs = async () => {
  return await instance.get("/admin/activity-logs");
};

export const getTotalMonthlyEarningsAllOwners = async () => {
  return await instance.get("/admin/earnings/monthly");
};

export const getTotalBookingsForAdmin = async () => {
  return await instance.get("/bookings/total");
};

export const getTopVenuesByBooking = async () => {
  return await instance.get("/bookings/top-venues");
};
