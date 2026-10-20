import instance from "../api";

// Owner endpoints live under /venues (the old /venueOwner/... paths no longer exist on the backend).

export const getActiveVenues = () => instance.get("/venues/owner/approved-count"); // { data: { count } }

// 1. Create venue WITHOUT images (basic data only)
export const createVenue = (venueData) => instance.post("/venues", venueData);

// 2. Upload images after venue creation using venueId
export const uploadVenueImages = (venueId, formData) =>
  instance.post(`/venues/${venueId}/images`, formData, { headers: { "Content-Type": "multipart/form-data" } });

// 3. Update venue info (optionally with new images). Arrays such as packages are sent as JSON strings.
export const updateVenue = (venueId, formData) =>
  instance.put(`/venues/${venueId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });

// 4. Delete venue by ID
export const deleteVenue = (venueId) => instance.delete(`/venues/${venueId}`);

// 5. The signed-in owner's venues
// Paged by the backend ({ venues, total, pages }); ask for a generous page so owners see all their venues.
export const getVenuesByOwner = () => instance.get("/venues/owner/me", { params: { limit: 50 } });

// 6. Halls and spaces of a venue (list is public; the rest need the VenueOwner role)
export const getSpaces = async (venueId) => (await instance.get(`/venues/${venueId}/spaces`)).data.data;
export const createSpace = async ({ venueId, ...payload }) => (await instance.post(`/venues/${venueId}/spaces`, payload)).data.data;
export const updateSpace = async ({ id, ...payload }) => (await instance.put(`/spaces/${id}`, payload)).data.data;
// Photos of one hall (up to 6): multipart under the name "spaceImages"
export const uploadSpaceImages = async ({ spaceId, files }) => {
  const form = new FormData();
  files.forEach((file) => form.append("spaceImages", file));
  return (await instance.post(`/spaces/${spaceId}/images`, form)).data.data;
};
export const removeSpaceImage = async ({ spaceId, filename }) => (await instance.delete(`/spaces/${spaceId}/images`, { data: { filename } })).data.data;
export const deactivateSpace = async (id) => (await instance.delete(`/spaces/${id}`)).data;
