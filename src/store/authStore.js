import { create } from "zustand";
import { clearSessionMarker, setSessionMarker } from "../auth/sessionMarker";

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true, // true until the /auth/me check resolves on mount

  setUser: (user) => {
    setSessionMarker(); // remembered so a later visit knows a refresh is worth trying
    set({ user, isAuthenticated: true, isInitializing: false });
  },

  clearUser: () => {
    clearSessionMarker();
    set({ user: null, isAuthenticated: false, isInitializing: false });
  },
}));
