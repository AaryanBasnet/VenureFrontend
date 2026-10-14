// Uploaded files may be a full URL (Cloudinary) or a path served by the API host.
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/api\/?$/, "");

export const assetUrl = (path) => {
  if (!path) return null;
  return /^https?:\/\//.test(path) ? path : `${API_ORIGIN}/${String(path).replace(/^\/+/, "")}`;
};
