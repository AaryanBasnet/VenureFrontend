import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { afterLoginPath, currentPath } from "../../auth/returnTo";
import { m as motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";

function AuthSpinner() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-4">
        <div aria-hidden="true" className="size-10 animate-spin rounded-full border-2 border-line border-t-gold" />
        <p aria-hidden="true" className="font-body text-small text-taupe">
          Checking your session
        </p>
        <span className="sr-only">Checking your session</span>
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
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);
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
    return <Navigate to="/login" replace state={{ from: currentPath(location) }} />;
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
