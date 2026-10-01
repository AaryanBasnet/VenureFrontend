import { useEffect, useId, useRef, useState } from "react";
import { useGoogleLogin } from "../../hooks/auth/useGoogleLogin";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const MAX_GSI_WIDTH = 400; // Google Identity Services clamps the button width here

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
        className="flex h-[50px] flex-1 items-center justify-center gap-2.5 rounded-xl border border-border font-body text-[13px] font-medium text-taupe-light"
      >
        Continue with Google
      </button>
    );
  }

  return (
    <div ref={wrapperRef} className="relative h-[50px] flex-1">
      <div id={targetId} ref={targetRef} className="[&>div]:!w-full" />
      {(!ready || isPending) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-border bg-white font-body text-[13px] text-taupe-light">
          {isPending ? "Signing in…" : "Loading…"}
        </div>
      )}
    </div>
  );
}
