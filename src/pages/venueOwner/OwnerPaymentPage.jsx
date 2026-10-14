import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, CalendarDays, ChevronLeft, ChevronRight, CircleCheck, Landmark, Wallet } from "lucide-react";
import MonthlyEarningsChart from "../../components/owner/MonthlyEarningsChart";
import { EmptyState, ErrorState, PageHeader, Panel, Pill, RowsSkeleton, Stat } from "../../components/owner/ui";
import { btnOutline, npr, shortDate } from "../../components/owner/ownerStyles";
import { bsLabel } from "../../features/inquiry/bsCalendar";
import { shiftLabel } from "../../features/inquiry/inquiryOptions";
import { useGetMonthlyEarningsForOwner } from "../../hooks/owner/useGetMonthlyEarningForOwner";
import useOwnerBookings from "../../hooks/owner/useOwnerBookings";

const PER_PAGE = 8;
// Bookings where the customer has paid the eSewa deposit.
const PAID = ["confirmed", "completed"];

const FILTERS = [
  { id: "all", label: "All", match: () => true },
  { id: "due", label: "Balance due", match: (b) => !b.balanceSettled },
  { id: "settled", label: "Balance settled", match: (b) => b.balanceSettled },
];

const sum = (rows, key) => rows.reduce((s, b) => s + (Number(b[key]) || 0), 0);

function BalancePill({ booking }) {
  return booking.balanceSettled ? (
    <div>
      <Pill tone="success">Settled</Pill>
      {booking.balanceSettledMethod && <p className="mt-1 max-w-56 font-body text-caption text-taupe">{booking.balanceSettledMethod}</p>}
    </div>
  ) : (
    <Pill tone="gold">Due at the venue</Pill>
  );
}

function Who({ b }) {
  return (
    <>
      {b.customer?.name ?? b.contactName ?? "Customer"} · {shortDate(b.startTime)} <span className="text-taupe-light">({bsLabel(b.startTime)})</span>
      {b.shift ? ` · ${shiftLabel(b.shift)}` : ""}
    </>
  );
}

export default function OwnerPaymentPage() {
  const bookings = useOwnerBookings();
  const earnings = useGetMonthlyEarningsForOwner();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Only events whose deposit was paid count as money coming to the owner.
  const paid = useMemo(() => (bookings.data ?? []).filter((b) => PAID.includes(b.status)), [bookings.data]);
  const deposits = sum(paid, "depositAmount");
  const settled = sum(paid.filter((b) => b.balanceSettled), "balanceAmount");
  const due = sum(paid.filter((b) => !b.balanceSettled), "balanceAmount");
  const waitingDeposit = (bookings.data ?? []).filter((b) => b.status === "pending_deposit").length;

  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.id === filter);
    return paid.filter(f.match).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  }, [paid, filter]);
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const year = new Date().getFullYear();

  return (
    <>
      <PageHeader
        eyebrow="Payments"
        title="Deposits and balances"
        description="Customers pay a deposit online through eSewa. The rest is paid to you at the venue, in cash or by bank transfer, and you record it on the Bookings page."
        actions={
          <Link to="/owner/bookings" className={btnOutline}>
            Record a balance
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Deposits received (eSewa)" value={npr(deposits)} hint="Confirmed and completed events" icon={Wallet} loading={bookings.isPending} />
        <Stat label="Balance due at the venue" value={npr(due)} hint="Still to collect from customers" icon={Landmark} to="/owner/bookings" loading={bookings.isPending} />
        <Stat label="Balance settled" value={npr(settled)} hint="Recorded as received" icon={CircleCheck} loading={bookings.isPending} />
        <Stat label="Waiting for a deposit" value={waitingDeposit} hint="Not counted above until paid" icon={CalendarDays} loading={bookings.isPending} />
      </div>

      <Panel title="Booked value by month" description={`${year}, full event price of confirmed and completed events`} className="mt-6">
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
              <thead>
                <tr>
                  <th scope="col">Month</th>
                  <th scope="col">Booked value</th>
                </tr>
              </thead>
              <tbody>
                {(earnings.data ?? []).map((m) => (
                  <tr key={m.month}>
                    <th scope="row">{m.month}</th>
                    <td>{npr(m.totalEarnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Panel>

      <Panel title="Payments by event" description="One row per event with a paid deposit" bodyClassName="p-0" className="mt-6">
        <div role="group" aria-label="Filter by balance" className="flex flex-wrap gap-2 border-b border-line px-6 py-4">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              className={`rounded-full border px-4 py-1.5 font-body text-caption transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                filter === f.id ? "border-ink bg-ink text-gold-50" : "border-border-strong text-ink hover:border-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {bookings.isPending ? (
          <RowsSkeleton rows={4} />
        ) : bookings.isError ? (
          <ErrorState onRetry={bookings.refetch} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Banknote} title={paid.length ? "Nothing in this view" : "No payments yet"}>
            {paid.length ? "Try another filter." : "Once a customer pays a deposit, the event and its balance show up here."}
          </EmptyState>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-line font-body text-eyebrow uppercase text-taupe">
                    <th scope="col" className="px-6 py-3 font-normal">Event</th>
                    <th scope="col" className="px-3 py-3 font-normal">Total</th>
                    <th scope="col" className="px-3 py-3 font-normal">Deposit (eSewa)</th>
                    <th scope="col" className="px-3 py-3 font-normal">Balance</th>
                    <th scope="col" className="px-6 py-3 font-normal">Balance status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-body text-small text-ink">
                  {visible.map((b) => (
                    <tr key={b._id}>
                      <td className="px-6 py-4">
                        <p className="max-w-64 truncate text-body">{b.venue?.venueName ?? "Venue"}</p>
                        <p className="mt-0.5 text-caption text-taupe"><Who b={b} /></p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4">{npr(b.totalPrice)}</td>
                      <td className="whitespace-nowrap px-3 py-4">{npr(b.depositAmount)}</td>
                      <td className="whitespace-nowrap px-3 py-4">{npr(b.balanceAmount)}</td>
                      <td className="px-6 py-4"><BalancePill booking={b} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-line md:hidden">
              {visible.map((b) => (
                <li key={b._id} className="px-6 py-4">
                  <p className="truncate font-body text-body text-ink">{b.venue?.venueName ?? "Venue"}</p>
                  <p className="mt-0.5 font-body text-caption text-taupe"><Who b={b} /></p>
                  <dl className="mt-3 grid grid-cols-3 gap-2 font-body text-caption">
                    <div><dt className="text-taupe">Total</dt><dd className="text-ink">{npr(b.totalPrice)}</dd></div>
                    <div><dt className="text-taupe">Deposit</dt><dd className="text-ink">{npr(b.depositAmount)}</dd></div>
                    <div><dt className="text-taupe">Balance</dt><dd className="text-ink">{npr(b.balanceAmount)}</dd></div>
                  </dl>
                  <div className="mt-3"><BalancePill booking={b} /></div>
                </li>
              ))}
            </ul>

            {pages > 1 && (
              <nav aria-label="Payments pages" className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
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

      <p className="mt-4 font-body text-caption text-taupe">
        If a booking is cancelled, Venure pays any eSewa refund back to the customer by hand. Cancelled events are not counted above.
      </p>
    </>
  );
}
