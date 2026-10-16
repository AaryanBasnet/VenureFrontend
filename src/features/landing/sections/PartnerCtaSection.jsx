import { Diamond } from "lucide-react";
import SectionHeading from "../../../components/ui/SectionHeading";
import Button from "../../../components/ui/Button";
import { useLanding } from "../hooks/useLanding";

// Figma 46:298 — centered CTA inviting venue owners to apply.
// The button leads to the dedicated owner page, where owners create an account and list a venue.
export default function PartnerCtaSection() {
  const { partnerCta } = useLanding().content;
  return (
    <section aria-labelledby="partner-cta-title" className="border-t border-line bg-cream py-16 lg:py-[74px]">
      <div className="container-site flex max-w-[896px] flex-col items-center text-center">
        <Diamond aria-hidden="true" className="size-7 text-gold" strokeWidth={1.25} />
        <SectionHeading
          id="partner-cta-title"
          eyebrow={partnerCta.eyebrow}
          title={partnerCta.title}
          accent={partnerCta.accent}
          align="center"
          className="pt-6"
        />
        <p className="mt-5 max-w-xl font-body text-body-lg font-light text-gold-800">{partnerCta.description}</p>
        <Button to="/list-your-venue" arrow className="mt-8">
          Apply as a venue partner
        </Button>
      </div>
    </section>
  );
}
