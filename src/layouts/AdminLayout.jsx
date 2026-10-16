import { LayoutDashboard, Building2, MessageSquare, Star, UserCog, Users } from "lucide-react";
import DashboardLayout from "./DashboardLayout";

const SECTIONS = [
  { title: "Overview", items: [{ Icon: LayoutDashboard, label: "Dashboard", to: "/admin/dashboard" }] },
  { title: "People", items: [
    { Icon: Users, label: "Users", to: "/admin/user" },
    { Icon: UserCog, label: "Venue owners", to: "/admin/owner" },
  ] },
  { title: "Content", items: [
    { Icon: Building2, label: "Venues", to: "/admin/venue" },
    { Icon: Star, label: "Reviews", to: "/admin/reviews" },
    { Icon: MessageSquare, label: "Messages", to: "/admin/contact" },
  ] },
];

export default function AdminLayout() {
  return <DashboardLayout role="Admin" homeTo="/admin/dashboard" sections={SECTIONS} />;
}
