import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Phone } from "lucide-react";
import { toast } from "react-toastify";
import {
  apiError,
  useDeclineInquiry,
  useInquiry,
  useQuotation,
  useWithdrawQuotation,
} from "../../features/inquiry/hooks/useInquiries";
import { useVenueDetails } from "../../hooks/user/useVenueDetails";
import { useVenueSpaces } from "../../features/venues/hooks/useVenueSpaces";
import QuotationSummary from "../../features/inquiry/components/QuotationSummary";
import QuotationBuilder from "../../features/inquiry/components/QuotationBuilder";
import { effectiveStatus, formatDate, shiftLabel } from "../../features/inquiry/inquiryOptions";
import { bsLabel } from "../../features/inquiry/bsCalendar";
import { toWhatsAppNumber } from "../../features/venues/venueFormat";
import { ErrorState, PageHeader, Panel, StatusPill } from "../../components/dashboard/ui";
import { btnDanger, btnOutline, btnPrimary } from "../../components/dashboard/styles";

const chip =
  "inline-flex items-center gap-1.5 rounded-full border border-ink px-4 py-2 font-body text-small text-ink transition-colors hover:bg-ink hover:text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const backLink =
  "mb-4 inline-flex items-center gap-1.5 font-body text-small text-taupe hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function Row({ term, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-3 last:border-0">
      <dt className="shrink-0 font-body text-small text-taupe">{term}</dt>
      <dd className="min-w-0 whitespace-pre-line break-words text-right font-body text-small text-ink">{children}</dd>
    </div>
  );
}

function Notice({ tone = "neutral", icon: Icon, children }) {
  return (
    <p role="status" className={`flex items-start gap-3 rounded-card-md border p-4 font-body text-small text-ink ${tone === "success" ? "border-success/40 bg-white" : "border-line bg-cream"}`}>
      {Icon && <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />}
      <span>{children}</span>
    </p>
  );
}

