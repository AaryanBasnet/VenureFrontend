// services/venueService.js

import {
  createVenue,
  uploadVenueImages,
  getVenuesByOwner,
  updateVenue,
  getActiveVenues,
} from "../../api/owner/venueApi";

// CREATE Venue
export const addVenueService = async ({ form, amenities, images, packages = [], drinkOptions = [] }) => {
  const { address, city, state, country, ...rest } = form;
  const venueData = {
    ...rest,
    amenities,
    packages,
    drinkOptions,
    location: {
      address,
      city,
      state,
      country,
    },
  };

  const createResponse = await createVenue(venueData);
  const newVenue = createResponse.data.data;

  if (!newVenue._id) {
    throw new Error("Venue creation failed, no venue ID returned");
  }

  if (images?.length > 0) {
    const formData = new FormData();
    images.forEach((file) => formData.append("venueImages", file));
    await uploadVenueImages(newVenue._id, formData);
  }

  return createResponse.data;
};

export const getActiveVenuesService = async (ownerId) => {
  if (!ownerId) return 0;
  const res = await getActiveVenues();
  return res.data.data.count;
};
// GET Venues by Owner
export const fetchVenuesByOwnerService = async (ownerId) => {
  if (!ownerId) throw new Error("Owner ID is required");
  const response = await getVenuesByOwner();
  return response.data.data.venues;
};
export const updateVenueService = async ({ venueId, updatedData }) => {
  // `updatedData` is already a FormData created in the React component
  const response = await updateVenue(venueId, updatedData);
  return response.data;
};
