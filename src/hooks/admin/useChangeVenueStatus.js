import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changeVenueStatus } from "../../services/admin/adminVenueService";

export const useChangeVenueStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ venueId, status }) => changeVenueStatus(venueId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_venues"] });
      queryClient.invalidateQueries({ queryKey: ["admin_venue_counts"] });
    },
  });
};