export default function OwnerInquiryDetailPage() {
  const { id } = useParams();
  const { data: inquiry, isPending, isError, refetch } = useInquiry(id);
  const venueId = inquiry?.venue?._id;
  const { data: venue } = useVenueDetails(venueId);
  const { data: spaces } = useVenueSpaces(venueId);
  const quotationId = inquiry?.currentQuotation?._id ?? inquiry?.currentQuotation;
  const { data: quotation } = useQuotation(quotationId);

  const decline = useDeclineInquiry();
  const withdraw = useWithdrawQuotation();
  const [error, setError] = useState("");
  const [sentNotice, setSentNotice] = useState(false);
  const [confirm, setConfirm] = useState(null); // "decline" | "withdraw"

  if (isPending) {
    return (
      <div role="status" aria-label="Loading" className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-card-sm bg-gold-100" />
        <div className="h-72 animate-pulse rounded-card-lg bg-gold-100" />
      </div>
    );
  }
  if (isError || !inquiry) {
    return (
      <>
        <Link to="/owner/inquiries" className={backLink}><ArrowLeft aria-hidden="true" className="size-4" /> Inquiries</Link>
        <Panel>
          <ErrorState onRetry={refetch}>This inquiry could not be found or loaded.</ErrorState>
        </Panel>
      </>
    );
  }

  const status = effectiveStatus(inquiry);
  const canQuote = ["pending", "quoted"].includes(inquiry.status) && !inquiry.booking;
  const phone = (inquiry.phoneNumber ?? "").replace(/[^\d+]/g, "");

  const run = async (mutation, arg, success) => {
    setError("");
    try {
      await mutation.mutateAsync(arg);
      setConfirm(null);
      toast.success(success);
    } catch (e) {
      setError(apiError(e));
    }
  };

  return (
    <>
      <Link to="/owner/inquiries" className={backLink}><ArrowLeft aria-hidden="true" className="size-4" /> Inquiries</Link>
      <PageHeader
        eyebrow={inquiry.venue?.venueName}
        title={inquiry.customer?.name ?? inquiry.contactName}
        actions={<StatusPill status={status} />}
      />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Panel title="Request details" className="self-start">
          <dl className="-my-3">
            <Row term="Date">
              {formatDate(new Date(inquiry.preferredDate))}
              <span className="block text-caption text-taupe-light">{bsLabel(inquiry.preferredDate)}</span>
            </Row>
            <Row term="Shift">{inquiry.preferredShift ? shiftLabel(inquiry.preferredShift) : "Flexible"}</Row>
            <Row term="Space">{inquiry.space?.name ?? "Not chosen, you recommend"}</Row>
            <Row term="Guests">{inquiry.numberOfGuests}</Row>
            <Row term="Event">{inquiry.eventType}</Row>
            <Row term="Contact">{inquiry.contactName}{"\n"}{inquiry.phoneNumber}</Row>
            {inquiry.message && <Row term="Notes">{inquiry.message}</Row>}
          </dl>
          {phone && (
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={`tel:${phone}`} className={chip}><Phone aria-hidden="true" className="size-3.5" /> Call</a>
              <a href={`https://wa.me/${toWhatsAppNumber(inquiry.phoneNumber)}`} target="_blank" rel="noopener noreferrer" className={chip}>WhatsApp</a>
            </div>
          )}
        </Panel>

        <div className="min-w-0 space-y-6">
          {sentNotice && <Notice tone="success" icon={CheckCircle2}>Quotation sent. The customer has been notified.</Notice>}

          {quotation && ["sent", "accepted"].includes(quotation.status) && <QuotationSummary quotation={quotation} />}
          {status === "accepted" && <Notice>The customer accepted this quotation. Their date is confirmed once the deposit is paid.</Notice>}
          {status === "booked" && <Notice tone="success" icon={CheckCircle2}>Booked and the deposit is paid. Manage it under <Link to="/owner/bookings" className="underline underline-offset-4">Bookings</Link>.</Notice>}

          {canQuote && venue && spaces && (
            <QuotationBuilder key={quotationId ?? "new"} inquiry={inquiry} venue={venue} spaces={spaces} onSent={() => setSentNotice(true)} />
          )}
          {canQuote && (!venue || !spaces) && <div role="status" aria-label="Loading" className="h-64 animate-pulse rounded-card-lg bg-gold-100" />}

          {error && <p role="alert" className="rounded-card-md border border-red-300 bg-red-50 p-3 font-body text-small text-red-700">{error}</p>}

          {(quotation?.status === "sent" || canQuote) && (
            <div className="flex flex-wrap gap-3">
              {quotation?.status === "sent" && (
                <button type="button" onClick={() => setConfirm(confirm === "withdraw" ? null : "withdraw")} aria-expanded={confirm === "withdraw"} className={btnOutline}>
                  Withdraw this quotation
                </button>
              )}
              {canQuote && (
                <button type="button" onClick={() => setConfirm(confirm === "decline" ? null : "decline")} aria-expanded={confirm === "decline"} className={btnDanger}>
                  Decline this request
                </button>
              )}
            </div>
          )}

          {confirm === "withdraw" && quotation && (
            <div role="alertdialog" aria-label="Confirm withdrawing the quotation" className="rounded-card-md border border-line bg-sand p-5 font-body text-small text-ink">
              <p>Withdraw this quotation? The customer can no longer accept it, but you can send a new one.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" disabled={withdraw.isPending} onClick={() => run(withdraw, quotation._id, "Quotation withdrawn")} className={btnPrimary}>Yes, withdraw it</button>
                <button type="button" onClick={() => setConfirm(null)} className={btnOutline}>Keep it</button>
              </div>
            </div>
          )}
          {confirm === "decline" && (
            <div role="alertdialog" aria-label="Confirm declining the request" className="rounded-card-md border border-red-300 bg-red-50 p-5 font-body text-small text-ink">
              <p>Decline this request? The customer is told you cannot host this date. This cannot be undone.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" disabled={decline.isPending} onClick={() => run(decline, inquiry._id, "Request declined")} className={btnDanger}>Yes, decline</button>
                <button type="button" onClick={() => setConfirm(null)} className={btnOutline}>No, keep it</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
