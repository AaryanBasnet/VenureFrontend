import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserProfileService,
  updateUserProfileService,
} from "../../services/user/userService";
import { useAuthStore } from "../../store/authStore";

export const useUserProfile = (options = {}) => {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfileService,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options, // allows passing `enabled: false` to prevent fetching
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfileService,
    onSuccess: (result) => {
      // Refetch the profile, and refresh the signed-in user so the header shows the new name and photo
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      const updated = result?.user;
      const { user, setUser } = useAuthStore.getState();
      if (updated && user) setUser({ ...user, name: updated.name ?? user.name, avatar: updated.avatar ?? user.avatar, phone: updated.phone ?? user.phone });
    },
    onError: () => {
      // Error display handled by the calling component
    },
  });
};
