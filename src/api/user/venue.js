import instance from "../api";

export const getFilteredVenuesApi = (filters) => {
  return instance.get("/venues", { params: filters });
};

export const getVenueByIdApi = (id) => {
  return instance.get(`/venues/${id}`);
};

export const getVenueSpacesApi = (venueId) => {
  return instance.get(`/venues/${venueId}/spaces`);
};
