import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getVenue } from "../../services/admin/adminVenueService";

export const useGetVenues = (page = 1, limit = 10, status = "all", search = "") => {
  return useQuery({
    queryKey: ["admin_venues", page, limit, status, search],
    queryFn: () => getVenue({ page, limit, status: status === "all" ? undefined : status, search: search || undefined }),
    placeholderData: keepPreviousData,
  });
};
