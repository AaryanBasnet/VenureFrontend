import { useQuery } from "@tanstack/react-query";
import api from "../../../api/api";
import { useAfterFirstPaint } from "../../../hooks/useAfterFirstPaint";

/** Admin-curated featured venues for the "Our Finest Heritage Spaces" section. */
export function useFeaturedVenues() {
  const afterFirstPaint = useAfterFirstPaint();
  const query = useQuery({
    enabled: afterFirstPaint,
    queryKey: ["venues", "featured"],
    queryFn: async () => {
      const res = await api.get("/venues/featured");
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    venues: query.data ?? [],
    isPending: query.isPending,
    isError: query.isError,
  };
}
