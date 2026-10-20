import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAfterLogin } from "../../auth/returnTo";
import { demoLoginApi } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";

// One click, no password: the server opens a read-only demo session for the chosen role.
export const useDemoLogin = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const afterLogin = useAfterLogin();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role) => (await demoLoginApi(role)).data.data,
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("You are in a demo account. Look around freely.");
      afterLogin(user);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "The demo could not be opened. Please try again.");
    },
  });
};
