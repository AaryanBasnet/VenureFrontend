import { useRef, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { priceFormatter } from "../../venues/venueFormat";

// Deposit payment through eSewa. The server signs the amount; we only post that signed form to eSewa,
// which brings the customer back to /payment/esewa/success after they pay.
export default function DepositPayment({ quotation, payment }) {
  const formRef = useRef(null);
  const [redirecting, setRedirecting] = useState(false);

  if (payment?.provider !== "esewa" || !payment.formUrl) {
    return <p className="font-body text-small text-taupe">Online payment is not available right now. Please contact the venue.</p>;
  }

  const goToEsewa = () => {
    setRedirecting(true);
    formRef.current.submit();
  };

  return (
    <div className="rounded-card-lg border border-line bg-cream p-6">
      <h3 className="font-display text-h4 font-light text-ink">Pay the deposit</h3>
      <p className="mt-1 mb-4 font-body text-caption text-taupe">
        You will pay on eSewa and come straight back here. Your date is confirmed as soon as the payment goes through.
      </p>

      <form ref={formRef} action={payment.formUrl} method="POST">
        {Object.entries(payment.formData).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      </form>

      <button
        type="button"
        onClick={goToEsewa}
        disabled={redirecting}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800 disabled:opacity-60"
      >
        {redirecting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        Pay NPR {priceFormatter.format(Math.round(quotation.depositAmount))} with eSewa
      </button>
      <p className="mt-4 flex items-center gap-2 font-body text-caption text-taupe">
        <ShieldCheck aria-hidden="true" className="size-4 text-gold-800" />
        Venure never sees your eSewa login or PIN.
      </p>
    </div>
  );
}
