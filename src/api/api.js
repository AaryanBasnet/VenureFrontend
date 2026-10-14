import axios from "axios";
import { toast } from "react-toastify";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ||"http://localhost:5051/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  // No global Content-Type — axios sets it automatically per request.
  // JSON bodies get "application/json"; FormData gets "multipart/form-data"
  // with the correct boundary injected by the browser.
});

// ─── Friendly error-message mapper ────────────────────────────────────────────
// Maps backend message strings to user-friendly copy. Hooks can call this
// directly when they want to customise the toast in their onError handler.
export const getErrorMessage = (error) => {
  const msg = error?.response?.data?.message || "";
  const status = error?.response?.status;

  const messageMap = {
    "The venue is already booked during this time slot":
      "This slot is already booked. Please choose a different time.",
    "Price mismatch detected. Booking rejected.":
      "Booking price mismatch — please refresh and try again.",
    "Payment has not been successfully completed":
      "Payment was not completed. Please try again.",
    "Too many login attempts. Try again later.":
      "Too many login attempts. Please wait 15 minutes.",
    "Too many accounts created from this IP. Try again later.":
      "Account limit reached. Please try again later.",
    "Too many payment requests. Please try again later.":
      "Payment rate limit reached. Please wait before trying again.",
  };

  if (messageMap[msg]) return messageMap[msg];
  if (msg) return msg;

  if (!error?.response) return "Connection error. Please check your internet.";
  if (status === 429) return "Too many requests. Please wait a moment.";
  if (status >= 500) return "Something went wrong on our end. Please try again.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "The requested resource was not found.";

  return "An unexpected error occurred.";
};

// ─── Silent token-refresh logic ───────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = []; // requests waiting while a refresh is in flight

const processQueue = (error) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const original = error.config;

    const is401 = error.response?.status === 401;
    const alreadyRetried = original._retry;
    const isRefreshCall = original.url?.includes("/auth/refresh");

    if (!is401 || alreadyRetried || isRefreshCall) {
      // Global toast for errors that individual hooks don't typically handle.
      // Hooks that manage their own onError toasts can set _suppressToast: true
      // in their axios request config to opt out.
      if (!is401 && original._suppressToast !== true) {
        const status = error.response?.status;
        if (!error.response) {
          toast.error("Connection error. Please check your internet.", { toastId: "net-error" });
        } else if (status === 429) {
          toast.error(getErrorMessage(error), { toastId: "rate-limit" }); // one toast, however many requests failed
        } else if (status >= 500) {
          toast.error(getErrorMessage(error), { toastId: "server-error" });
        }
        // 4xx domain errors (400, 403, 404, 409, 422) are left to individual
        // hooks — they carry specific business meaning the hook knows best.
      }
      return Promise.reject(error);
    }

    // Another request is already refreshing — queue this one
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(original))
        .catch((err) => Promise.reject(err));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // The refresh endpoint sets a new accessToken cookie automatically.
      // We use the raw axios (not our `api` instance) to avoid triggering
      // this interceptor again if the refresh itself gets a 401.
      await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });

      processQueue(null);
      return api(original); // replay the original request with the new cookie
    } catch (refreshError) {
      // 409: another tab rotated the session a moment ago and the browser already
      // holds the new cookies, so the original request can simply be replayed.
      if (refreshError.response?.status === 409) {
        processQueue(null);
        return api(original);
      }
      processQueue(refreshError);
      // Tell the rest of the app the session is dead — AuthProvider listens for this.
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
