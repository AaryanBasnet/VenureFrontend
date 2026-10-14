import { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../components/ui/Logo";
import Button from "../components/ui/Button";
import ProfileDropdown from "../components/common/ProfileDropdown";
import NotificationBell from "../components/common/NotificationBell";
import { accountLinksFor } from "./accountLinks";
import { AuthContext } from "../auth/AuthProvider";

// "Seasons" and "Stories" are sections of the landing page (ids in features/landing/sections); the rest are pages.
const NAV_ITEMS = [
  { label: "Venues", to: "/venues" },
  { label: "Seasons", to: "/#experiences", section: true },
  { label: "Stories", to: "/#stories", section: true },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

// Distance scrolled before the transparent header gets its solid background
const SOLID_AFTER_PX = 80;

const navLinkClass =
  "font-body text-label uppercase text-white/85 transition-colors hover:text-white " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

// Page links show where you are (underline + aria-current); section links never look "current"
const desktopLinkClass = ({ isActive }) =>
  `${navLinkClass} border-b py-2 ${isActive ? "border-gold text-white" : "border-transparent"}`;
const mobileLinkClass = ({ isActive }) =>
  `font-display border-b border-white/10 py-4 text-h2 font-light focus-visible:outline-2 focus-visible:outline-white ${isActive ? "text-gold-200" : "text-gold-50"}`;

function NavItem({ item, className, ...props }) {
  // NavLink would mark every section link current while on "/", so sections use a plain Link
  if (item.section) {
    const plain = typeof className === "function" ? className({ isActive: false }) : className;
    return (
      <Link to={item.to} className={plain} {...props}>
        {item.label}
      </Link>
    );
  }
  return (
    <NavLink to={item.to} className={className} {...props}>
      {item.label}
    </NavLink>
  );
}

function useScrolledPast(threshold) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/**
 * Site-wide header.
 * - `overlay`: floats transparently over a full-bleed hero, turning solid on scroll.
 * - otherwise: solid ink bar in the normal document flow.
 */
export default function SiteHeader({ overlay = false }) {
  const { user, logout } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolled = useScrolledPast(SOLID_AFTER_PX);
  const location = useLocation();
  const menuButtonRef = useRef(null);

  const solid = !overlay || scrolled || menuOpen;

  // Close the mobile menu whenever the route (or hash) changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  // The mobile menu has no meaning on a wide screen: close it (and release the scroll lock) when the window grows
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const onChange = (e) => e.matches && setMenuOpen(false);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // Mobile menu: lock page scroll and close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header
      className={`${overlay ? "fixed" : "sticky"} inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid ? "bg-ink/95 backdrop-blur-lg" : "bg-transparent"
      }`}
    >
      <div className="container-site flex h-header items-center justify-between gap-6">
        <Link
          to="/"
          className="shrink-0 text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <Logo height={52} label="Venure home" />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7 xl:gap-9">
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <NavItem item={item} className={desktopLinkClass} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 lg:gap-4">
          {/* One bell for every screen size, so each notification raises a single toast */}
          {user && <NotificationBell userId={user._id} />}
          <div className="hidden items-center gap-5 lg:flex">
            {user ? (
              <ProfileDropdown user={user} logout={logout} avatarUrl={user.avatar || null} />
            ) : (
              <Link to="/login" className={navLinkClass}>
                Sign in
              </Link>
            )}
            <Button to="/contact?topic=tour" size="sm" arrow>
              Book a tour
            </Button>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-6" strokeWidth={1.5} /> : <Menu className="size-6" strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        hidden={!menuOpen}
        className="h-[calc(100dvh-var(--spacing-header))] overflow-y-auto border-t border-white/10 bg-ink lg:hidden"
      >
        <nav aria-label="Main menu" className="container-site flex flex-col gap-1 py-8">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.label} item={item} className={mobileLinkClass} />
          ))}
          {user && (
            <ul aria-label="Your account" className="mt-6 flex flex-col">
              {accountLinksFor(user).map(({ label, to, icon: Icon }) => (
                <li key={to}>
                  <NavLink to={to} className="flex items-center gap-3 border-b border-white/10 py-3.5 font-body text-body text-gold-50 focus-visible:outline-2 focus-visible:outline-white">
                    <Icon aria-hidden="true" className="size-5 text-gold" strokeWidth={1.5} />
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-8 flex flex-col gap-4">
            <Button to="/contact?topic=tour" arrow>
              Book a tour
            </Button>
            {user ? (
              <Button variant="outline-light" onClick={logout}>
                Sign out
              </Button>
            ) : (
              <Button variant="outline-light" to="/login">
                Sign in
              </Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
