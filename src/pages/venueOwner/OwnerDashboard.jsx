import { useContext } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, CalendarCheck, CalendarDays, Inbox, Plus, Wallet } from "lucide-react";
import { AuthContext } from "../../auth/AuthProvider";
import MonthlyEarningsChart from "../../components/owner/MonthlyEarningsChart";
import { EmptyState, ErrorState, PageHeader, Panel, RowsSkeleton, Stat, StatusPill } from "../../components/dashboard/ui";
import { btnPrimary, npr, shortDate } from "../../components/dashboard/styles";
import { useOwnerInquiries } from "../../features/inquiry/hooks/useInquiries";
import { bsLabel } from "../../features/inquiry/bsCalendar";
import { serverDay, shiftLabel } from "../../features/inquiry/inquiryOptions";
import useActiveVenueCount from "../../hooks/owner/useGetActiveVenueCount";
import { useGetMonthlyEarningsForOwner } from "../../hooks/owner/useGetMonthlyEarningForOwner";
import useOwnerBookings from "../../hooks/owner/useOwnerBookings";
import { plural } from "../../utils/plural";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

// What the owner has to do today comes first (requests waiting for a quotation, upcoming events);
// money and charts follow.
export default function OwnerDashboard() {
  const { user } = useContext(AuthContext);
  const inquiries = useOwnerInquiries();
  const bookings = useOwnerBookings();
  const earnings = useGetMonthlyEarningsForOwner();
  const venues = useActiveVenueCount(user?._id);

  const needsReply = (inquiries.data ?? []).filter((q) => q.status === "pending" && !q.booking);
  const now = Date.now();
  const upcoming = (bookings.data ?? [])
    .filter((b) => ["confirmed", "pending_deposit"].includes(b.status) && new Date(b.startTime).getTime() >= now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  const monthIndex = new Date().getMonth();
  const monthEarnings = earnings.data?.[monthIndex]?.totalEarnings ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`${greeting()}, ${user?.name?.split(" ")[0] ?? "there"}`}
        description="Here is what needs you today and how your venues are doing."
        actions={
          <Link to="/owner/venues" className={btnPrimary}>
            <Plus aria-hidden="true" className="size-4" /> Add a venue
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Waiting for a reply" value={needsReply.length} hint={needsReply.length ? "Send a quotation to hold their date" : "You are all caught up"} icon={Inbox} to="/owner/inquiries" loading={inquiries.isPending} />
        <Stat label="Upcoming events" value={upcoming.length} hint="Confirmed or awaiting deposit" icon={CalendarCheck} to="/owner/bookings" loading={bookings.isPending} />
        <Stat label="Booked this month" value={npr(monthEarnings)} hint="Total value of confirmed events" icon={Wallet} to="/owner/payments" loading={earnings.isPending} />
        <Stat label="Active venues" value={venues.data ?? 0} hint="Listed on Venure" icon={Building2} to="/owner/venues" loading={venues.isPending} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Needs your reply"
          description="Newest requests first"
          bodyClassName="p-0"
          action={<Link to="/owner/inquiries" className="font-body text-caption text-gold-800 underline underline-offset-4 hover:text-ink">See all</Link>}
        >
          {inquiries.isPending ? (
            <RowsSkeleton />
          ) : inquiries.isError ? (
            <ErrorState onRetry={inquiries.refetch} />
          ) : needsReply.length === 0 ? (
            <EmptyState icon={Inbox} title="No requests waiting">New requests from customers will show up here, and in your notifications.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {needsReply.slice(0, 5).map((q) => (
                <li key={q._id}>
                  <Link to={`/owner/inquiries/${q._id}`} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-cream focus-visible:bg-cream focus-visible:outline-none">
                    <div className="min-w-0">
                      <p className="truncate font-body text-body text-ink">{q.customer?.name ?? q.contactName}</p>
                      <p className="mt-0.5 truncate font-body text-caption text-taupe">
                        {q.venue?.venueName} · {shortDate(q.preferredDate)}
                        {q.preferredShift ? ` · ${shiftLabel(q.preferredShift)}` : ""} · {plural(q.numberOfGuests, "guest")}
                      </p>
                    </div>
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-taupe" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Coming up"
          description="Your next events"
          bodyClassName="p-0"
          action={<Link to="/owner/bookings" className="font-body text-caption text-gold-800 underline underline-offset-4 hover:text-ink">All bookings</Link>}
        >
          {bookings.isPending ? (
            <RowsSkeleton />
          ) : bookings.isError ? (
            <ErrorState onRetry={bookings.refetch} />
          ) : upcoming.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming events">When a customer pays a deposit, the booking appears here.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {upcoming.slice(0, 5).map((b) => (
                <li key={b._id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="truncate font-body text-body text-ink">{b.venue?.venueName ?? "Venue"}</p>
                    <p className="mt-0.5 truncate font-body text-caption text-taupe">
                      {shortDate(b.startTime)} <span className="text-taupe">({bsLabel(serverDay(b.startTime))})</span>
                      {b.shift ? ` · ${shiftLabel(b.shift)}` : ""} · {b.customer?.name ?? b.contactName}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-body text-small text-ink">{npr(b.totalPrice)}</p>
                    <StatusPill status={b.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Booked value by month" description={`${new Date().getFullYear()}, confirmed and completed events`} className="mt-6">
        {earnings.isError ? (
          <ErrorState onRetry={earnings.refetch} />
        ) : earnings.isPending ? (
          <div role="status" aria-label="Loading" className="h-64 animate-pulse rounded-card-sm bg-gold-100" />
        ) : (
          <div className="h-64">
            <MonthlyEarningsChart data={earnings.data ?? []} />
          </div>
        )}
      </Panel>
    </>
  );
}
