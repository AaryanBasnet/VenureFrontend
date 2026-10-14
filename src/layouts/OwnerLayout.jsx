import { useCallback, useContext, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { AuthContext } from "../auth/AuthProvider";
import OwnerSidebar from "./OwnerSidebar";
import NotificationBell from "../components/common/NotificationBell";
import Logo from "../components/ui/Logo";

// Owner area shell: dark navigation rail on the left, cream workspace on the right.
export default function OwnerLayout() {
  const { user } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      <a href="#owner-main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-gold-50">
        Skip to content
      </a>
      <OwnerSidebar open={menuOpen} onClose={closeMenu} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-cream px-4 sm:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} className="-ml-2 rounded-full p-2 text-ink hover:bg-ink/5">
              <Menu aria-hidden="true" className="size-5" />
            </button>
            <Link to="/owner/dashboard" aria-label="Venure owner dashboard" className="text-ink">
              <Logo className="w-12" label="Venure" />
            </Link>
          </div>
          <p className="hidden font-body text-small text-taupe lg:block">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          {user && <NotificationBell userId={user._id} tone="dark" />}
        </header>

        <main id="owner-main" className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-8 sm:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
