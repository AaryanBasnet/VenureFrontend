// A non-secret hint that this browser has signed in before ("venure_session" in localStorage). The real session lives in
// HTTP-only cookies the page cannot read, so without a hint a guest's first visit would ask /auth/me, get a 401, ask
// /auth/refresh, get another 401, and only then render. With the hint absent we know there is nothing to refresh.
const KEY = "venure_session";

export const hasSessionMarker = () => {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true; // storage blocked: behave as before (try to refresh) rather than lock a signed-in user out
  }
};

export const setSessionMarker = () => {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable: the app still works, a guest check just costs one more request */
  }
};

export const clearSessionMarker = () => {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};
