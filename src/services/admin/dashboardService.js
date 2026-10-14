import {
  fetchActivityLogs,
  getTopVenuesByBooking,
  getTotalBookingsForAdmin,
  getTotalMonthlyEarningsAllOwners,
} from "../../api/admin/dashboardApi";

export const fetchActivityLogsService = async () => {
  const res = await fetchActivityLogs();
  return res.data.data;
};

export const getTotalMonthlyEarningsService = async () => {
  const res = await getTotalMonthlyEarningsAllOwners();
  return res.data.data;
};

export const getTotalBookingsForAdminService = async () => {
  const res = await getTotalBookingsForAdmin();
  return res.data.data;
};

export const getTopVenuesByBookingService = async () => {
  const res = await getTopVenuesByBooking();
  return res.data.data;
};
