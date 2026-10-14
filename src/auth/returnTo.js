import { useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Remember where a visitor was heading when we sent them to sign in, and take them back afterwards.

// Only same-site paths are allowed, and never the sign-in pages themselves.
const safeFrom = (from) =>
  typeof from === "string" && from.startsWith("/") && !from.startsWith("//") && !/^\/(login|register)/.test(from) ? from : null;

export const currentPath = (location) => `${location.pathname}${location.search}${location.hash}`;

// Owners and admins always land on their own dashboard; customers go back to where they were.
export const afterLoginPath = (user, from) => {
  if (user?.role === "Admin") return "/admin/dashboard";
  if (user?.role === "VenueOwner") return "/owner/dashboard";
  return safeFrom(from) ?? "/";
};

// Returns a function that opens the login page and remembers the current page.
export function useGoToLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    (options = {}) => navigate("/login", { ...options, state: { from: currentPath(location) } }),
    [navigate, location]
  );
}

// Used by the login, Google and register hooks.
export function useAfterLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  // Keep the first value: once sign-in succeeds the route changes and the state would be gone.
  const from = useRef(location.state?.from);
  return useCallback((user) => navigate(afterLoginPath(user, from.current)), [navigate]);
}
