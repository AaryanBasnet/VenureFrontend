import instance from "../api";

// params: { page, limit, search, status }  ->  { venues, total, pages }
export const getAllVenues = (params) => {
  return instance.get("/venues/admin/all", { params });
};

export const getApprovedVenuesCount = () => {
  return instance.get("/venues/admin/approved-count");
};

export const updateVenueStatus = (id, status) => {
  return instance.patch(`/venues/${id}/status`, { status });
};

// Show or hide a venue in the landing page's featured section.
export const toggleVenueFeatured = (id) => {
  return instance.patch(`/venues/${id}/feature`);
};
