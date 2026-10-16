import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Building2, CalendarCheck, Check, ClipboardCheck, Star, Trophy, UserPlus, Users, Wallet, X } from "lucide-react";
import MonthlyEarningsChart from "../../components/owner/MonthlyEarningsChart";
import { EmptyState, ErrorState, PageHeader, Panel, RowsSkeleton, Stat } from "../../components/dashboard/ui";
import { btnDanger, btnOutline, btnPrimary, npr, shortDate } from "../../components/dashboard/styles";
import { useActivityLogs } from "../../hooks/admin/useActivityLogs";
import { useGetApprovedVenuesCount } from "../../hooks/admin/useGetApprovedVenuesCount";
import { useGetCustomerCount } from "../../hooks/admin/useGetCustomerCount";
import { useGetTotalBookingsForAdmin } from "../../hooks/admin/useGetTotalBookings";
import useGetTotalEarnings from "../../hooks/admin/useGetTotalEarnings";
import { useTopVenuesByBooking } from "../../hooks/admin/useTopVenuesByBooking";
import { changeVenueStatus, getVenue } from "../../services/admin/adminVenueService";
import dayjs from "../../utils/dayjsConfig";

const seeAll = "font-body text-caption text-gold-800 underline underline-offset-4 hover:text-ink";
const PENDING_KEY = ["admin_dashboard_pending_venues"];

const ACTIVITY_ICONS = { user: Users, registration: UserPlus, booking: CalendarCheck, venue: Building2, payment: Wallet, system: Activity };

