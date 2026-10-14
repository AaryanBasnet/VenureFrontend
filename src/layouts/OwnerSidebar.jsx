import { useContext, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Building2, CalendarCheck, ExternalLink, Inbox, LayoutDashboard, LogOut, MessageSquare, Star, Wallet, X } from "lucide-react";
import { AuthContext } from "../auth/AuthProvider";
import Logo from "../components/ui/Logo";
import { useOwnerInquiries } from "../features/inquiry/hooks/useInquiries";

const SECTIONS = [
  {
    title: "Overview",
    items: [
      { Icon: LayoutDashboard, label: "Dashboard", to: "/owner/dashboard" },
      { Icon: BarChart3, label: "Analytics", to: "/owner/analytics" },
    ],
  },
  {
    title: "Requests",
    items: [
      { Icon: Inbox, label: "Inquiries", to: "/owner/inquiries", badge: true },
      { Icon: CalendarCheck, label: "Bookings", to: "/owner/bookings" },
      { Icon: MessageSquare, label: "Messages", to: "/owner/chat" },
    ],
  },
  {
    title: "Your venues",
    items: [
      { Icon: Building2, label: "Venues", to: "/owner/venues" },
      { Icon: Star, label: "Reviews", to: "/owner/reviews" },
    ],
  },
  {
    title: "Money",
    items: [{ Icon: Wallet, label: "Payments", to: "/owner/payments" }],
  },
];

// Dark navigation rail, like the site header: ink background, gold for the current page.
export default function OwnerSidebar({ open, onClose }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: inquiries = [] } = useOwnerInquiries();
  const waiting = inquiries.filter((q) => q.status === "pending" && !q.booking).length;

  // The drawer closes when you go somewhere, and on Escape
  useEffect(() => {
    onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {open && <div aria-hidden="true" className="fixed inset-0 z-40 bg-ink/50 lg:hidden" onClick={onClose} />}

      <aside
        aria-label="Owner navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[17rem] flex-col bg-ink text-gold-50 transition-transform duration-300 lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[var(--spacing-header)] shrink-0 items-center justify-between px-6">
          <Link to="/owner/dashboard" aria-label="Venure owner dashboard" className="flex items-end gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
            <Logo className="w-14 text-gold-50" label="Venure" />
            <span className="pb-1 font-body text-eyebrow uppercase text-gold">Owner</span>
          </Link>
          <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-full p-2 text-gold-50 hover:bg-white/10 lg:hidden">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-6">
          {SECTIONS.map((section) => (
            <div key={section.title} className="mt-6 first:mt-2">
              <p className="px-3 font-body text-eyebrow uppercase text-taupe-light">{section.title}</p>
              <ul className="mt-2 space-y-0.5">
                {section.items.map(({ Icon, label, to, badge }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-card-sm px-3 py-2.5 font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-gold ${
                          isActive ? "bg-white/10 text-white" : "text-gold-50/75 hover:bg-white/5 hover:text-white"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && <span aria-hidden="true" className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold" />}
                          <Icon aria-hidden="true" className={`size-[18px] ${isActive ? "text-gold" : ""}`} strokeWidth={1.5} />
                          <span className="flex-1">{label}</span>
                          {badge && waiting > 0 && (
                            <span aria-label={`${waiting} waiting for a reply`} className="rounded-full bg-gold px-2 py-0.5 font-body text-caption font-medium leading-none text-ink">
                              {waiting}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="flex items-center gap-3 px-2">
            <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold font-display text-h5 text-ink">
              {(user?.name || "O").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-body text-small text-white">{user?.name || "Owner"}</p>
              <p className="truncate font-body text-caption text-taupe-light">{user?.email}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Link to="/" className="flex flex-1 items-center justify-center gap-2 rounded-card-sm border border-white/15 px-3 py-2 font-body text-caption text-gold-50 hover:bg-white/5">
              <ExternalLink aria-hidden="true" className="size-3.5" /> View site
            </Link>
            <button type="button" onClick={signOut} className="flex flex-1 items-center justify-center gap-2 rounded-card-sm border border-white/15 px-3 py-2 font-body text-caption text-gold-50 hover:bg-white/5">
              <LogOut aria-hidden="true" className="size-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
