import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useNotifications } from "../../hooks/useNotification";

const ago = (iso) => {
  const minutes = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

// Header bell: new quotations, booking updates and replies show up here, live and without a refresh.
// tone="light" is white on the dark site header; tone="dark" is for cream backgrounds (owner area).
export default function NotificationBell({ userId, tone = "light" }) {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openItem = (n) => {
    if (!n.read) markRead(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className={`relative flex size-10 items-center justify-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${tone === "dark" ? "text-ink hover:bg-ink/5 focus-visible:outline-ink" : "text-white hover:bg-white/10 focus-visible:outline-white"}`}
      >
        <Bell aria-hidden="true" className="size-5" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span aria-hidden="true" className="absolute right-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-gold px-1 font-body text-[10px] font-medium leading-4 text-ink">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-card-md border border-line bg-cream shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="font-display text-h5 font-normal text-ink">Notifications</p>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="font-body text-caption text-gold-800 underline underline-offset-4 hover:text-ink">
                  Mark all as read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="px-5 py-8 text-center font-body text-small text-taupe">Nothing new. We will tell you here when a venue replies.</p>
            ) : (
              <ul className="max-h-[22rem] overflow-y-auto">
                {notifications.slice(0, 15).map((n) => (
                  <li key={n._id}>
                    <button
                      type="button"
                      onClick={() => openItem(n)}
                      className={`flex w-full items-start gap-3 border-b border-line px-5 py-3.5 text-left hover:bg-sand focus-visible:bg-sand focus-visible:outline-none ${n.read ? "" : "bg-gold-50"}`}
                    >
                      <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-gold"}`} />
                      <span className="min-w-0">
                        <span className="block font-body text-small text-ink">{n.message}</span>
                        <span className="mt-0.5 block font-body text-caption text-taupe">{ago(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