// One pending venue with an inline approve / reject confirm.
function PendingRow({ venue }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(null); // "approved" | "rejected" | null
  const mutation = useMutation({
    mutationFn: (status) => changeVenueStatus(venue._id, status),
    onSuccess: () => {
      setConfirming(null);
      for (const key of [PENDING_KEY, ["admin_venues"], ["admin_venue"], ["Count_Venues"], ["topVenuesByBooking"]]) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });

  const approving = confirming === "approved";
  return (
    <li className="px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-body text-body text-ink">{venue.venueName}</p>
          <p className="mt-0.5 truncate font-body text-caption text-taupe">
            {[venue.owner?.name && `by ${venue.owner.name}`, venue.location?.city, venue.createdAt && `submitted ${shortDate(venue.createdAt)}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        {!confirming && (
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setConfirming("approved")} aria-label={`Approve ${venue.venueName}`} className={`${btnPrimary} !px-4 !py-1.5`}>
              <Check aria-hidden="true" className="size-4" /> Approve
            </button>
            <button type="button" onClick={() => setConfirming("rejected")} aria-label={`Reject ${venue.venueName}`} className={`${btnDanger} !px-4 !py-1.5`}>
              <X aria-hidden="true" className="size-4" /> Reject
            </button>
          </div>
        )}
      </div>
      {confirming && (
        <div className="mt-3 rounded-card-sm bg-cream p-3">
          <p className="font-body text-small text-ink">
            {approving ? "Approve this venue? It goes live and the owner is told." : "Reject this venue? The owner is told it was not approved."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={mutation.isPending} onClick={() => mutation.mutate(confirming)} className={`${approving ? btnPrimary : btnDanger} !px-4 !py-1.5`}>
              {mutation.isPending ? "Saving..." : approving ? "Yes, approve" : "Yes, reject"}
            </button>
            <button type="button" disabled={mutation.isPending} onClick={() => { mutation.reset(); setConfirming(null); }} className={`${btnOutline} !px-4 !py-1.5`}>
              Keep waiting
            </button>
          </div>
          {mutation.isError && (
            <p role="alert" className="mt-2 font-body text-caption text-red-700">
              {mutation.error?.response?.data?.message ?? "We could not update this venue. Please try again."}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export default function AdminDashboard() {
  const customers = useGetCustomerCount();
  const venueCount = useGetApprovedVenuesCount();
  const bookings = useGetTotalBookingsForAdmin();
  const earnings = useGetTotalEarnings();
  const topVenues = useTopVenuesByBooking();
  const activity = useActivityLogs();
  const pending = useQuery({
    queryKey: PENDING_KEY,
    queryFn: () => getVenue({ status: "pending", limit: 5, page: 1 }),
  });

  const monthIndex = new Date().getMonth();
  const monthValue = earnings.data?.[monthIndex]?.totalEarnings ?? 0;
  const pendingTotal = pending.data?.total ?? 0;
  const pendingVenues = pending.data?.venues ?? [];
  const logs = (activity.data ?? []).slice(0, 8);

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Platform overview"
        description="Venues waiting for your decision come first, then how the platform is doing."
        actions={
          <Link to="/admin/venue" className={btnOutline}>
            <Building2 aria-hidden="true" className="size-4" /> Manage venues
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Customers" value={(customers.data ?? 0).toLocaleString("en-US")} hint="Registered accounts" icon={Users} to="/admin/user" loading={customers.isPending} />
        <Stat label="Approved venues" value={venueCount.data ?? 0} hint={pending.isSuccess && pendingTotal ? `${pendingTotal} more waiting for approval` : "Live on Venure"} icon={Building2} to="/admin/venue" loading={venueCount.isPending} />
        <Stat label="Total bookings" value={(bookings.data ?? 0).toLocaleString("en-US")} hint="All time, every status" icon={CalendarCheck} loading={bookings.isPending} />
        <Stat label="Booked this month" value={npr(monthValue)} hint="Confirmed and completed events" icon={Wallet} loading={earnings.isPending} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Venues awaiting approval"
          description={pending.isSuccess ? (pendingTotal ? `${pendingTotal} waiting for a decision` : "Nothing to review") : "Newest submissions first"}
          bodyClassName="p-0"
          action={<Link to="/admin/venue" className={seeAll}>All venues</Link>}
        >
          {pending.isPending ? (
            <RowsSkeleton />
          ) : pending.isError ? (
            <ErrorState onRetry={pending.refetch} />
          ) : pendingVenues.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No venues waiting">New venues submitted by owners will appear here for review.</EmptyState>
          ) : (
            <>
              <ul className="divide-y divide-line">
                {pendingVenues.map((v) => (
                  <PendingRow key={v._id} venue={v} />
                ))}
              </ul>
              {pendingTotal > pendingVenues.length && (
                <p className="border-t border-line px-6 py-3 font-body text-caption text-taupe">
                  Showing {pendingVenues.length} of {pendingTotal}.{" "}
                  <Link to="/admin/venue" className="text-gold-800 underline underline-offset-4 hover:text-ink">Review the rest</Link>
                </p>
              )}
            </>
          )}
        </Panel>

        <Panel title="Top venues" description="Most confirmed and completed bookings" bodyClassName="p-0" action={<Link to="/admin/venue" className={seeAll}>All venues</Link>}>
          {topVenues.isPending ? (
            <RowsSkeleton />
          ) : topVenues.isError ? (
            <ErrorState onRetry={topVenues.refetch} />
          ) : (topVenues.data ?? []).length === 0 ? (
            <EmptyState icon={Trophy} title="No bookings yet">The venues with the most events will be ranked here.</EmptyState>
          ) : (
            <ol className="divide-y divide-line">
              {topVenues.data.map((v, i) => (
                <li key={v.venueId} className="flex items-center gap-4 px-6 py-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-100 font-display text-small text-gold-800" aria-hidden="true">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-body text-ink">{v.venueName}</p>
                    <p className="mt-0.5 truncate font-body text-caption text-taupe">{[v.location?.city, v.location?.state].filter(Boolean).join(", ") || "Location not set"}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-body text-small text-ink">{v.bookingCount} {v.bookingCount === 1 ? "booking" : "bookings"}</p>
                    <p className="mt-0.5 flex items-center justify-end gap-1 font-body text-caption text-taupe">
                      <Star aria-hidden="true" className="size-3.5 text-gold-800" />
                      {v.averageRating ? Number(v.averageRating).toFixed(1) : "No ratings"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <Panel title="Booked value by month" description={`${new Date().getFullYear()}, confirmed and completed events by event date`} className="mt-6">
        {earnings.isError ? (
          <ErrorState onRetry={earnings.refetch} />
        ) : earnings.isPending ? (
          <div role="status" aria-label="Loading" className="h-64 animate-pulse rounded-card-sm bg-gold-100" />
        ) : (
          <>
            <div className="h-64" aria-hidden="true">
              <MonthlyEarningsChart data={earnings.data ?? []} />
            </div>
            <table className="sr-only">
              <caption>Booked value by month</caption>
              <thead><tr><th scope="col">Month</th><th scope="col">Booked value</th><th scope="col">Bookings</th></tr></thead>
              <tbody>
                {(earnings.data ?? []).map((m) => (
                  <tr key={m.month}><th scope="row">{m.month}</th><td>{npr(m.totalEarnings)}</td><td>{m.bookingCount ?? 0}</td></tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Panel>

      <Panel title="Recent activity" description="Latest things that happened on the platform" bodyClassName="p-0" className="mt-6">
        {activity.isPending ? (
          <RowsSkeleton rows={4} />
        ) : activity.isError ? (
          <ErrorState onRetry={activity.refetch} />
        ) : logs.length === 0 ? (
          <EmptyState icon={Activity} title="No activity yet">Sign-ups, bookings and venue changes will be listed here.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {logs.map((a) => {
              const Icon = ACTIVITY_ICONS[a.type] ?? Activity;
              return (
                <li key={a._id} className="flex items-start gap-4 px-6 py-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-100">
                    <Icon aria-hidden="true" className="size-4 text-gold-800" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-body text-small text-ink [overflow-wrap:anywhere]">{a.message}</p>
                    <p className="mt-0.5 font-body text-caption text-taupe">
                      {dayjs(a.createdAt).fromNow()}
                      {a.createdBy?.name ? ` · ${a.createdBy.name}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
