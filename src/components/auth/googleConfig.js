// Google sign-in only exists when a Client ID is configured (VITE_GOOGLE_CLIENT_ID)
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const googleSignInConfigured = Boolean(GOOGLE_CLIENT_ID);
