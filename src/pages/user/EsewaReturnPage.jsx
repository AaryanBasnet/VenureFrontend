import { useEffect, useRef, useState } from "react";
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
  const [error, setError] = useState("");
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    if (outcome !== "success" || !ready || !data || started.current) return;
    started.current = true; // a refresh must not verify twice
    verify.mutateAsync(data).then(setBooking, (e) => setError(apiError(e)));
  }, [outcome, ready, data, verify]);

  const failed = outcome === "failure" || (outcome === "success" && !data);
  const pending = outcome === "success" && data && !booking && !error;

  return (
    <div className="container-site flex min-h-[70vh] flex-col items-center justify-center pb-24 pt-[calc(var(--spacing-header)+2rem)] text-center">
      {pending && (
        <div role="status">
          <Loader2 aria-hidden="true" className="mx-auto size-10 animate-spin text-gold-800" />
          <h1 className="mt-6 font-display text-h2 font-light text-ink">Confirming your payment</h1>
          <p className="mt-3 font-body text-body text-taupe">Checking with eSewa. Please do not close this page.</p>
        </div>
      )}

      {booking && (
        <div>
          <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-success" />
          <h1 className="mt-6 font-display text-h2 font-light text-ink">Your date is confirmed</h1>
          <p className="mx-auto mt-3 max-w-md font-body text-body text-ink/85">
            The deposit is paid. You will settle the balance with the venue directly, by cash or bank transfer.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button to="/my-bookings" arrow>View my bookings</Button>
            <Button to="/venues" variant="outline-dark">Browse venues</Button>
          </div>
        </div>
      )}

      {(failed || error) && (
        <div>
          <XCircle aria-hidden="true" className="mx-auto size-12 text-red-700" />
          <h1 className="mt-6 font-display text-h2 font-light text-ink">
            {failed ? "The payment was not completed" : "We could not confirm your payment"}
          </h1>
          <p role="alert" className="mx-auto mt-3 max-w-md font-body text-body text-ink/85">
            {failed
              ? "You were not charged for this booking. You can try again from your request whenever you are ready."
              : `${error} If money left your eSewa account, contact us with your eSewa receipt and we will sort it out.`}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button to="/my-inquiries" arrow>Back to my requests</Button>
            <Link to="/contact" className="self-center font-body text-button uppercase text-gold-800 underline underline-offset-4">Contact us</Link>
          </div>
        </div>
      )}
    </div>
  );
}
