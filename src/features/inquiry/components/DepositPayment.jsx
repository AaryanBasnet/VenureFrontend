import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { priceFormatter } from "../../venues/venueFormat";

// Deposit payment through eSewa. The server signs the amount; we only post that signed form to eSewa,
// which brings the customer back to /payment/esewa/success after they pay.
export default function DepositPayment({ quotation, payment, focusOnMount = false }) {
  const formRef = useRef(null);
  const headingRef = useRef(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);

  // Coming back with the browser Back button restores this page as it was, with the button stuck on
  // "redirecting". Let the customer try again.
  useEffect(() => {
    const reset = (e) => {
      if (e.persisted) setRedirecting(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  if (payment?.provider !== "esewa" || !payment.formUrl) {
    return (
      <p role="alert" className="rounded-card-lg border border-line bg-cream p-6 font-body text-small text-ink">
        Online payment is not available right now. Your quotation stays accepted, so please contact the venue or try again in a little while.
      </p>
    );
  }

  const goToEsewa = () => {
    setRedirecting(true);
    formRef.current.submit();
  };

  const deposit = `NPR ${priceFormatter.format(Math.round(quotation.depositAmount))}`;
  const balance = `NPR ${priceFormatter.format(Math.round(quotation.balanceAmount))}`;

  return (
    <div className="rounded-card-lg border border-line bg-cream p-6">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-h4 font-light text-ink outline-none">Pay the deposit</h2>
      <p className="mt-2 font-body text-small text-ink/85">
        Pay {deposit} on eSewa to confirm your date. The remaining {balance} is paid to the venue directly, by cash or bank transfer.
      </p>
      <p className="mb-5 mt-2 font-body text-caption text-taupe">
        You will leave Venure to pay on eSewa and come straight back here. If you close eSewa without paying, nothing is charged and you can pay later from this page.
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
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-8 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800 disabled:opacity-60"
      >
        {redirecting && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
        {redirecting ? "Taking you to eSewa" : `Pay ${deposit} with eSewa`}
      </button>
      <p role="status" className="sr-only">{redirecting ? "Taking you to eSewa" : ""}</p>
      <p className="mt-4 flex items-center gap-2 font-body text-caption text-taupe">
        <ShieldCheck aria-hidden="true" className="size-4 shrink-0 text-gold-800" />
        Venure never sees your eSewa login or PIN.
      </p>
    </div>
  );
}
