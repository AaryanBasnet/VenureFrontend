import { useEffect } from "react";

export const SITE_TITLE = "Venure — Premium Event Venues";

// Sets the browser tab title for the current page, e.g. "Venues · Venure".
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Venure` : SITE_TITLE;
  }, [title]);
}
