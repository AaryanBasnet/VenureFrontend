import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAdminReviewsApi } from "../../api/admin/reviewsApi";

// Returns { reviews, total, pages }.
export const useAdminReviews = ({ page, limit = 10, rating, featured, search }) =>
  useQuery({
    queryKey: ["admin_reviews", page, limit, rating ?? "", featured ?? "", search ?? ""],
    queryFn: async () => {
      const res = await getAdminReviewsApi({
        page,
        limit,
        rating: rating || undefined,
        featured: featured || undefined,
        search: search || undefined,
      });
      return res.data.data;
    },
    placeholderData: keepPreviousData,
  });
