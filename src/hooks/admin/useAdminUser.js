import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getAllUserService } from "../../services/admin/userService";

// Returns { success, data: [users with bookingCount], pagination: { total, page, limit } }.
export const useAdminUser = (page, limit = 10, search = "", role = "") => {
  return useQuery({
    queryKey: ["admin_users", page, limit, search, role],
    queryFn: () => getAllUserService({ page, limit, search: search || undefined, role: role || undefined }),
    placeholderData: keepPreviousData,
  });
};
