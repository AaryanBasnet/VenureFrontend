import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { googleAuthApi } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";

export const useGoogleLogin = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credential) => {
      const res = await googleAuthApi(credential);
      return res.data.data;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Welcome back!");

      if (user?.role === "Admin") navigate("/admin/dashboard");
      else if (user?.role === "VenueOwner") navigate("/owner/dashboard");
      else navigate("/");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || "Google sign-in failed. Please try again."
      );
    },
  });
};
