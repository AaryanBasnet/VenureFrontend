import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Phone } from "lucide-react";
import {
  apiError,
  useDeclineInquiry,
  useInquiry,
  useQuotation,
  useWithdrawQuotation,
} from "../../features/inquiry/hooks/useInquiries";
import { useVenueDetails } from "../../hooks/user/useVenueDetails";
import { useVenueSpaces } from "../../features/venues/hooks/useVenueSpaces";
import StatusBadge from "../../features/inquiry/components/StatusBadge";
import QuotationSummary from "../../features/inquiry/components/QuotationSummary";
import QuotationBuilder from "../../features/inquiry/components/QuotationBuilder";
import { effectiveStatus, formatDate, shiftLabel } from "../../features/inquiry/inquiryOptions";
import { toWhatsAppNumber } from "../../features/venues/venueFormat";

const chip = "inline-flex items-center gap-1.5 rounded-full border border-ink px-4 py-2 font-body text-small text-ink hover:bg-ink hover:text-gold-50";

function Row({ term, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="font-body text-small text-taupe">{term}</dt>
      <dd className="whitespace-pre-line text-right font-body text-small text-ink">{children}</dd>
    </div>
  );
}

export default function OwnerInquiryDetailPage() {
  const { id } = useParams();
  const { data: inquiry, isPending, isError } = useInquiry(id);
  const venueId = inquiry?.venue?._id;
  const { data: venue } = useVenueDetails(venueId);
  const { data: spaces } = useVenueSpaces(venueId);
  const quotationId = inquiry?.currentQuotation?._id ?? inquiry?.currentQuotation;
  const { data: quotation } = useQuotation(quotationId);

  const decline = useDeclineInquiry();
  const withdraw = useWithdrawQuotation();
  const [error, setError] = useState("");
  const [sentNotice, setSentNotice] = useState(false);

  if (isPending) return <div role="status" aria-label="Loading" className="p-8"><div className="h-64 animate-pulse rounded-card-lg bg-gold-100" /></div>;
  if (isError || !inquiry) {
    return (
      <div className="p-8">
        <p className="font-body text-body text-ink">This inquiry could not be found.</p>
        <Link to="/owner/inquiries" className="font-body text-small text-gold-800 underline">Back to inquiries</Link>
      </div>
    );
  }

  const status = effectiveStatus(inquiry);
  const canQuote = ["pending", "quoted"].includes(inquiry.status) && !inquiry.booking;
  const phone = (inquiry.phoneNumber ?? "").replace(/[^\d+]/g, "");
  const run = (mutation, arg) => async () => {
    setError("");
    try {
      await mutation.mutateAsync(arg);
    } catch (e) {
      setError(apiError(e));
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <Link to="/owner/inquiries" className="font-body text-small text-taupe hover:text-ink">← Inquiries</Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-h2 font-light text-ink">{inquiry.customer?.name ?? inquiry.contactName}</h1>
        <StatusBadge inquiry={inquiry} role="owner" />
      </div>
      <p className="font-body text-small text-taupe">{inquiry.venue?.venueName}</p>

      <div className="mt-6 grid gap-8 xl:grid-cols-[360px_1fr]">
        <aside aria-label="Request details" className="self-start rounded-card-lg border border-line bg-cream p-6">
          <dl>
            <Row term="Date">{formatDate(new Date(inquiry.preferredDate))}</Row>
            <Row term="Shift">{inquiry.preferredShift ? shiftLabel(inquiry.preferredShift) : "Flexible"}</Row>
            <Row term="Space">{inquiry.space?.name ?? "Not chosen, you recommend"}</Row>
            <Row term="Guests">{inquiry.numberOfGuests}</Row>
            <Row term="Event">{inquiry.eventType}</Row>
            <Row term="Contact">{inquiry.contactName}{"\n"}{inquiry.phoneNumber}</Row>
            {inquiry.message && <Row term="Notes">{inquiry.message}</Row>}
          </dl>
          {phone && (
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:${phone}`} className={chip}><Phone aria-hidden="true" className="size-3.5" /> Call</a>
              <a href={`https://wa.me/${toWhatsAppNumber(inquiry.phoneNumber)}`} target="_blank" rel="noopener noreferrer" className={chip}>WhatsApp</a>
            </div>
          )}
        </aside>

        <div className="space-y-6">
          {sentNotice && <p role="status" className="rounded-card-md border border-success/40 bg-white p-4 font-body text-small text-ink">Quotation sent. The customer has been notified.</p>}

          {quotation && ["sent", "accepted"].includes(quotation.status) && <QuotationSummary quotation={quotation} />}
          {status === "accepted" && <p className="rounded-card-md border border-line bg-cream p-4 font-body text-small text-ink">The customer accepted this quotation. Their date is confirmed once the deposit is paid.</p>}
          {status === "booked" && <p className="rounded-card-md border border-success/40 bg-white p-4 font-body text-small text-ink">Booked and the deposit is paid. Manage it under Bookings.</p>}

          {canQuote && venue && spaces && (
            <QuotationBuilder key={quotationId ?? "new"} inquiry={inquiry} venue={venue} spaces={spaces} onSent={() => setSentNotice(true)} />
          )}
          {canQuote && (!venue || !spaces) && <div role="status" aria-label="Loading" className="h-40 animate-pulse rounded-card-lg bg-gold-100" />}

          <p role="alert" className="min-h-5 font-body text-small text-red-700">{error}</p>

          <div className="flex flex-wrap gap-4">
            {quotation?.status === "sent" && (
              <button type="button" onClick={run(withdraw, quotation._id)} disabled={withdraw.isPending} className="font-body text-small text-taupe underline underline-offset-4 hover:text-ink">
                Withdraw this quotation
              </button>
            )}
            {canQuote && (
              <button type="button" onClick={run(decline, inquiry._id)} disabled={decline.isPending} className="font-body text-small text-taupe underline underline-offset-4 hover:text-ink">
                Decline this request
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
