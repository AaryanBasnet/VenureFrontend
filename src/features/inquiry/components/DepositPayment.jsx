import { useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";
import { apiError, useBookFromQuotation } from "../hooks/useInquiries";
import { priceFormatter } from "../../venues/venueFormat";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function CardForm({ quotation, payment, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const book = useBookFromQuotation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pay = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError("");
    try {
      const result = await stripe.confirmCardPayment(payment.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) throw new Error(result.error.message);
      // The booking is only created after the server has verified this exact payment.
      await book.mutateAsync({ quotationId: quotation._id, paymentIntentId: result.paymentIntent.id });
      onPaid();
    } catch (err) {
      setError(err?.response ? apiError(err) : err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={pay} className="space-y-4">
      <div className="rounded-card-sm border border-border-strong bg-white p-4">
        <CardElement options={{ style: { base: { fontSize: "16px", color: "#1a1208" } }, hidePostalCode: true }} />
      </div>
      <p role="alert" className="min-h-5 font-body text-small text-red-700">{error}</p>
      <button
        type="submit"
        disabled={busy || !stripe}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800 disabled:opacity-60"
      >
        {busy && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        Pay NPR {priceFormatter.format(Math.round(quotation.depositAmount))} deposit
      </button>
    </form>
  );
}

// Card payment for the deposit. Stripe charges in US dollars, converted at the server's rate.
export default function DepositPayment({ quotation, payment, onPaid }) {
  if (payment?.provider !== "stripe" || !payment.clientSecret) {
    return <p className="font-body text-small text-taupe">This payment method is not available yet. Please contact the venue.</p>;
  }
  if (!stripePromise) {
    return <p className="font-body text-small text-taupe">Online payment is not set up in this environment (no Stripe key).</p>;
  }
  return (
    <div className="rounded-card-lg border border-line bg-cream p-6">
      <h3 className="font-display text-h4 font-light text-ink">Pay the deposit</h3>
      <p className="mt-1 mb-4 font-body text-caption text-taupe">
        Your card is charged in US dollars
        {payment.exchangeRateUsed ? ` at about NPR ${payment.exchangeRateUsed} per dollar` : ""}. Your date is confirmed once the payment succeeds.
      </p>
      <Elements stripe={stripePromise}>
        <CardForm quotation={quotation} payment={payment} onPaid={onPaid} />
      </Elements>
    </div>
  );
}
