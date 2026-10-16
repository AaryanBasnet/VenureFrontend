import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUserService } from "../../services/admin/userService";

// Deactivates an account (a soft delete on the server that also ends the person's sessions).
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => deleteUserService(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
    },
  });
};
