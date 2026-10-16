import { Link } from "react-router-dom";
import { Camera, Phone, Ruler, Utensils } from "lucide-react";
import PageHero from "../../components/ui/PageHero";
import SectionHeading from "../../components/ui/SectionHeading";
import Button from "../../components/ui/Button";
import ResponsiveImage from "../../components/ui/ResponsiveImage";
import { images } from "../../assets/landing/images";
import FaqList from "../../features/listVenue/components/FaqList";
import OwnerSignUp from "../../features/listVenue/components/OwnerSignUp";

// Everything on this page describes what the platform does today. No fees, commissions, numbers or
// testimonials are stated: for anything about cost, owners are pointed to the contact page.

const STEPS = [
  { title: "Create an owner account", text: "Sign up below with your name, email and phone number. It takes a minute." },
  { title: "Add your venue", text: "Describe your venue, then add its halls and food packages with photos." },
  { title: "Receive requests", text: "Each request tells you the date, the shift and the number of guests." },
  { title: "Reply with a quotation", text: "Send an itemised quotation. The customer pays the deposit online through eSewa and settles the balance at your venue." },
];

const NEEDS = [
  { icon: Camera, title: "Photos", text: "Clear photos of the venue and each hall. They are the first thing customers look at." },
  { icon: Ruler, title: "Hall capacities", text: "How many guests each hall holds, so requests match the right space." },
  { icon: Utensils, title: "Package prices per plate", text: "Your food packages with the price per plate and the minimum number of plates." },
  { icon: Phone, title: "A contact number", text: "A phone number we and your customers can reach you on." },
];

const FAQ = [
  {
    question: "Who sets the prices?",
    answer: "You do. You enter your food package prices per plate, and you decide what each quotation includes. Venure does not change them.",
  },
  {
    question: "How do I get paid?",
    answer:
      "When a customer accepts your quotation they pay a deposit online through eSewa. They pay the balance to you at the venue. If you want to know how the deposit reaches you, ask us before you list.",
  },
  {
    question: "What happens when a customer cancels?",
    answer: (
      <>
        The customer gets back part of the deposit, depending on how many days are left before the event: all of it with 30 or more days to go, 75% with 15 to 29 days, 50% with 7 to 14 days, and nothing with
        fewer than 7 days. Deposit refunds are paid back manually through eSewa.
      </>
    ),
  },
  {
    question: "Can I list several venues?",
    answer: "Yes. One owner account can hold more than one venue. Add each one from your venues page and it is reviewed on its own.",
  },
  {
    question: "How long does approval take?",
    answer: "Every venue is reviewed by us before it goes live, and we cannot promise a time. You can see the status of each venue on your venues page.",
  },
  {
    question: "What does it cost?",
    answer: (
      <>
        This page does not state any fees. If you want to know about cost, please{" "}
        <Link to="/contact?topic=partner" className="text-ink underline underline-offset-4 hover:text-gold-800">
          ask us about fees
        </Link>{" "}
        and we will answer you directly.
      </>
    ),
  },
];

export default function ListYourVenuePage() {
  return (
    <>
      <PageHero image={images.heritageCourtyards} eyebrow="For venue owners" title="List your venue" accent="on Venure" id="list-title">
        Reach people planning weddings, bratabandhas and celebrations across Nepal, and turn the phone calls into clear requests.
      </PageHero>

      <section aria-labelledby="why-title" className="bg-cream py-16 lg:py-[88px]">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading id="why-title" eyebrow="What Venure is for owners" title="Requests that arrive" accent="with the details" className="[&_h2]:text-h2" />
            <div className="mt-8 space-y-5 font-body text-body-lg font-light text-ink/85">
              <p>
                Venure is a place where people find event venues across Nepal. Your venue gets its own page with its halls, capacity, photos and food packages, so customers see what you offer before they ask.
              </p>
              <p>
                Instead of a round of calls, you receive a request with the date, the shift and the number of guests. You reply with a quotation, and a deposit holds the date.
              </p>
            </div>
            <Button href="#create-account" arrow className="mt-10">
              Create an owner account
            </Button>
          </div>
          <ResponsiveImage
            image={images.storyAmbience}
            alt="A candlelit dining table inside a heritage venue"
            sizes="(min-width: 1024px) 560px, 100vw"
            className="aspect-[4/3] w-full rounded-card-xl object-cover lg:aspect-[4/5]"
          />
        </div>
      </section>

      <section aria-labelledby="how-title" className="bg-sand py-16 lg:py-[88px]">
        <div className="container-site">
          <SectionHeading id="how-title" eyebrow="How it works" title="From sign-up" accent="to your first request" className="[&_h2]:text-h2" />
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-card-lg border border-line bg-cream p-7">
                <span aria-hidden="true" className="font-display text-h3 font-light text-gold-800">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-display text-h5 font-light text-ink">
                  <span className="sr-only">Step {index + 1}: </span>
                  {step.title}
                </h3>
                <p className="mt-3 font-body text-body text-gold-800">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-2xl font-body text-body text-ink/85">
            Every venue is reviewed by us before it goes live, so customers can trust what they see.
          </p>
        </div>
      </section>

      <section aria-labelledby="need-title" className="bg-cream py-16 lg:py-[88px]">
        <div className="container-site">
          <SectionHeading id="need-title" eyebrow="Before you start" title="What to have" accent="ready" className="[&_h2]:text-h2" />
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
            {NEEDS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex flex-col gap-3 rounded-card-lg border border-line bg-sand p-7">
                <Icon aria-hidden="true" className="size-6 text-gold-800" strokeWidth={1.5} />
                <h3 className="font-display text-h5 font-light text-ink">{title}</h3>
                <p className="font-body text-body text-gold-800">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="create-account" aria-labelledby="signup-title" className="scroll-mt-24 bg-sand py-16 lg:py-[88px]">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-20">
          <div>
            <SectionHeading id="signup-title" eyebrow="Get started" title="Create a venue" accent="owner account" className="[&_h2]:text-h2" />
            <p className="mt-6 max-w-md font-body text-body-lg font-light text-ink/85">
              After you sign up you land on your venues page, where you add your first venue. It goes live once we have reviewed it.
            </p>
          </div>
          <div className="rounded-card-xl border border-line bg-cream p-6 sm:p-9">
            <OwnerSignUp />
          </div>
        </div>
      </section>

      <section aria-labelledby="faq-title" className="bg-cream py-16 lg:py-[88px]">
        <div className="container-site grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <div>
            <SectionHeading id="faq-title" eyebrow="Questions" title="Good to know" accent="before you list" className="[&_h2]:text-h2" />
            <p className="mt-6 max-w-sm font-body text-body text-gold-800">
              Something else on your mind?{" "}
              <Link to="/contact?topic=partner" className="text-ink underline underline-offset-4 hover:text-gold-800">
                Write to us
              </Link>
              .
            </p>
          </div>
          <FaqList items={FAQ} />
        </div>
      </section>
    </>
  );
}
