import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAfterLogin } from "../../auth/returnTo";
import { toast } from "react-toastify";
import { googleAuthApi } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";

export const useGoogleLogin = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const afterLogin = useAfterLogin();
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

      afterLogin(user);
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || "Google sign-in failed. Please try again."
      );
    },
  });
};
