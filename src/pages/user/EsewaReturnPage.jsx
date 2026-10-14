import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { apiError, useRequireLogin, useVerifyEsewaPayment } from "../../features/inquiry/hooks/useInquiries";
import Button from "../../components/ui/Button";

// Where eSewa sends the customer back. "success" carries a signed ?data=; the server checks it
// with eSewa and creates the booking. "failure" means the customer cancelled or the payment failed.
export default function EsewaReturnPage({ outcome }) {
  const [params] = useSearchParams();
  const { ready } = useRequireLogin();
  const verify = useVerifyEsewaPayment();
  const data = params.get("data");
  const started = useRef(false);
  const headingRef = useRef(null);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);

  const run = useCallback(() => {
    setError("");
    verify.mutateAsync(data).then(setBooking, (e) => setError(apiError(e)));
  }, [verify, data]);

  useEffect(() => {
    if (outcome !== "success" || !ready || !data || started.current) return;
    started.current = true; // a refresh must not verify twice
    run();
  }, [outcome, ready, data, run]);

  const failed = outcome === "failure";
  const noData = outcome === "success" && !data;
  const pending = outcome === "success" && !!data && !booking && !error;

  // Tell screen-reader and keyboard users when the result arrives.
  useEffect(() => {
    if (!pending) headingRef.current?.focus();
  }, [pending, booking, error]);

  const heading = "mt-6 font-display text-h2 font-light text-ink outline-none";

  return (
    <div className="container-site flex min-h-[70vh] flex-col items-center justify-center pb-24 pt-[calc(var(--spacing-header)+2rem)] text-center">
      {pending && (
        <div role="status">
          <Loader2 aria-hidden="true" className="mx-auto size-10 animate-spin text-gold-800" />
          <h1 className={heading}>Confirming your payment</h1>
          <p className="mt-3 font-body text-body text-taupe">Checking with eSewa. This takes a few seconds. Please do not close this page.</p>
        </div>
      )}

      {booking && (
        <div>
          <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-success" />
          <h1 ref={headingRef} tabIndex={-1} className={heading}>Your date is confirmed</h1>
          <p className="mx-auto mt-3 max-w-md font-body text-body text-ink/85">
            The deposit is paid and the date is yours. You will settle the balance with the venue directly, by cash or bank transfer.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button to="/my-bookings" arrow>View my bookings</Button>
            <Button to="/venues" variant="outline-dark">Browse venues</Button>
          </div>
        </div>
      )}

      {(failed || noData) && (
        <div>
          <XCircle aria-hidden="true" className="mx-auto size-12 text-red-700" />
          <h1 ref={headingRef} tabIndex={-1} className={heading}>
            {failed ? "The payment was not completed" : "We did not get a payment result"}
          </h1>
          <p role="alert" className="mx-auto mt-3 max-w-md font-body text-body text-ink/85">
            {failed
              ? "You cancelled on eSewa or the payment did not go through, so no deposit was taken for this request. Open your request and choose Pay the deposit whenever you are ready."
              : "This page opens after you pay on eSewa, but no payment details came with it. If you did pay, check My bookings in a minute, or contact us with your eSewa receipt."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button to="/my-inquiries" arrow>Open my requests</Button>
            <Link to="/contact" className="inline-flex min-h-11 items-center font-body text-button uppercase text-gold-800 underline underline-offset-4">Contact us</Link>
          </div>
        </div>
      )}

      {error && (
        <div>
          <XCircle aria-hidden="true" className="mx-auto size-12 text-red-700" />
          <h1 ref={headingRef} tabIndex={-1} className={heading}>We could not confirm your payment</h1>
          <p role="alert" className="mx-auto mt-3 max-w-md font-body text-body text-ink/85">
            {error} If money left your eSewa account, do not pay again. Check My bookings first, then contact us with your eSewa receipt and we will sort it out.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button to="/my-bookings" arrow>Check my bookings</Button>
            <button type="button" onClick={run} disabled={verify.isPending} className="inline-flex min-h-11 items-center gap-2 font-body text-button uppercase text-gold-800 underline underline-offset-4 disabled:opacity-60">
              {verify.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              Check again
            </button>
            <Link to="/contact" className="inline-flex min-h-11 items-center font-body text-button uppercase text-gold-800 underline underline-offset-4">Contact us</Link>
          </div>
        </div>
      )}
    </div>
  );
}
