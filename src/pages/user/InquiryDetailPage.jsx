import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  apiError,
  useAcceptQuotation,
  useCancelInquiry,
  useInquiry,
  useQuotation,
  useExpiredQuotation,
  useRejectQuotation,
  useRequireLogin,
} from "../../features/inquiry/hooks/useInquiries";
import StatusBadge from "../../features/inquiry/components/StatusBadge";
import QuotationSummary from "../../features/inquiry/components/QuotationSummary";
import RequestFiles from "../../features/inquiry/components/Attachments";
import DepositPayment from "../../features/inquiry/components/DepositPayment";
import { bsLabel } from "../../features/inquiry/bsCalendar";
import { effectiveStatus, formatDate, formatHours, serverDay, shiftLabel } from "../../features/inquiry/inquiryOptions";
import { priceFormatter } from "../../features/venues/venueFormat";

const btn = "inline-flex min-h-11 items-center gap-2 rounded-full px-7 py-3 font-body text-button uppercase disabled:opacity-60";
const primary = `${btn} bg-ink text-gold-50 hover:bg-gold-800`;
const outline = `${btn} border border-ink text-ink hover:bg-ink hover:text-gold-50`;
const note = "rounded-card-lg border border-line bg-cream p-6";

function Row({ term, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="shrink-0 font-body text-small text-taupe">{term}</dt>
      <dd className="min-w-0 whitespace-pre-line break-words text-right font-body text-small text-ink">{children}</dd>
    </div>
  );
}

const npr = (n) => `NPR ${priceFormatter.format(Math.round(n || 0))}`;

