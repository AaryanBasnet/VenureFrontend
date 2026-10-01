import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { registerUserApi } from "../../api/authApi";
import { useAuthStore } from "../../store/authStore";

export const useRegister = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const res = await registerUserApi(formData);
      // Backend envelope: { success: true, data: { _id, name, email, role, ... } }
      return res.data.data;
    },
    onSuccess: (user) => {
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Welcome to Venure!");

      if (user?.role === "Admin") navigate("/admin/dashboard");
      else if (user?.role === "VenueOwner") navigate("/owner/dashboard");
      else navigate("/");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || "Registration failed. Please try again."
      );
    },
  });
};
