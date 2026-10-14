import { Outlet, useLocation } from "react-router-dom";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

// Pages that start with a full-bleed hero (landing, venue details) get the transparent overlay header
const OVERLAY_HEADER_ROUTES = ["/", "/about", "/contact", "/profile"];

export default function MainLayout() {
  const { pathname } = useLocation();
  const overlay = OVERLAY_HEADER_ROUTES.includes(pathname) || (pathname.startsWith("/venue/") && !pathname.endsWith("/inquire"));

  return (
    <div className="flex min-h-screen flex-col">
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
