import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Banknote, CalendarCheck, CalendarDays, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import MonthlyEarningsChart from "../../components/owner/MonthlyEarningsChart";
import { EmptyState, ErrorState, PageHeader, Panel, RowsSkeleton, Stat, StatusPill } from "../../components/owner/ui";
import { btnOutline, npr, shortDate } from "../../components/owner/ownerStyles";
import { bsLabel } from "../../features/inquiry/bsCalendar";
import { shiftLabel } from "../../features/inquiry/inquiryOptions";
import { useGetMonthlyEarningsForOwner } from "../../hooks/owner/useGetMonthlyEarningForOwner";
import { useGetTotalBookingsForOwner } from "../../hooks/owner/useGetTotalBookingsForOwner";
import useOwnerBookings from "../../hooks/owner/useOwnerBookings";

const INK = "#1a1208";
const GRID = "#e2d5bf";
const MUTED = "#6e655a";
const PER_PAGE = 6;

function CountTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-card-sm border border-line bg-white px-3 py-2 shadow-md">
      <p className="font-body text-caption text-taupe">{label}</p>
      <p className="font-display text-h5 font-light text-ink">
        {payload[0].value} {payload[0].value === 1 ? "event" : "events"}
      </p>
    </div>
  );
}

// Plain-text version of the charts for screen readers.
function ChartSummary({ rows }) {
  return (
    <table className="sr-only">
      <caption>Booked value and number of events by month</caption>
      <thead>
        <tr>
          <th scope="col">Month</th>
          <th scope="col">Booked value</th>
          <th scope="col">Events</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m.month}>
            <th scope="row">{m.month}</th>
            <td>{npr(m.totalEarnings)}</td>
            <td>{m.bookingCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const ChartSkeleton = () => <div role="status" aria-label="Loading" className="h-72 animate-pulse rounded-card-sm bg-gold-100" />;

export default function OwnerAnalyticsPage() {
  const total = useGetTotalBookingsForOwner();
  const earnings = useGetMonthlyEarningsForOwner();
  const bookings = useOwnerBookings();
  const [page, setPage] = useState(1);

  const months = useMemo(() => earnings.data ?? [], [earnings.data]);
  const yearValue = useMemo(() => months.reduce((s, m) => s + (m.totalEarnings || 0), 0), [months]);
  const yearCount = useMemo(() => months.reduce((s, m) => s + (m.bookingCount || 0), 0), [months]);
  const peak = useMemo(() => months.reduce((best, m) => (m.bookingCount > (best?.bookingCount ?? 0) ? m : best), null), [months]);
  const year = new Date().getFullYear();
  const avgPerMonth = yearCount / 12;

  const list = bookings.data ?? [];
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, pages);
  const visible = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="How your venues are doing"
        description="Confirmed and completed events by month. Booked value is the full event price, not only the deposit paid online."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Confirmed events" value={total.data ?? 0} hint="All time, including completed" icon={CalendarCheck} loading={total.isPending} />
        <Stat label={`Booked value ${year}`} value={npr(yearValue)} hint="Confirmed and completed events" icon={Banknote} loading={earnings.isPending} />
        <Stat
          label="Busiest month"
          value={peak?.month ?? "None yet"}
          hint={peak ? `${peak.bookingCount} ${peak.bookingCount === 1 ? "event" : "events"}` : `No events in ${year} yet`}
          icon={TrendingUp}
          loading={earnings.isPending}
        />
        <Stat label="Average per month" value={avgPerMonth.toFixed(1)} hint={`Events a month across ${year}`} icon={CalendarDays} loading={earnings.isPending} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Booked value by month" description={`${year}, in NPR`}>
          {earnings.isError ? (
            <ErrorState onRetry={earnings.refetch} />
          ) : earnings.isPending ? (
            <ChartSkeleton />
          ) : (
            <>
              <div className="h-72" aria-hidden="true">
                <MonthlyEarningsChart data={months} />
              </div>
              <ChartSummary rows={months} />
            </>
          )}
        </Panel>
        <Panel title="Events by month" description={`${year}, confirmed and completed`}>
          {earnings.isError ? (
            <ErrorState onRetry={earnings.refetch} />
          ) : earnings.isPending ? (
            <ChartSkeleton />
          ) : (
            <div className="h-72" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={months} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: MUTED, fontSize: 12 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={32} tick={{ fill: MUTED, fontSize: 12 }} />
                  <Tooltip content={<CountTooltip />} cursor={{ fill: "#f3ead8" }} />
                  <Bar dataKey="bookingCount" fill={INK} radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Recent bookings" description="Across all your venues" bodyClassName="p-0" className="mt-6">
        {bookings.isPending ? (
          <RowsSkeleton rows={4} />
        ) : bookings.isError ? (
          <ErrorState onRetry={bookings.refetch} />
        ) : list.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No bookings yet">
            Bookings appear here once a customer pays a deposit.
          </EmptyState>
        ) : (
          <>
            <ul className="divide-y divide-line">
              {visible.map((b) => (
                <li key={b._id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4">
                  <div className="min-w-0 flex-1 basis-56">
                    <p className="truncate font-body text-body text-ink">{b.venue?.venueName ?? "Venue"}</p>
                    <p className="mt-0.5 font-body text-caption text-taupe">
                      {b.customer?.name ?? b.contactName ?? "Customer"} · {shortDate(b.startTime)}{" "}
                      <span className="text-taupe-light">({bsLabel(b.startTime)})</span>
                      {b.shift ? ` · ${shiftLabel(b.shift)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusPill status={b.status} />
                    <p className="min-w-28 text-right font-body text-small text-ink">{npr(b.totalPrice)}</p>
                  </div>
                </li>
              ))}
            </ul>
            {pages > 1 && (
              <nav aria-label="Bookings pages" className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
                <button type="button" className={btnOutline} disabled={current === 1} onClick={() => setPage(current - 1)}>
                  <ChevronLeft aria-hidden="true" className="size-4" /> Previous
                </button>
                <span className="font-body text-caption text-taupe">
                  Page {current} of {pages}
                </span>
                <button type="button" className={btnOutline} disabled={current === pages} onClick={() => setPage(current + 1)}>
                  Next <ChevronRight aria-hidden="true" className="size-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </Panel>
    </>
  );
}
