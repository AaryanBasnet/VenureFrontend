import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleFeatured } from "../../services/admin/adminVenueService";

export const useToggleVenueFeatured = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (venueId) => toggleFeatured(venueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_venues"] });
    },
  });
};
