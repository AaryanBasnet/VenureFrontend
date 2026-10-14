import { useContext, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { AuthContext } from "../../../auth/AuthProvider";
import instance from "../../../api/api";

// The backend wraps responses as { success, data }. GET returns the saved venues; POST toggles one.
const fetchFavorites = async () => (await instance.get("/user/favorites")).data.data ?? [];
const toggleFavorite = async (venueId) => (await instance.post(`/user/favorites/${venueId}`)).data;

// Only customers can save venues; for everyone else this stays empty and makes no request.
export function useFavorites() {
  const { user } = useContext(AuthContext);
  const enabled = user?.role === "Customer";
  const query = useQuery({ queryKey: ["favorites"], queryFn: fetchFavorites, enabled, staleTime: 60 * 1000, retry: 1 });
  const venues = enabled ? query.data ?? [] : [];
  return { ...query, enabled, venues, ids: new Set(venues.map((v) => v._id)) };
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleFavorite,
    onSuccess: (res) => {
      toast.success(res.message === "Removed from favorites" ? "Removed from favorites" : "Saved to favorites");
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: () => toast.error("We could not update your favorites. Please try again."),
  });
}

// A signed-out visitor who taps a heart is sent to sign in; the venue is remembered for this tab
// and saved as soon as they come back as a customer.
const PENDING_KEY = "venure:pending-favorite";

export const rememberPendingFavorite = (venueId) => {
  try {
    sessionStorage.setItem(PENDING_KEY, venueId);
  } catch {
    /* storage can be blocked; the visitor just taps the heart again */
  }
};

export function usePendingFavorite({ enabled, isSuccess, ids }, toggle) {
  useEffect(() => {
    if (!enabled || !isSuccess) return;
    let venueId = null;
    try {
      venueId = sessionStorage.getItem(PENDING_KEY);
      sessionStorage.removeItem(PENDING_KEY);
    } catch {
      return;
    }
    if (venueId && !ids.has(venueId)) toggle.mutate(venueId);
    // Runs once per sign-in, when the saved list first arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isSuccess]);
}