export default function InquiryDetailPage() {
  const { id } = useParams();
  const { ready } = useRequireLogin();
  const { data: inquiry, isPending, isError, refetch } = useInquiry(id, ready);
  const quotationId = inquiry?.currentQuotation?._id ?? inquiry?.currentQuotation;
  const { data: quotation, isPending: quotationLoading, isError: quotationFailed } = useQuotation(quotationId);

  const expiredOn = useExpiredQuotation(quotation);
  const accept = useAcceptQuotation();
  const reject = useRejectQuotation();
  const cancel = useCancelInquiry();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null); // "decline" | "cancel" | null
  const [notice, setNotice] = useState("");

  if (!ready || isPending) {
    return <div role="status" aria-label="Loading" className="container-site page-pad"><div className="h-64 animate-pulse rounded-card-lg bg-gold-100" /></div>;
  }
  if (isError || !inquiry) {
    return (
      <div className="container-site flex min-h-[50vh] flex-col items-center justify-center gap-3 page-pad text-center">
        <h1 className="font-display text-h2 font-light text-ink">We could not find this request</h1>
        <p className="font-body text-small text-taupe">It may have been removed, or the connection dropped.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button type="button" onClick={() => refetch()} className={outline}>Try again</button>
          <Link to="/my-inquiries" className="font-body text-button uppercase text-gold-800 underline underline-offset-4">Back to my inquiries</Link>
        </div>
      </div>
    );
  }

  const status = effectiveStatus(inquiry);
  const expiredQuote = quotation?.validUntil && new Date(quotation.validUntil) < new Date();
  const startPayment = async () => {
    setError("");
    try {
      const result = await accept.mutateAsync(quotation._id);
      setPayment(result.payment);
      setNotice("Quotation accepted. The next step is paying the deposit.");
    } catch (e) {
      setError(apiError(e));
    }
  };
  const doReject = async () => {
    setError("");
    try {
      await reject.mutateAsync(quotation._id);
      setConfirm(null);
      setNotice("You declined the quotation. The request is back with the venue, which can send you another.");
    } catch (e) {
      setError(apiError(e));
    }
  };
  const doCancel = async () => {
    setError("");
    try {
      await cancel.mutateAsync(inquiry._id);
      setConfirm(null);
      setNotice("Your request is cancelled. Nothing was charged.");
    } catch (e) {
      setError(apiError(e));
    }
  };

  const busy = accept.isPending || reject.isPending || cancel.isPending;
  const hours = inquiry.space?.resolvedShifts?.[inquiry.preferredShift];
  const day = serverDay(inquiry.preferredDate);

  return (
    <div className="container-site page-pad">
      <Link to="/my-inquiries" className="inline-flex min-h-11 items-center font-body text-small text-taupe hover:text-ink">← My inquiries</Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-h2 font-light text-ink">{inquiry.venue?.venueName}</h1>
        <StatusBadge inquiry={inquiry} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <p role="status" className={notice ? "rounded-card-sm bg-sand px-4 py-3 font-body text-small text-ink" : "sr-only"}>{notice}</p>

          {expiredOn && !["booked", "accepted"].includes(status) && (
            <div role="status" className={note}>
              <h2 className="font-display text-h4 font-light text-ink">This quotation expired</h2>
              <p className="mt-2 font-body text-small text-ink">
                The venue's quotation was valid until {formatDate(serverDay(expiredOn))}. Nothing was charged. The venue can send you a new one, or you can send a request for another date.
              </p>
            </div>
          )}

          {status === "booked" && (
            <div className="rounded-card-lg border border-success/40 bg-white p-6">
              <CheckCircle2 aria-hidden="true" className="size-8 text-success" />
              <h2 className="mt-3 font-display text-h3 font-light text-ink">Your date is confirmed</h2>
              <p className="mt-2 font-body text-body text-ink/85">The deposit is paid. You will settle the balance with the venue directly, by cash or bank transfer.</p>
              <Link to="/my-bookings" className={`${primary} mt-5`}>View my bookings</Link>
            </div>
          )}

          {status === "pending" && (
            <div className={note}>
              <h2 className="font-display text-h4 font-light text-ink">Waiting for the venue</h2>
              <p className="mt-2 font-body text-small text-taupe">The venue is checking your date. You will get a notification when its quotation arrives. Nothing is charged until you accept it.</p>
            </div>
          )}

          {status === "quoted" && !quotation && quotationLoading && <div role="status" aria-label="Loading quotation" className="h-48 animate-pulse rounded-card-lg bg-gold-100" />}
          {status === "quoted" && quotationFailed && (
            <div role="alert" className={note}>
              <p className="font-body text-small text-ink">The quotation could not be loaded.</p>
              <button type="button" onClick={() => refetch()} className={`${outline} mt-3`}>Try again</button>
            </div>
          )}

          {quotation && quotation.status !== "expired" && status === "quoted" && (
            <>
              <QuotationSummary quotation={quotation} />
              <div className={note}>
                <h2 className="font-display text-h4 font-light text-ink">Your reply</h2>
                <p className="mt-2 font-body text-small text-ink/85">
                  Accepting reserves the date and takes you to eSewa to pay the {npr(quotation.depositAmount)} deposit. The balance of {npr(quotation.balanceAmount)} is paid to the venue directly.
                </p>
                {expiredQuote && <p role="alert" className="mt-2 font-body text-small text-red-700">This quotation is past its valid date. Accepting may be refused, and the venue may need to send a new one.</p>}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" onClick={startPayment} disabled={busy} className={primary}>
                    {accept.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                    Accept and pay deposit
                  </button>
                  <button type="button" onClick={() => setConfirm("decline")} disabled={busy} className={outline}>Decline this quote</button>
                </div>
                {confirm === "decline" && (
                  <div className="mt-4 rounded-card-md bg-sand p-4 font-body text-small text-ink">
                    <p>Decline this quotation? Your request goes back to the venue, which can send you a different one. You can also cancel the request below.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={doReject} disabled={busy} className="inline-flex min-h-11 items-center gap-2 px-2 font-semibold text-red-700 hover:underline disabled:opacity-60">
                        {reject.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                        Yes, decline it
                      </button>
                      <button type="button" onClick={() => setConfirm(null)} className="inline-flex min-h-11 items-center px-2 text-taupe hover:underline">Keep it</button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {quotation && status === "accepted" && (
            <>
              <QuotationSummary quotation={quotation} />
              {payment ? (
                <DepositPayment quotation={quotation} payment={payment} focusOnMount />
              ) : (
                <div className={note}>
                  <h2 className="font-display text-h4 font-light text-ink">Pay the deposit to confirm</h2>
                  <p className="mt-2 font-body text-small text-ink/85">
                    You accepted this quotation. Your date is confirmed once the {npr(quotation.depositAmount)} deposit is paid on eSewa.
                  </p>
                  <button type="button" onClick={startPayment} disabled={busy} className={`${primary} mt-4`}>
                    {accept.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                    Pay the deposit
                  </button>
                </div>
              )}
            </>
          )}

          {status === "declined" && (
            <div className={note}>
              <h2 className="font-display text-h4 font-light text-ink">The venue could not take this date</h2>
              <p className="mt-2 font-body text-small text-ink">Nothing was charged. You can try another date at this venue, or send a request to a different venue.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link to={`/venue/${inquiry.venue?._id}/inquire`} className={primary}>Try another date</Link>
                <Link to="/venues" className={outline}>Browse venues</Link>
              </div>
            </div>
          )}
          {status === "expired" && (
            <div className={note}>
              <h2 className="font-display text-h4 font-light text-ink">This request expired</h2>
              <p className="mt-2 font-body text-small text-ink">The date passed or the quotation ran out of time. Nothing was charged.</p>
              <Link to={`/venue/${inquiry.venue?._id}/inquire`} className={`${primary} mt-4`}>Send a new request</Link>
            </div>
          )}
          {status === "cancelled" && (
            <div className={note}>
              <h2 className="font-display text-h4 font-light text-ink">You cancelled this request</h2>
              <p className="mt-2 font-body text-small text-ink">Nothing was charged. You can send a new request whenever you like.</p>
              <Link to={`/venue/${inquiry.venue?._id}/inquire`} className={`${outline} mt-4`}>Request a date again</Link>
            </div>
          )}

          {error && <p role="alert" className="rounded-card-sm border border-red-700/30 bg-white px-4 py-3 font-body text-small text-red-700">{error}</p>}

          {["pending", "quoted"].includes(inquiry.status) && !inquiry.booking && (
            confirm === "cancel" ? (
              <div className="rounded-card-md bg-sand p-4 font-body text-small text-ink">
                <p>Cancel this request? The venue will no longer hold your date in mind and any quotation is withdrawn. Nothing has been charged.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={doCancel} disabled={busy} className="inline-flex min-h-11 items-center gap-2 px-2 font-semibold text-red-700 hover:underline disabled:opacity-60">
                    {cancel.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                    Yes, cancel the request
                  </button>
                  <button type="button" onClick={() => setConfirm(null)} className="inline-flex min-h-11 items-center px-2 text-taupe hover:underline">Keep it</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirm("cancel")} disabled={busy} className="inline-flex min-h-11 items-center font-body text-small text-taupe underline underline-offset-4 hover:text-ink disabled:opacity-60">
                Cancel this request
              </button>
            )
          )}
        </div>

        <aside aria-label="Your request" className="self-start rounded-card-lg border border-line bg-cream p-6">
          <p className="font-body text-eyebrow uppercase text-gold-800">Your request</p>
          <dl className="mt-3">
            <Row term="Date">{formatDate(day)}<span className="block text-caption text-taupe">{bsLabel(day)}</span></Row>
            <Row term="Shift">
              {inquiry.preferredShift ? shiftLabel(inquiry.preferredShift) : "Flexible"}
              {hours && <span className="block text-caption text-taupe">{formatHours(hours.startTime, hours.endTime)}</span>}
            </Row>
            <Row term="Hall or space">{inquiry.space?.name ?? "Venue to recommend"}</Row>
            <Row term="Guests">{inquiry.numberOfGuests}</Row>
            <Row term="Event">{inquiry.eventType}</Row>
            <Row term="Contact">{inquiry.contactName}{"\n"}{inquiry.phoneNumber}</Row>
            {inquiry.message && <Row term="Notes">{inquiry.message}</Row>}
            {inquiry.createdAt && <Row term="Sent">{formatDate(serverDay(inquiry.createdAt))}</Row>}
          </dl>
          <RequestFiles inquiry={inquiry} editable={["pending", "quoted"].includes(inquiry.status)} onChanged={refetch} />
          <Link to={`/venue/${inquiry.venue?._id}`} className="mt-4 inline-flex min-h-11 items-center font-body text-small text-gold-800 underline underline-offset-4">View the venue</Link>
        </aside>
      </div>
    </div>
  );
}
