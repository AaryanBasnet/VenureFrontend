import { useEffect, useId, useRef, useState } from "react";
import { useGoogleLogin } from "../../hooks/auth/useGoogleLogin";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const MAX_GSI_WIDTH = 400; // Google Identity Services clamps the button width here

// Google's "G" mark, used only on the disabled placeholder — once a real
// Client ID is set, Google renders its own button (with its own logo).
function GoogleLogo({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18A13.98 13.98 0 0 1 10.9 24c0-1.45.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

// Loads the Google Identity Services script once, however many times this
// component mounts (login page, then register page, etc.)
let gsiScriptPromise = null;
function loadGsiScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiScriptPromise) {
    gsiScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", resolve);
        existing.addEventListener("error", reject);
        return;
      }
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return gsiScriptPromise;
}

/**
 * Google's own rendered button (via Identity Services) — required by Google's
 * branding guidelines, which don't allow arbitrarily reskinning it to match
 * Figma's pill buttons. Renders as a disabled "coming soon" pill instead when
 * VITE_GOOGLE_CLIENT_ID isn't set.
 */
export default function GoogleSignInButton() {
  const targetId = useId();
  const wrapperRef = useRef(null);
  const targetRef = useRef(null);
  const [ready, setReady] = useState(false);
  const { mutate: googleLogin, isPending } = useGoogleLogin();

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGsiScript().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Google's rendered button has a fixed pixel width that doesn't react to CSS,
  // so we re-render it at the wrapper's current width whenever it resizes
  // (viewport resize, orientation change) to keep it from overflowing or
  // leaving dead space.
  useEffect(() => {
    if (!CLIENT_ID || !ready || !targetRef.current || !wrapperRef.current) return;

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response) => googleLogin(response.credential),
    });

    const renderAtCurrentWidth = () => {
      if (!targetRef.current || !wrapperRef.current) return;
      const width = Math.max(
        1,
        Math.min(Math.round(wrapperRef.current.offsetWidth), MAX_GSI_WIDTH)
      );
      targetRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(targetRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        shape: "pill",
        logo_alignment: "center",
        width,
      });
    };

    renderAtCurrentWidth();
    const observer = new ResizeObserver(renderAtCurrentWidth);
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
    // googleLogin is a fresh function every render (useMutation); re-initializing
    // Google's widget on every render would flicker, so it's intentionally omitted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Google sign-in isn't set up yet"
        className="flex h-[50px] flex-1 cursor-not-allowed items-center justify-center gap-2.5 rounded-xl border border-border font-body text-caption font-medium text-taupe-light"
      >
        <GoogleLogo className="size-[18px] opacity-60" />
        Continue with Google
      </button>
    );
  }

  return (
    <div ref={wrapperRef} className="relative h-[50px] flex-1">
      <div id={targetId} ref={targetRef} className="flex justify-center" />
      {(!ready || isPending) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-border bg-white font-body text-caption text-taupe-light">
          {isPending ? "Signing in…" : "Loading…"}
        </div>
      )}
    </div>
  );
}
