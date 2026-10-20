import React, { useContext, useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCheck, Clock, ArrowRight } from "lucide-react";
import { AnimatePresence, m as motion } from "framer-motion";
import { useNotifications } from "../hooks/useNotification";
import { AuthContext } from "../auth/AuthProvider";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const [animateCount, setAnimateCount] = useState(false);
  const dropdownRef = useRef(null);
  const { user } = useContext(AuthContext);
  const { notifications, unreadCount, markAllRead } =
    useNotifications(user?._id);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Animate notification count when it changes
  useEffect(() => {
    if (unreadCount > 0) {
      setAnimateCount(true);
      const timer = setTimeout(() => setAnimateCount(false), 500);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = Math.floor((now - notificationDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors duration-200 group"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell
          className={`w-6 h-6 text-slate-600 transition-all duration-200 ${
            open ? "text-rose-600" : "group-hover:text-slate-800"
          }`}
        />

        {/* Notification Badge */}
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center shadow-lg transition-all duration-300 ${
              animateCount ? "animate-bounce scale-110" : "scale-100"
            }`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Pulse animation for new notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 rounded-full px-2 py-0.5 min-w-[20px] h-5 animate-ping opacity-30"></span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
      {open && (
        <motion.div
          className="z-[9999] mt-3 sm:absolute sm:right-0 sm:top-full fixed sm:mt-3 top-20 inset-x-4 sm:inset-x-auto w-full sm:w-96 max-w-full sm:max-w-[24rem] bg-white rounded-2xl shadow-2xl border border-slate-200/50 backdrop-blur-lg overflow-hidden"
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          role="dialog"
          aria-label="Notifications panel"
        >
          {" "}
          {/* Header */}
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-rose-50/30 ">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">
                    Notifications
                  </h3>
                  <p className="text-sm text-slate-600">
                    {unreadCount > 0
                      ? `${unreadCount} unread`
                      : "All caught up"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors duration-200"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Mark all read
                  </button>
                )}

                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          </div>
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">
                  No notifications yet
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  We'll notify you when something happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification, index) => (
                  <div
                    key={notification._id}
                    className={`group px-6 py-4 transition-all duration-200 ${
                      !notification.read
                        ? "bg-gradient-to-r from-rose-50/30 to-pink-50/20 border-l-4 border-rose-400"
                        : ""
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      {/* Notification Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          !notification.read
                            ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {!notification.read ? (
                          <Bell className="w-5 h-5" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm leading-relaxed ${
                            !notification.read
                              ? "text-slate-800 font-medium"
                              : "text-slate-600"
                          }`}
                        >
                          {notification.message}
                        </p>

                        {/* Time */}
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-slate-100 bg-gradient-to-r from-slate-50 to-rose-50/30">
              <button className="w-full py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors duration-200">
                View all notifications
              </button>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
