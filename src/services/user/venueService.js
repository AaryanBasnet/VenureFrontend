import { getFilteredVenuesApi, getVenueByIdApi, getVenueSpacesApi } from "../../api/user/venue";

export const getApprovedVenues = async (filters = {}) => {
  const response = await getFilteredVenuesApi(filters);
  return response.data;
};
export const getVenueById = async (id) => {
  const response = await getVenueByIdApi(id);
  return response.data.data;
};

export const getVenueSpaces = async (venueId) => {
  const response = await getVenueSpacesApi(venueId);
  return response.data.data ?? response.data;
};
