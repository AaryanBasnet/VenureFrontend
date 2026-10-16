import { ClipboardList, LayoutDashboard, Building2, MessageSquare, Star, UserCog, Users } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { usePendingApplications } from "../hooks/admin/useVenueApplications";

const SECTIONS = [
  { title: "Overview", items: [{ Icon: LayoutDashboard, label: "Dashboard", to: "/admin/dashboard" }] },
  { title: "People", items: [
    { Icon: Users, label: "Users", to: "/admin/user" },
    { Icon: UserCog, label: "Venue owners", to: "/admin/owner" },
    { Icon: ClipboardList, label: "Applications", to: "/admin/applications", badgeKey: "applications" },
  ] },
  { title: "Content", items: [
    { Icon: Building2, label: "Venues", to: "/admin/venue" },
    { Icon: Star, label: "Reviews", to: "/admin/reviews" },
    { Icon: MessageSquare, label: "Messages", to: "/admin/contact" },
  ] },
];

export default function AdminLayout() {
  const { data: waiting = 0 } = usePendingApplications();
  return <DashboardLayout role="Admin" homeTo="/admin/dashboard" sections={SECTIONS} badges={{ applications: waiting }} />;
}
