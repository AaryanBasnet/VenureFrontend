import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleReviewFeaturedApi } from "../../api/admin/reviewsApi";

export const useToggleReviewFeatured = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleReviewFeaturedApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_reviews"] });
      // The landing page's "What guests say" section reads this list.
      queryClient.invalidateQueries({ queryKey: ["featured-reviews"] });
    },
  });
};
