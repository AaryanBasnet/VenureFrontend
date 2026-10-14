import { CalendarCheck, FileText, MessageSquareText, Search, ShieldCheck, Sunset, Utensils } from "lucide-react";
import PageHero from "../../components/ui/PageHero";
import ResponsiveImage from "../../components/ui/ResponsiveImage";
import SectionHeading from "../../components/ui/SectionHeading";
import Button from "../../components/ui/Button";
import VenueTypesSection from "../../features/landing/sections/VenueTypesSection";
import PartnerCtaSection from "../../features/landing/sections/PartnerCtaSection";
import { images } from "../../assets/landing/images";

// Every statement here describes what the platform actually does today.
const STEPS = [
  { icon: Search, title: "Browse venues", text: "See each venue's halls, capacity, photos and food packages on one page." },
  { icon: MessageSquareText, title: "Send one request", text: "Choose your date, shift and guest count. One request replaces the round of phone calls." },
  { icon: FileText, title: "Receive a clear quote", text: "The venue replies with an itemised quotation: what is included, the total, and the deposit." },
  { icon: CalendarCheck, title: "Hold your date", text: "Pay the deposit to confirm. You settle the balance with the venue directly." },
];

const PRINCIPLES = [
  { icon: Utensils, title: "Priced per plate", text: "Packages show the price per plate and the minimum plates, the way venues in Nepal quote." },
  { icon: Sunset, title: "Day, night or full day", text: "Ask for a day or night shift, or the whole day, in the hall that fits your guest count." },
  { icon: ShieldCheck, title: "Reviewed venues", text: "Venues are reviewed before they are listed, and only guests who completed a booking can review one." },
];

export default function AboutUs() {
  return (
    <>
      <PageHero image={images.storyNewariCourtyard} eyebrow="About Venure" title="Heritage venues," accent="made simple" id="about-title">
        A place to find and book event venues across Nepal, from valley courtyards to mountain retreats.
      </PageHero>

      <section aria-labelledby="story-title" className="bg-cream py-16 lg:py-[88px]">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading id="story-title" eyebrow="Our story" title="Finding the right place" accent="should feel like a celebration" className="[&_h2]:text-h2" />
            <div className="mt-8 space-y-5 font-body text-body-lg font-light text-ink/85">
              <p>
                Planning a wedding, a bratabandha or a birthday usually means calling venue after venue, comparing menus over the phone, and waiting on quotations.
                Venure puts a venue, its halls, capacity and food packages on one page, and turns the back and forth into a single request.
              </p>
              <p>
                You tell the venue your date, shift and guest count. It replies with an itemised quotation, and a deposit holds your date. The people who run the venue
                stay in charge of the details, and you always see what you are agreeing to.
              </p>
            </div>
            <Button to="/venues" arrow className="mt-10">
              Explore venues
            </Button>
          </div>
          <ResponsiveImage
            image={images.storyWedding}
            alt="A wedding celebration at a heritage venue"
            sizes="(min-width: 1024px) 560px, 100vw"
            className="aspect-[4/5] w-full rounded-card-xl object-cover"
          />
        </div>
      </section>

      <section aria-labelledby="how-title" className="bg-sand py-16 lg:py-[88px]">
        <div className="container-site">
          <SectionHeading id="how-title" eyebrow="How it works" title="From first look" accent="to a held date" className="[&_h2]:text-h2" />
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="rounded-card-lg border border-line bg-cream p-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-full bg-gold-100 text-gold-800">
                    <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
                  </span>
                  <span aria-hidden="true" className="font-display text-h3 font-light italic text-gold-700">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-h4 font-light text-ink">{title}</h3>
                <p className="mt-2 font-body text-small text-ink/80">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="principles-title" className="bg-cream py-16 lg:py-[88px]">
        <div className="container-site">
          <SectionHeading id="principles-title" eyebrow="Built for Nepal" title="Details that match" accent="how events are booked here" className="[&_h2]:text-h2" />
          <ul className="mt-12 grid gap-10 md:grid-cols-3">
            {PRINCIPLES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="border-t border-line pt-6">
                <Icon aria-hidden="true" className="size-7 text-gold-800" strokeWidth={1.25} />
                <h3 className="mt-5 font-display text-h4 font-light text-ink">{title}</h3>
                <p className="mt-2 font-body text-body text-ink/80">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <VenueTypesSection />
      <PartnerCtaSection />
    </>
  );
}
