import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "../../../api/api";

/**
 * Central TanStack Query hook for the venues feature.
 *
 * Uses keepPreviousData (TanStack v5 API) so the previous page's cards
 * stay visible while the next page loads — prevents a jarring blank flash
 * on every page/filter change.
 *
 * The hook unwraps the standard backend envelope:
 *   { success: true, data: [...venues], pages: N }
 */
export const useVenues = (filters = {}) => {
  const query = useQuery({
    queryKey: ["venues", filters],
    queryFn: async () => {
      const res = await api.get("/venues", {
        params: filters,
      });
      return res.data; // full envelope — caller can access .data and .pages
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 2, // 2 min — venue lists are stable mid-session
  });

  return {
    venues: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    totalPages: query.data?.pages ?? 1,
    isPending: query.isPending,
    isFetching: query.isFetching, // true during background refetch / page change
    isError: query.isError,
    refetch: query.refetch,
  };
};
