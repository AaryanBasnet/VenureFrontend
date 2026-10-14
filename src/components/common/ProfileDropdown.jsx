import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, UserCircle2 } from "lucide-react";
import { accountLinksFor } from "../../layouts/accountLinks";
import { assetUrl } from "../../utils/assetUrl";

// Account menu in the site header: avatar button that opens a short list of the account's pages.
const ProfileDropdown = ({ user, logout, avatarUrl }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const links = accountLinksFor(user);
  const photo = assetUrl(avatarUrl);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Account menu"
        className="flex size-10 items-center justify-center overflow-hidden rounded-full border border-gold-200/70 bg-gold-50 text-gold-800 transition-colors hover:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {photo ? <img src={photo} alt="" className="size-full object-cover" /> : <UserCircle2 aria-hidden="true" className="size-6" strokeWidth={1.5} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-card-md border border-line bg-cream shadow-xl"
          >
            <div className="border-b border-line px-5 py-4">
              <p className="truncate font-display text-h5 font-normal text-ink">{user?.name ?? "Your account"}</p>
              {user?.email && <p className="truncate font-body text-caption text-taupe">{user.email}</p>}
            </div>
            <ul className="py-2">
              {links.map(({ label, to, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-5 py-2.5 font-body text-small text-ink hover:bg-sand focus-visible:bg-sand focus-visible:outline-none"
                  >
                    <Icon aria-hidden="true" className="size-4 text-gold-800" strokeWidth={1.5} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-3 border-t border-line px-5 py-3 font-body text-small text-taupe hover:bg-sand hover:text-ink focus-visible:bg-sand focus-visible:outline-none"
            >
              <LogOut aria-hidden="true" className="size-4" strokeWidth={1.5} />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
