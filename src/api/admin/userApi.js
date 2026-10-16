import instance from "../api";

export const getCustomersCount = () => {
  return instance.get("/user/admin/customers/total");
};

// params: { page, limit, search, role }
export const getAllUserApi = (params) => {
  return instance.get("/user/admin/all", { params });
};

// Soft delete: the account is deactivated and its sessions end.
export const deleteUserApi = async (userId) => instance.delete(`/user/admin/${userId}`);
