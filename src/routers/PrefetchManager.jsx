import { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AuthContext } from "../auth/AuthProvider";
import { installLinkPrefetch, prefetchLikelyNext } from "./prefetch";

// Renders nothing. Starts fetching the next page's code (and a venue's data) when a link is hovered, focused or touched,
// and the pages that usually follow the current one once the app is idle and the session is known.
export default function PrefetchManager() {
  const queryClient = useQueryClient();
  const { user, loading } = useContext(AuthContext);
  const role = user?.role;
  const { pathname } = useLocation();

  useEffect(() => installLinkPrefetch(queryClient), [queryClient]);

  useEffect(() => {
    if (!loading) prefetchLikelyNext(pathname, role || "guest");
  }, [loading, role, pathname]);

  return null;
}
