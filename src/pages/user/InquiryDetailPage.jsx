import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  apiError,
  useAcceptQuotation,
  useCancelInquiry,
  useInquiry,
  useQuotation,
  useRejectQuotation,
  useRequireLogin,
} from "../../features/inquiry/hooks/useInquiries";
import StatusBadge from "../../features/inquiry/components/StatusBadge";
import QuotationSummary from "../../features/inquiry/components/QuotationSummary";
import DepositPayment from "../../features/inquiry/components/DepositPayment";
import { effectiveStatus, formatDate, shiftLabel } from "../../features/inquiry/inquiryOptions";

const btn = "inline-flex items-center gap-2 rounded-full px-7 py-3 font-body text-button uppercase disabled:opacity-60";
const primary = `${btn} bg-ink text-gold-50 hover:bg-gold-800`;
const outline = `${btn} border border-ink text-ink hover:bg-ink hover:text-gold-50`;

function Row({ term, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="font-body text-small text-taupe">{term}</dt>
      <dd className="whitespace-pre-line text-right font-body text-small text-ink">{children}</dd>
    </div>
  );
}

export default function InquiryDetailPage() {
  const { id } = useParams();
  const { ready } = useRequireLogin();
  const { data: inquiry, isPending, isError } = useInquiry(id, ready);
  const quotationId = inquiry?.currentQuotation?._id ?? inquiry?.currentQuotation;
  const { data: quotation } = useQuotation(quotationId);

  const accept = useAcceptQuotation();
  const reject = useRejectQuotation();
  const cancel = useCancelInquiry();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [justBooked, setJustBooked] = useState(false);

  if (!ready || isPending) {
    return <div role="status" aria-label="Loading" className="container-site pt-[calc(var(--spacing-header)+3rem)]"><div className="h-64 animate-pulse rounded-card-lg bg-gold-100" /></div>;
  }
  if (isError || !inquiry) {
    return (
      <div className="container-site flex min-h-[50vh] flex-col items-center justify-center gap-3 pt-[var(--spacing-header)] text-center">
        <h1 className="font-display text-h2 font-light text-ink">We could not find this request</h1>
        <Link to="/my-inquiries" className="font-body text-button uppercase text-gold-800 underline underline-offset-4">Back to my inquiries</Link>
      </div>
    );
  }

  const status = effectiveStatus(inquiry);
  const startPayment = async () => {
    setError("");
    try {
      const result = await accept.mutateAsync({ id: quotation._id, provider: "stripe" });
      setPayment(result.payment);
    } catch (e) {
      setError(apiError(e));
    }
  };
  const run = (mutation, arg) => async () => {
    setError("");
    try {
      await mutation.mutateAsync(arg);
    } catch (e) {
      setError(apiError(e));
    }
  };

  return (
    <div className="container-site pb-24 pt-[calc(var(--spacing-header)+2.5rem)]">
      <Link to="/my-inquiries" className="font-body text-small text-taupe hover:text-ink">← My inquiries</Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-h2 font-light text-ink">{inquiry.venue?.venueName}</h1>
        <StatusBadge inquiry={inquiry} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {(status === "booked" || justBooked) && (
            <div className="rounded-card-lg border border-success/40 bg-white p-6">
              <CheckCircle2 aria-hidden="true" className="size-8 text-success" />
              <h2 className="mt-3 font-display text-h3 font-light text-ink">Your date is confirmed</h2>
              <p className="mt-2 font-body text-body text-ink/85">The deposit is paid. You will settle the balance with the venue directly, by cash or bank transfer.</p>
              <Link to="/my-bookings" className={`${primary} mt-5`}>View my bookings</Link>
            </div>
          )}

          {status === "pending" && (
            <div className="rounded-card-lg border border-line bg-cream p-6">
              <h2 className="font-display text-h4 font-light text-ink">Waiting for the venue</h2>
              <p className="mt-2 font-body text-small text-taupe">The venue is checking your date. You will get a notification when its quotation arrives.</p>
            </div>
          )}

          {quotation && status === "quoted" && (
            <>
              <QuotationSummary quotation={quotation} />
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={startPayment} disabled={accept.isPending} className={primary}>
                  {accept.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                  Accept and pay deposit
                </button>
                <button type="button" onClick={run(reject, quotation._id)} disabled={reject.isPending} className={outline}>Decline this quote</button>
              </div>
            </>
          )}

          {quotation && status === "accepted" && (
            <>
              <QuotationSummary quotation={quotation} />
              {payment ? (
                <DepositPayment quotation={quotation} payment={payment} onPaid={() => setJustBooked(true)} />
              ) : (
                <button type="button" onClick={startPayment} disabled={accept.isPending} className={primary}>
                  {accept.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                  Pay the deposit
                </button>
              )}
            </>
          )}

          {quotation && status === "quoted" && payment && <DepositPayment quotation={quotation} payment={payment} onPaid={() => setJustBooked(true)} />}

          {status === "declined" && <p className="rounded-card-lg border border-line bg-cream p-6 font-body text-body text-ink">The venue could not take this date. You can send a new request to another venue.</p>}
          {status === "expired" && <p className="rounded-card-lg border border-line bg-cream p-6 font-body text-body text-ink">This request expired. Send a new one from the venue page.</p>}

          <p role="alert" className="min-h-5 font-body text-small text-red-700">{error}</p>

          {["pending", "quoted"].includes(inquiry.status) && !inquiry.booking && (
            <button type="button" onClick={run(cancel, inquiry._id)} disabled={cancel.isPending} className="font-body text-small text-taupe underline underline-offset-4 hover:text-ink">
              Cancel this request
            </button>
          )}
        </div>

        <aside aria-label="Your request" className="self-start rounded-card-lg border border-line bg-cream p-6">
          <p className="font-body text-eyebrow uppercase text-gold-800">Your request</p>
          <dl className="mt-3">
            <Row term="Date">{formatDate(new Date(inquiry.preferredDate))}</Row>
            <Row term="Shift">{inquiry.preferredShift ? shiftLabel(inquiry.preferredShift) : "Flexible"}</Row>
            <Row term="Space">{inquiry.space?.name ?? "Venue to recommend"}</Row>
            <Row term="Guests">{inquiry.numberOfGuests}</Row>
            <Row term="Event">{inquiry.eventType}</Row>
            <Row term="Contact">{inquiry.contactName}{"\n"}{inquiry.phoneNumber}</Row>
            {inquiry.message && <Row term="Notes">{inquiry.message}</Row>}
          </dl>
          <Link to={`/venue/${inquiry.venue?._id}`} className="mt-4 inline-block font-body text-small text-gold-800 underline underline-offset-4">View the venue</Link>
        </aside>
      </div>
    </div>
  );
}
