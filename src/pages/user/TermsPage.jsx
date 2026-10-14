import { Link } from "react-router-dom";
import LegalDocument, { LegalSection } from "../../components/ui/LegalDocument";

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of use"
      intro="Venure is a marketplace that connects customers planning an event in Nepal with the owners of event venues. These are the ground rules for using it."
    >
      <LegalSection title="What Venure does">
        <p>
          Venure lets you browse venues, send a request for a date, receive a quotation from the venue owner, and pay a deposit to hold the date. The
          event itself is arranged between you and the venue owner. Venure helps the two of you find each other and keeps the request, the quotation and
          the payment status in one place.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>Give accurate details and keep your password to yourself. You are responsible for what happens under your account.</p>
      </LegalSection>

      <LegalSection title="How pricing works">
        <p>
          Venues are priced per plate (per guest) or by shift, never per hour. The venue owner sends a quotation that shows every line item, the total,
          the deposit due now and the balance due later. A quotation stays open for 7 days.
        </p>
      </LegalSection>

      <LegalSection title="Deposits and payments">
        <p>
          You pay the deposit online through eSewa. Venure never sees your eSewa credentials. The remaining balance is paid to the venue owner directly,
          and the owner records it on Venure.
        </p>
      </LegalSection>

      <LegalSection title="Cancellations and refunds">
        <p>If you cancel a booking, the share of the deposit you get back depends on how many days remain before the event:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>30 or more days before: 100% of the deposit</li>
          <li>15 to 29 days before: 75%</li>
          <li>7 to 14 days before: 50%</li>
          <li>Less than 7 days before: 0%</li>
        </ul>
        <p>Refunds are paid back manually, so they can take some time to reach you. Each booking page shows the tiers that apply to it.</p>
      </LegalSection>

      <LegalSection title="What venue owners agree to">
        <p>
          Owners keep their listing, spaces, prices and availability accurate, answer requests honestly, honour a quotation they have sent and accepted,
          and provide the venue and services as described.
        </p>
      </LegalSection>

      <LegalSection title="Reviews and messages">
        <p>
          Reviews should come from real events and be fair. Please keep messages polite. We may remove content that is abusive or misleading, and close
          accounts that misuse the service.
        </p>
      </LegalSection>

      <LegalSection title="Limits">
        <p>
          Venure is a student-built project and may change, have errors or be unavailable at times. Venure is not a party to the agreement between a
          customer and a venue owner. For how we handle your data, see the{" "}
          <Link to="/privacy" className="text-gold-800 underline underline-offset-4 hover:text-ink">
            privacy page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
