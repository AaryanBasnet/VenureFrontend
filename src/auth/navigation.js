// Lets code that lives outside the router (the auth provider wraps it) send the visitor to another page
// without reloading the app. RouterBridge, rendered inside the router, registers the real navigate function.
let navigator = null;

export const registerNavigator = (fn) => {
  navigator = fn;
};

export const navigateOutsideRouter = (to, options) => {
  if (navigator) navigator(to, options);
  else window.location.assign(to); // only before the router has mounted
};

// The page the visitor is on right now, as a same-site path.
export const currentWindowPath = () => `${window.location.pathname}${window.location.search}${window.location.hash}`;
