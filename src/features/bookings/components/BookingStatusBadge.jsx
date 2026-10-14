import { BOOKING_LABELS, BOOKING_TONES } from "../bookingFormat";

export default function BookingStatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 font-body text-eyebrow uppercase ${BOOKING_TONES[status] ?? BOOKING_TONES.cancelled}`}>
      {BOOKING_LABELS[status] ?? status}
    </span>
  );
}
