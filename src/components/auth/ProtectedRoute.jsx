import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { afterLoginPath } from "../../auth/returnTo";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";

function AuthSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm font-light tracking-wide">
          Authenticating…
        </p>
      </div>
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

/**
 * ProtectedRoute — single composable guard that replaces all per-role files.
 *
 * Props
 * ─────
 * requiredRole  "Admin" | "VenueOwner" | "Customer"
 *               User must be authenticated AND have this exact role.
 *               Omit to require authentication only (no role restriction).
 *
 * guestOnly     true → redirect authenticated users to their role dashboard.
 *               Use for /login and /register routes.
 *
 * redirectTo    Override the redirect on role mismatch. Default: /unauthorized
 */
export default function ProtectedRoute({
  requiredRole,
  guestOnly = false,
  redirectTo = "/unauthorized",
}) {
  const { user, isAuthenticated, isInitializing } = useAuthStore();
  const location = useLocation();

  // Block render until the /auth/me cookie-check resolves on mount
  if (isInitializing) return <AuthSpinner />;

  // Guest-only paths: bounce authenticated users to their home dashboard
  if (guestOnly && isAuthenticated) {
    // Dashboard for owners and admins; customers go back to the page they were heading to
    return <Navigate to={afterLoginPath(user, location.state?.from)} replace />;
  }

  // Protected paths: unauthenticated users go to login
  if (!guestOnly && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role mismatch: authenticated but wrong role
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <Outlet />
    </motion.div>
  );
}
