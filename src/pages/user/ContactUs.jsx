import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, Loader2, Mail, MapPin, Phone } from "lucide-react";
import PageHero from "../../components/ui/PageHero";
import SectionHeading from "../../components/ui/SectionHeading";
import Button from "../../components/ui/Button";
import { errorClass, inputClass, labelClass } from "../../components/ui/formStyles";
import { images } from "../../assets/landing/images";
import { contactDetails } from "../../config/contact";
import useSubmitContact from "../../hooks/useSubmitContact";

const TOPICS = [
  { id: "event", label: "Plan an event" },
  { id: "tour", label: "Book a venue tour" },
  { id: "partner", label: "List my venue" },
  { id: "other", label: "Something else" },
];

const STEPS = [
  "We read your message and note anything specific to your date or guest count.",
  "We reply by email or phone, whichever you gave us.",
  "If it helps, we point you to venues that fit and you can send a request straight from the venue page.",
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v) {
  const e = {};
  if (v.name.trim().length < 2) e.name = "Please tell us your name.";
  if (!v.email.trim() && !v.phone.trim()) e.email = "Add an email or a phone number so we can reply.";
  else if (v.email.trim() && !emailPattern.test(v.email.trim())) e.email = "That email address does not look right.";
  if (v.phone.trim() && v.phone.replace(/\D/g, "").length < 7) e.phone = "Enter a phone number we can call.";
  if (v.message.trim().length < 10) e.message = "Please write at least 10 characters.";
  return e;
}

function Field({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className={errorClass}>
          {error}
        </p>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <li className="flex items-start gap-4">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-800">
        <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
      </span>
      <div>
        <p className="font-body text-eyebrow uppercase text-taupe">{label}</p>
        <div className="mt-1 font-body text-body text-ink">{children}</div>
      </div>
    </li>
  );
}

