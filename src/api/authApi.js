import api from "./api";

export const registerUserApi = (data) => api.post("/auth/register", data);
export const loginUserApi = (data) => api.post("/auth/login", data);
export const googleAuthApi = (credential) =>
  api.post("/auth/google", { credential });
export const logoutUserApi = () => api.post("/auth/logout");
export const getMeApi = () => api.get("/auth/me");

export const forgotPasswordApi = (data) =>
  api.post("/password/forgot-password", data);
export const verifyResetCodeApi = (data) =>
  api.post("/password/verify-code", data);
export const resetPasswordApi = (data) =>
  api.post("/password/reset-password", data);
