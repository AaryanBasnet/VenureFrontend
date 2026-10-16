import { Link } from "react-router-dom";
import LegalDocument, { LegalSection } from "../../components/ui/LegalDocument";

export default function PrivacyPage() {
  return (
    <LegalDocument title="Privacy" intro="This page explains what Venure collects, why, and who can see it.">
      <LegalSection title="What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>Your name, email address and phone number when you create an account or send a request.</li>
          <li>Event details you enter: date, shift, number of guests, event type and notes.</li>
          <li>Messages you send to venue owners or to us.</li>
          <li>The status of your payments (for example, deposit paid), and the booking it belongs to.</li>
        </ul>
        <p>Payments are processed by eSewa. Venure never sees your eSewa credentials.</p>
      </LegalSection>

      <LegalSection title="Why we use it">
        <p>
          To run your account, pass your request and messages to the venue owner you chose, show you quotations and bookings, and send notices about
          them. We do not sell your data.
        </p>
      </LegalSection>

      <LegalSection title="Who can see it">
        <p>
          The venue owner you contact sees your name, contact details and the event details of your request, so they can reply. Administrators of Venure
          can see accounts and bookings in order to keep the service running.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Venure uses cookies only to keep you signed in. We do not use advertising or tracking cookies. If you block cookies, you will not be able to
          sign in.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can update your profile details on your profile page. To ask us to correct or delete your data, please use the{" "}
          <Link to="/contact" className="text-gold-800 underline underline-offset-4 hover:text-ink">
            contact page
          </Link>
          . Some booking records may need to be kept while a payment or refund is open.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>If this page changes, the date at the top changes with it.</p>
      </LegalSection>
    </LegalDocument>
  );
}
