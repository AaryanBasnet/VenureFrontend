import { loaders, routePatterns, likelyAfterPage, likelyForRole } from "./routeModules";
import { getVenueById } from "../services/user/venueService";

// Warms the next page before the click: the route's JS chunk (and, for a venue page, its data) is requested while the
// visitor is still hovering, focusing or touching the link. Everything here is best-effort and never throws.

const started = new Set();

// Data Saver, or a 2G connection: do not spend the visitor's data on pages they may never open
const saveData = () => typeof navigator !== "undefined" && (navigator.connection?.saveData === true || /(^|-)2g$/.test(navigator.connection?.effectiveType || ""));

export function prefetchLoader(name) {
  if (!name || started.has(name) || !loaders[name]) return Promise.resolve();
  started.add(name);
  return loaders[name]().catch(() => started.delete(name)); // a failed fetch may be retried on the next hover
}

export function prefetchRoute(pathname, queryClient) {
  for (const [pattern, name] of routePatterns) {
    if (!pattern.test(pathname)) continue;
    prefetchLoader(name);
    const venue = pathname.match(/^\/venue\/([^/]+)\/?$/);
    if (venue && queryClient) {
      queryClient
        .prefetchQuery({ queryKey: ["venue_detail", venue[1]], queryFn: () => getVenueById(venue[1]), staleTime: 60 * 1000 })
        .catch(() => {});
    }
    return;
  }
}

const idle = (fn) => (typeof requestIdleCallback === "function" ? requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 1500));

let idleRun = 0;
const QUIET_MS = 2000;

// Once the page has settled, fetch the chunks of the pages most likely to be opened next, one at a time so the
// download never competes with what the visitor is doing. A newer navigation cancels the rest of the list.
export function prefetchLikelyNext(pathname, role) {
  const run = ++idleRun;
  if (saveData()) return;
  const names = [...(likelyAfterPage.find(([pattern]) => pattern.test(pathname))?.[1] || []), ...(likelyForRole[role] || likelyForRole.guest)];
  // Wait for the page's own requests and images first (a short quiet period), then use idle time
  window.setTimeout(() => {
    if (run !== idleRun) return;
    idle(async () => {
      for (const name of names) {
        if (run !== idleRun) return;
        await prefetchLoader(name);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    });
  }, QUIET_MS);
}

const anchorOf = (event) => (event.target instanceof Element ? event.target.closest("a[href]") : null);

// One delegated listener for every <a> in the app (Link, NavLink, plain anchors), so no page needs to change.
export function installLinkPrefetch(queryClient) {
  const handle = (event) => {
    if (saveData()) return;
    const a = anchorOf(event);
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    prefetchRoute(url.pathname, queryClient);
  };
  // mouseover bubbles (mouseenter does not); focusin covers keyboard users; touchstart gives phones a head start on the tap.
  document.addEventListener("mouseover", handle, { passive: true });
  document.addEventListener("focusin", handle);
  document.addEventListener("touchstart", handle, { passive: true });
  return () => {
    document.removeEventListener("mouseover", handle);
    document.removeEventListener("focusin", handle);
    document.removeEventListener("touchstart", handle);
  };
}
