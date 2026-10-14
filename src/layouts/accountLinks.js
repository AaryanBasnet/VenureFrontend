import { Calendar, ClipboardList, Heart, LayoutDashboard, UserCircle2 } from "lucide-react";

// Account links for the header menus, by role. Customers get their activity; owners and admins get their dashboard.
const CUSTOMER_LINKS = [
  { label: "Profile", to: "/profile", icon: UserCircle2 },
  { label: "My inquiries", to: "/my-inquiries", icon: ClipboardList },
  { label: "My bookings", to: "/my-bookings", icon: Calendar },
  { label: "Favorites", to: "/favorites", icon: Heart },
];

export const accountLinksFor = (user) => {
  if (user?.role === "VenueOwner") return [{ label: "Owner dashboard", to: "/owner/dashboard", icon: LayoutDashboard }];
  if (user?.role === "Admin") return [{ label: "Admin dashboard", to: "/admin/dashboard", icon: LayoutDashboard }];
  return CUSTOMER_LINKS;
};
