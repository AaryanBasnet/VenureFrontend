import { useEffect, useState } from "react";

// False until the browser has painted the page and has a moment to spare. Data for sections below the fold waits for
// this, so its requests do not compete with the code and fonts that draw the top of the page.
export function useAfterFirstPaint() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const run = () => setReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(run, 200);
    return () => clearTimeout(id);
  }, []);
  return ready;
}
