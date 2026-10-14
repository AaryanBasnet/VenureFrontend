// services/reviewService.js
import instance from "./api";

// Add a review for a venue
export const addReview = async (venueId, reviewData) => {
  // reviewData = { bookingId, rating, comment, title } (the backend requires a completed booking)
  return await instance.post(`/venue/${venueId}`, reviewData);
};

// Get all reviews for a venue
export const getReviews = async (venueId) => {
  return await instance.get(`/venue/${venueId}`);
};

// Delete a review by reviewId for a venue
export const deleteReview = async (venueId, reviewId) => {
  return await instance.delete(`/${venueId}/reviews/${reviewId}`);
};

export const getOwnerVenueReviews = async () => {
  // Backend route: GET /api/owner, a flat list of reviews across the owner's venues.
  return await instance.get("/owner");
};
