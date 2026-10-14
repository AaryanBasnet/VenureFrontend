import { BarChart3, Building2, CalendarCheck, Inbox, LayoutDashboard, MessageSquare, Star, Wallet } from "lucide-react";
import DashboardLayout from "./DashboardLayout";
import { useOwnerInquiries } from "../features/inquiry/hooks/useInquiries";

const SECTIONS = [
  { title: "Overview", items: [
    { Icon: LayoutDashboard, label: "Dashboard", to: "/owner/dashboard" },
    { Icon: BarChart3, label: "Analytics", to: "/owner/analytics" },
  ] },
  { title: "Requests", items: [
    { Icon: Inbox, label: "Inquiries", to: "/owner/inquiries", badgeKey: "inquiries" },
    { Icon: CalendarCheck, label: "Bookings", to: "/owner/bookings" },
    { Icon: MessageSquare, label: "Messages", to: "/owner/chat" },
  ] },
  { title: "Your venues", items: [
    { Icon: Building2, label: "Venues", to: "/owner/venues" },
    { Icon: Star, label: "Reviews", to: "/owner/reviews" },
  ] },
  { title: "Money", items: [{ Icon: Wallet, label: "Payments", to: "/owner/payments" }] },
];

export default function OwnerLayout() {
  const { data: inquiries = [] } = useOwnerInquiries();
  const waiting = inquiries.filter((q) => q.status === "pending" && !q.booking).length;
  return <DashboardLayout role="Owner" homeTo="/owner/dashboard" sections={SECTIONS} badges={{ inquiries: waiting }} />;
}
