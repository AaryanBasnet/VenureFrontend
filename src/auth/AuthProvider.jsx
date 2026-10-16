import React, { createContext, useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import api from "../api/api";
import { useAuthStore } from "../store/authStore";
import { useFetchMe } from "../hooks/auth/useFetchMe";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { currentWindowPath, navigateOutsideRouter } from "./navigation";

/**
 * AuthContext still exists so every existing route guard and layout that
 * calls useContext(AuthContext) keeps working without changes in Phase 3.
 * Internally the truth lives in Zustand — this context is a thin bridge.
 */
export const AuthContext = createContext();

const AuthContextProvider = ({ children }) => {
  // Separate selectors: the provider re-renders only for the fields it uses, not on every store change
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const clearUser = useAuthStore((s) => s.clearUser);
  const queryClient = useQueryClient();
  const loggingOutRef = useRef(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Hydrate Zustand from the HTTP-Only cookie on every cold load / tab-open.
  useFetchMe();

  // ── Session-expired handler ───────────────────────────────────────────────
  // The axios interceptor fires this when BOTH the access token AND the
  // refresh token are dead.  We only redirect when the store is fully
  // initialized; if isInitializing is still true we got here during the
  // very first /auth/me check which means there was simply never a session.
  const handleSessionExpired = useCallback(() => {
    const { isInitializing: stillInit, isAuthenticated: wasAuthenticated } =
      useAuthStore.getState();

    const from = currentWindowPath();
    clearUser();
    disconnectSocket();

    // Signing out on purpose also ends the session; that is not an expiry.
    if (loggingOutRef.current) return;

    // Only redirect when the user HAD an active session. If isInitializing is
    // still true we're in the very first /auth/me check (no prior session).
    // If wasAuthenticated is false the user is a guest; hitting a protected
    // endpoint as a guest should not kick them to the login page.
    if (!stillInit && wasAuthenticated) {
      queryClient.clear();
      // No page reload: the toast container stays mounted, and the sign-in page remembers where they were.
      toast.error("Your session has expired. Please sign in again.", { toastId: "session-expired" });
      navigateOutsideRouter("/login", { replace: true, state: { from } });
    }
  }, [clearUser, queryClient]);

  useEffect(() => {
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [handleSessionExpired]);

  // ── Socket lifecycle ──────────────────────────────────────────────────────
  // Connect once we know the userId; disconnect on logout / unauthenticated.
  useEffect(() => {
    if (user?._id) {
      connectSocket(user._id);
    } else {
      disconnectSocket();
    }
  }, [user?._id]);

  // ── Logout ────────────────────────────────────────────────────────────────
  // Wait (briefly) for the server to clear the cookie before the caller navigates away:
  // a request that is cancelled by navigation would leave the visitor still signed in on the server.
  // If the server cannot be reached the local state is cleared anyway.
  const logout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setLoggingOut(true);
    try {
      await api.post("/auth/logout", undefined, { timeout: 4000, _suppressToast: true });
    } catch {
      // Still sign out locally.
    } finally {
      clearUser();
      queryClient.clear();
      disconnectSocket();
      loggingOutRef.current = false;
      setLoggingOut(false);
    }
  }, [clearUser, queryClient]);

  // A stable value: consumers re-render when the session really changes, not whenever this component does
  const value = useMemo(
    () => ({ user, loading: isInitializing, isAuthenticated, logout, loggingOut }),
    [user, isInitializing, isAuthenticated, logout, loggingOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContextProvider;
