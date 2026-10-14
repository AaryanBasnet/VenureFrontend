import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

// Pages that start with a full-bleed hero (landing, venue details) get the transparent overlay header
const OVERLAY_HEADER_ROUTES = ["/", "/about", "/contact", "/profile"];

// The first load keeps the browser's own scroll position (reload, back); later navigations behave like new pages.
let firstRender = true;

// A new page starts at the top and keyboard focus moves to its content; a #hash link scrolls to its section,
// waiting briefly for lazily loaded pages to put that section on screen.
function useRouteScroll() {
  const { pathname, hash, key } = useLocation();
  const lastPath = useRef(null);

  useEffect(() => {
    const pathChanged = lastPath.current !== pathname;
    lastPath.current = pathname;
    const isFirst = firstRender;
    firstRender = false;

    if (hash) {
      let tries = 0;
      const id = decodeURIComponent(hash.slice(1));
      const timer = window.setInterval(() => {
        const target = document.getElementById(id);
        tries += 1;
        if (target) {
          window.clearInterval(timer);
          target.scrollIntoView({ block: "start" });
        } else if (tries > 20) {
          window.clearInterval(timer);
        }
      }, 50);
      return () => window.clearInterval(timer);
    }

    if (pathChanged && !isFirst) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.getElementById("main-content")?.focus({ preventScroll: true });
    }
    return undefined;
  }, [pathname, hash, key]);
}

export default function MainLayout() {
  const { pathname } = useLocation();
  const overlay = OVERLAY_HEADER_ROUTES.includes(pathname) || (pathname.startsWith("/venue/") && !pathname.endsWith("/inquire"));
  useRouteScroll();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-gold-50 focus:px-5 focus:py-3 focus:font-body focus:text-small focus:text-ink"
      >
        Skip to content
      </a>
      <SiteHeader overlay={overlay} />
      <main id="main-content" tabIndex={-1} className="flex-grow outline-none">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
