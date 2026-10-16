import { useEffect, useState } from "react";

// A text box that follows a URL value and writes back to it after a short pause.
// `clean` turns what was typed into what the URL stores; when the URL changes from outside (back button, a shared link, "clear"), the box follows.
export function useDebouncedField(urlValue, clean, commit, delay = 400) {
  const [text, setText] = useState(urlValue);
  useEffect(() => setText(urlValue), [urlValue]);
  useEffect(() => {
    if (clean(text) === urlValue) return undefined;
    const t = setTimeout(() => commit(clean(text)), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return [text, setText];
}

export const digitsOnly = (s) => s.replace(/\D/g, "").replace(/^0+/, "");
