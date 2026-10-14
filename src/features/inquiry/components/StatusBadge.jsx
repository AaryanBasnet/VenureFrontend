import { effectiveStatus } from "../inquiryOptions";

// One badge for both sides of the flow; the wording differs by who is reading.
const LABELS = {
  customer: {
    pending: "Waiting for the venue",
    quoted: "Quote received",
    accepted: "Accepted, deposit due",
    booked: "Booked",
    declined: "Declined by the venue",
    cancelled: "Cancelled",
    expired: "Expired",
  },
  owner: {
    pending: "New request",
    quoted: "Quote sent",
    accepted: "Accepted, awaiting deposit",
    booked: "Booked",
    declined: "Declined",
    cancelled: "Cancelled by customer",
    expired: "Expired",
  },
};

const TONES = {
  pending: "bg-gold-100 text-gold-800",
  quoted: "bg-gold text-ink",
  accepted: "bg-ink text-gold-50",
  booked: "bg-success text-white",
  declined: "bg-line text-taupe",
  cancelled: "bg-line text-taupe",
  expired: "bg-line text-taupe",
};

export default function StatusBadge({ inquiry, role = "customer" }) {
  const status = effectiveStatus(inquiry);
  return (
    <span className={`inline-block rounded-full px-3 py-1 font-body text-eyebrow uppercase ${TONES[status] ?? TONES.expired}`}>
      {LABELS[role][status] ?? status}
    </span>
  );
}
