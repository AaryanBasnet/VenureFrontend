import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { AuthContext } from "../auth/AuthProvider";
import DashboardSidebar from "./DashboardSidebar";
import NotificationBell from "../components/common/NotificationBell";
import Logo from "../components/ui/Logo";

// Shell for the owner and admin areas: dark navigation rail on the left, cream workspace on the right.
// Pages render inside <Outlet /> and must not add their own full-screen wrapper.
export default function DashboardLayout({ role, homeTo, sections, badges }) {
  const { user } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const lastPath = useRef(pathname);

  // A new page starts at the top and keyboard focus moves to its content (the first load keeps the browser's own position).
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <a href="#dashboard-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-gold-50">
        Skip to content
      </a>
      <DashboardSidebar role={role} homeTo={homeTo} sections={sections} badges={badges} open={menuOpen} onClose={closeMenu} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-cream px-4 sm:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className="-ml-2 rounded-full p-2 text-ink hover:bg-ink/5">
              <Menu aria-hidden="true" className="size-5" />
            </button>
            <Link to={homeTo} aria-label={`Venure ${role.toLowerCase()} dashboard`} className="text-ink">
              <Logo className="w-12" label="Venure" />
            </Link>
          </div>
          <p className="hidden font-body text-small text-taupe lg:block">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          {user && <NotificationBell userId={user._id} tone="dark" />}
        </header>

        <main id="dashboard-main" ref={mainRef} tabIndex={-1} className="flex-1 overflow-y-auto outline-none">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8 sm:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
