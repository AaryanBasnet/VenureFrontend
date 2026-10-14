import instance from "../api";

// params: { page, limit, rating, featured ("true" | "false"), search }
export const getAdminReviewsApi = (params) => instance.get("/admin/reviews", { params });

// The backend flips the flag, so there is no body.
export const toggleReviewFeaturedApi = (reviewId) => instance.patch(`/${reviewId}/feature`);

export const deleteReviewApi = (reviewId) => instance.delete(`/${reviewId}`);
