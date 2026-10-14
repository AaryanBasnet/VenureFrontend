import { useQuery } from "@tanstack/react-query";
import { getApprovedVenuesCountService } from "../../services/admin/adminVenueService";

export const useGetApprovedVenuesCount = () => {
  return useQuery({
    queryKey: ["Count_Venues"],
    queryFn: async () => {
      const res = await getApprovedVenuesCountService();
      return res.data?.count ?? 0; // envelope is { success, data: { count } }
    },
    keepPreviousData: true,
  });
};
