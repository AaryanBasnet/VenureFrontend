import { addReview, deleteReview, getOwnerVenueReviews, getReviews } from "../api/reviews";

export const addReviewService = async (venueId, reviewData) => {
  try {
    const response = await addReview(venueId, reviewData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getReviewsService = async (venueId) => {
  try {
    const response = await getReviews(venueId);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteReviewService = async (venueId, reviewId) => {
  try {
    const response = await deleteReview(venueId, reviewId);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


// The backend returns a flat list of reviews; the owner page works per venue, so group them here.
export const getOwnerVenueReviewsService = async () => {
  const res = await getOwnerVenueReviews();
  const byVenue = new Map();
  for (const review of res.data.data ?? []) {
    const id = review.venue?._id ?? "unknown";
    if (!byVenue.has(id)) byVenue.set(id, { _id: id, venueName: review.venue?.venueName ?? "Venue", reviews: [] });
    byVenue.get(id).reviews.push(review);
  }
  return [...byVenue.values()].map((v) => ({
    ...v,
    totalReviews: v.reviews.length,
    averageRating: v.reviews.reduce((sum, r) => sum + r.rating, 0) / v.reviews.length,
  }));
};