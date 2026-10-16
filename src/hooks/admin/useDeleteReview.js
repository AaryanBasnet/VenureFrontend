import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteReviewApi } from "../../api/admin/reviewsApi";

export const useDeleteReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReviewApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_reviews"] });
      queryClient.invalidateQueries({ queryKey: ["featured-reviews"] });
    },
  });
};
