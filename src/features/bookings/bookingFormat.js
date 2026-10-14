import { priceFormatter } from "../venues/venueFormat";

export const npr = (n) => `NPR ${priceFormatter.format(Math.round(n || 0))}`;

export const BOOKING_LABELS = {
  pending_deposit: "Awaiting deposit",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const BOOKING_TONES = {
  pending_deposit: "bg-gold-100 text-gold-800",
  confirmed: "bg-success text-white",
  completed: "bg-ink text-gold-50",
  cancelled: "bg-line text-taupe",
};

// Same tiers the backend snapshots on each booking (it falls back to these if none are stored).
const DEFAULT_TIERS = [
  { minDaysBefore: 30, refundPercentage: 100 },
  { minDaysBefore: 15, refundPercentage: 75 },
  { minDaysBefore: 7, refundPercentage: 50 },
  { minDaysBefore: 0, refundPercentage: 0 },
];

// What share of the deposit a customer would get back if they cancelled right now.
export const refundPercentageNow = (booking, now = Date.now()) => {
  const tiers = booking.cancellationPolicy?.length ? booking.cancellationPolicy : DEFAULT_TIERS;
  const days = (new Date(booking.startTime).getTime() - now) / 86400000;
  const tier = [...tiers].sort((a, b) => b.minDaysBefore - a.minDaysBefore).find((t) => days >= t.minDaysBefore);
  return tier ? tier.refundPercentage : 0;
};

export const isUpcoming = (booking) => new Date(booking.startTime).getTime() > Date.now();
