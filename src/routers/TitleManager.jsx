import { useLocation } from "react-router-dom";
import { usePageTitle } from "../utils/usePageTitle";

const EXACT = {
  "/": null,
  "/venues": "Venues",
  "/about": "About",
  "/contact": "Contact",
  "/login": "Sign in",
  "/register": "Create an account",
  "/password-reset": "Reset your password",
  "/profile": "Your profile",
  "/favorites": "Favorites",
  "/chat": "Messages",
  "/my-inquiries": "My inquiries",
  "/my-bookings": "My bookings",
  "/unauthorized": "Access denied",
  "/owner/dashboard": "Owner dashboard",
  "/owner/venues": "My venues",
  "/owner/inquiries": "Inquiries",
  "/owner/bookings": "Bookings",
  "/owner/analytics": "Analytics",
  "/owner/payments": "Payments",
  "/owner/reviews": "Reviews",
  "/owner/chat": "Messages",
  "/admin/dashboard": "Admin dashboard",
};

const titleFor = (path) => {
  if (path in EXACT) return EXACT[path];
  if (/^\/my-inquiries\//.test(path)) return "Your request";
  if (/^\/owner\/inquiries\//.test(path)) return "Inquiry";
  if (/^\/venue\/[^/]+\/inquire$/.test(path)) return "Request a date";
  if (/^\/admin\//.test(path)) return "Admin";
  return undefined; // venue pages and the 404 page set their own title
};

// Gives every route a title. Pages that know a better one (a venue's name) set it themselves.
export default function TitleManager() {
  const { pathname } = useLocation();
  const title = titleFor(pathname);
  usePageTitle(title === undefined ? null : title);
  return null;
}