export default function ContactUs() {
  const [params] = useSearchParams();
  const initialTopic = TOPICS.some((t) => t.id === params.get("topic")) ? params.get("topic") : "event";
  const [topic, setTopic] = useState(initialTopic);
  const [values, setValues] = useState({ name: "", email: "", phone: "", date: "", guests: "", message: "" });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(null);
  const [failed, setFailed] = useState(false);
  const formRef = useRef(null);
  const { mutateAsync: submitContact, isPending } = useSubmitContact();

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const control = (id, key) => ({
    id,
    value: values[key],
    onChange: set(key),
    className: inputClass,
    "aria-invalid": errors[key] ? "true" : undefined,
    "aria-describedby": errors[key] ? `${id}-error` : undefined,
  });

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setFailed(false);
    if (Object.keys(found).length) {
      // Take the visitor to the first problem once the errors are on screen
      window.requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }

    // The contact API stores name, email, phone and a message, so the extra details travel inside the message.
    const label = TOPICS.find((t) => t.id === topic)?.label;
    const extra = [values.date && `Event date: ${values.date}`, values.guests && `Guests: ${values.guests}`].filter(Boolean);
    const message = [`Topic: ${label}`, ...extra, "", values.message.trim()].join("\n").slice(0, 2000);

    try {
      await submitContact({ name: values.name.trim(), email: values.email.trim(), phone: values.phone.trim(), message });
      setSent({ name: values.name.trim().split(" ")[0], via: values.email.trim() || values.phone.trim() });
    } catch {
      setFailed(true);
    }
  };

  const details = [
    contactDetails.email && { icon: Mail, label: "Email", node: <a href={`mailto:${contactDetails.email}`} className="underline underline-offset-4 hover:text-gold-800">{contactDetails.email}</a> },
    contactDetails.phone && { icon: Phone, label: "Phone", node: <a href={`tel:${contactDetails.phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4 hover:text-gold-800">{contactDetails.phone}</a> },
    contactDetails.address && { icon: MapPin, label: "Visit", node: contactDetails.address },
    contactDetails.hours && { icon: Clock, label: "Hours", node: contactDetails.hours },
  ].filter(Boolean);

  return (
    <>
      <PageHero image={images.storyAmbience} eyebrow="Contact" title="Let us plan" accent="your occasion" id="contact-title">
        Tell us what you are planning, or the venue you would like to list, and we will take it from there.
      </PageHero>

      <section aria-label="Get in touch" className="bg-cream py-16 lg:py-[88px]">
        <div className="container-site grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
          {sent ? (
            <div className="self-start rounded-card-xl border border-line bg-white p-8 lg:p-10" role="status">
              <CheckCircle2 aria-hidden="true" className="size-10 text-success" />
              <h2 className="mt-4 font-display text-h2 font-light text-ink">Thank you, {sent.name}</h2>
              <p className="mt-3 max-w-md font-body text-body text-ink/85">
                Your message is with us. We will reply to {sent.via} as soon as we can.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button to="/venues" arrow>
                  Explore venues
                </Button>
                <Button variant="outline-dark" type="button" onClick={() => { setSent(null); setValues({ name: "", email: "", phone: "", date: "", guests: "", message: "" }); }}>
                  Send another message
                </Button>
              </div>
            </div>
          ) : (
            <form ref={formRef} onSubmit={submit} noValidate aria-label="Send us a message" className="rounded-card-xl border border-line bg-white p-6 sm:p-8 lg:p-10">
              <SectionHeading eyebrow="Send a message" title="How can we help?" as="h2" className="[&_h2]:text-h2" />

              <fieldset className="mt-8">
                <legend className={labelClass}>I would like to</legend>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((t) => (
                    <label
                      key={t.id}
                      className={`cursor-pointer rounded-full border px-5 py-2.5 font-body text-small transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
                        topic === t.id ? "border-ink bg-ink text-gold-50" : "border-border-strong bg-paper-white text-ink hover:border-ink"
                      }`}
                    >
                      <input type="radio" name="topic" value={t.id} checked={topic === t.id} onChange={() => setTopic(t.id)} className="sr-only" />
                      {t.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field id="c-name" label="Your name" error={errors.name}>
                  <input {...control("c-name", "name")} autoComplete="name" />
                </Field>
                <Field id="c-email" label="Email" error={errors.email}>
                  <input {...control("c-email", "email")} type="email" autoComplete="email" />
                </Field>
                <Field id="c-phone" label="Phone (optional)" error={errors.phone}>
                  <input {...control("c-phone", "phone")} type="tel" autoComplete="tel" placeholder="98XXXXXXXX" />
                </Field>
                <div className="grid grid-cols-[3fr_2fr] gap-4">
                  <Field id="c-date" label="Event date">
                    <input {...control("c-date", "date")} type="date" min={new Date().toISOString().slice(0, 10)} />
                  </Field>
                  <Field id="c-guests" label="Guests">
                    <input {...control("c-guests", "guests")} type="number" min="1" inputMode="numeric" />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field id="c-message" label="Your message" error={errors.message}>
                    <textarea {...control("c-message", "message")} rows={5} maxLength={1800} placeholder="Tell us about the occasion, the kind of place you imagine, or the venue you would like to list." />
                  </Field>
                </div>
              </div>

              {failed && (
                <p role="alert" className="mt-6 font-body text-small text-red-700">
                  We could not send your message. Please check your connection and try again.
                </p>
              )}

              <Button type="submit" disabled={isPending} className="mt-8" arrow={!isPending}>
                {isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                {isPending ? "Sending" : "Send message"}
              </Button>
            </form>
          )}

          <aside aria-label="Contact details and next steps" className="space-y-10 lg:pt-4">
            {details.length > 0 && (
              <div>
                <h2 className="font-display text-h4 font-light text-ink">Reach us directly</h2>
                <ul className="mt-6 space-y-6">
                  {details.map((d) => (
                    <DetailRow key={d.label} icon={d.icon} label={d.label}>
                      {d.node}
                    </DetailRow>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h2 className="font-display text-h4 font-light text-ink">What happens next</h2>
              <ol className="mt-6 space-y-5">
                {STEPS.map((text, i) => (
                  <li key={text} className="flex gap-4">
                    <span aria-hidden="true" className="font-display text-h3 font-light italic text-gold-700">
                      {i + 1}
                    </span>
                    <p className="font-body text-small text-ink/85">{text}</p>
                  </li>
                ))}
              </ol>
            </div>

            <p className="font-body text-small text-taupe">
              Looking at a specific venue? You can send it a request directly from its page, with your date and guest count.{" "}
              <Link to="/venues" className="text-gold-800 underline underline-offset-4">Browse venues</Link>
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
