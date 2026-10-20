import { useContext } from "react";
import { AuthContext } from "../../auth/AuthProvider";

// Shown on every page while a demo account is signed in, so nobody mistakes it for a real one.
export default function DemoBanner() {
  const { user, logout, loggingOut } = useContext(AuthContext);
  if (!user?.isDemo) return null;
  return (
    <div role="status" className="fixed bottom-24 right-3 z-50 flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-full bg-ink px-4 py-2 font-body text-caption text-gold-50 shadow-lg sm:bottom-4">
      <span>Demo account · changes are turned off</span>
      <button
        type="button"
        onClick={() => logout()}
        disabled={loggingOut}
        className="min-h-8 shrink-0 rounded-full border border-gold-200/60 px-3 text-gold-50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-50 disabled:opacity-60"
      >
        Sign out
      </button>
    </div>
  );
}
