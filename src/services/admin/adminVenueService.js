import {
  getApprovedVenuesCount,
  getAllVenues,
  updateVenueStatus,
  toggleVenueFeatured,
} from "../../api/admin/venueManagementApi";

// The backend sends { success, venues, total, pages } (no "data" wrapper) for this list.
export const getVenue = async (params) => {
  const response = await getAllVenues(params);
  const body = response.data ?? {};
  return {
    venues: body.venues ?? [],
    total: body.total ?? 0,
    pages: body.pages ?? 1,
  };
};

export const getApprovedVenuesCountService = async () => {
  const res = await getApprovedVenuesCount();
  return res.data;
};

// Returns the updated venue ({ success, message, data: venue }).
export const changeVenueStatus = async (venueId, status) => {
  const response = await updateVenueStatus(venueId, status);
  return response.data.data;
};

export const toggleFeatured = async (venueId) => {
  const response = await toggleVenueFeatured(venueId);
  return response.data.data;
};
