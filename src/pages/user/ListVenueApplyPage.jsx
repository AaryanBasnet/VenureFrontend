import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, CheckCircle2, FileText, ImagePlus, LocateFixed, MapPin, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import Select from "../../components/ui/Select";
import { inputClass, labelClass, errorClass } from "../../components/ui/formStyles";
import { submitVenueApplicationApi } from "../../api/venueApplications";
import { coordsFromLink, isMapsLink } from "../../features/listVenue/mapLink";

// "Apply to list your venue": a six-step application. There is no account yet; the owner gets one when we approve it.
// The map is a plain Google Maps embed (no API key, no billing).

const CATEGORIES = [
  ["banquet-party-palace", "Banquet hall and party palace"],
  ["hotel-resort", "Hotel and resort"],
  ["heritage-traditional", "Heritage and traditional"],
];
const PROVINCES = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"];
const STEPS = ["Your venue", "Location", "Your halls", "Photos", "Documents", "Review"];
const MAX_HALLS = 6;
const MAX_MB = 5;
const DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const field = `${inputClass} bg-white`;
const card = "rounded-card-lg border border-line bg-white p-5 sm:p-6";
const newHall = () => ({ id: Math.random().toString(36).slice(2), name: "", capacity: "" });

const formatSize = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function Field({ id, label, hint, error, children, optional }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
        {optional && <span className="ml-2 normal-case tracking-normal text-taupe/80">optional</span>}
      </label>
      {children}
      {error ? <p id={`${id}-error`} role="alert" className={errorClass}>{error}</p> : hint && <p id={`${id}-hint`} className="mt-1.5 font-body text-caption text-taupe">{hint}</p>}
    </div>
  );
}

function FilePick({ id, label, hint, accept, types, file, onFile, error, required }) {
  const [problem, setProblem] = useState("");
  const input = useRef(null);
  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!types.includes(f.type)) return setProblem(`${f.name} is not a PDF, JPG or PNG file.`);
    if (f.size > MAX_MB * 1048576) return setProblem(`${f.name} is larger than ${MAX_MB} MB.`);
    setProblem("");
    onFile(f);
  };
  return (
    <div className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p id={`${id}-label`} className="font-display text-h5 text-ink">
            {label} {required ? <span className="font-body text-caption text-taupe">required</span> : <span className="font-body text-caption text-taupe">optional</span>}
          </p>
          <p id={`${id}-hint`} className="mt-1 max-w-md font-body text-small text-taupe">{hint}</p>
        </div>
        {file ? (
          <span className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-line bg-cream px-4 font-body text-small text-ink">
            <FileText aria-hidden="true" className="size-4 shrink-0 text-gold-800" />
            <span className="truncate">{file.name}</span>
            <span className="shrink-0 text-caption text-taupe">{formatSize(file.size)}</span>
            <button type="button" onClick={() => onFile(null)} aria-label={`Remove ${file.name}`} className="-mr-2 rounded-full p-2 text-taupe hover:text-ink"><X aria-hidden="true" className="size-4" /></button>
          </span>
        ) : (
          <>
            <input ref={input} id={id} type="file" accept={accept} onChange={pick} aria-labelledby={`${id}-label`} aria-describedby={`${id}-hint`} className="sr-only" />
            <button type="button" onClick={() => input.current?.click()} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink px-5 font-body text-button uppercase text-ink hover:bg-ink hover:text-gold-50">
              <FileText aria-hidden="true" className="size-4" /> Choose a file
            </button>
          </>
        )}
      </div>
      {(problem || error) && <p role="alert" className={errorClass}>{problem || error}</p>}
    </div>
  );
}

export default function ListVenueApplyPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState("");
  const sendingRef = useRef(false);
  const [attempted, setAttempted] = useState({});
  const [f, setF] = useState({
    name: "", category: "", about: "", phone: "", ownerName: "", email: "",
    province: "", city: "", area: "", mapLink: "", coords: null,
    agree: false, pan: "",
  });
  const [halls, setHalls] = useState([newHall()]);
  const [photos, setPhotos] = useState([]);
  const [docs, setDocs] = useState({ registration: null, panCert: null });
  const [geoMsg, setGeoMsg] = useState("");
  const topRef = useRef(null);
  const photoInput = useRef(null);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e }));

  const linkCoords = useMemo(() => (isMapsLink(f.mapLink) ? coordsFromLink(f.mapLink) : null), [f.mapLink]);
  const pin = f.coords || linkCoords;
  const addressQuery = [f.area, f.city, f.province && `${f.province} Province`, "Nepal"].filter(Boolean).join(", ");
  const mapQuery = pin ? `${pin.lat},${pin.lng}` : f.area || f.city ? addressQuery : "Kathmandu, Nepal";
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=${pin || f.area ? 16 : f.city ? 13 : 11}&output=embed`;
  const findOnMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressQuery || "Nepal")}`;

  // Previews are blob: addresses of image files only. Nothing typed by the person (such as a file name) is used as markup or as an address.
  const previews = useMemo(
    () => photos.filter((file) => PHOTO_TYPES.includes(file.type)).map((file) => ({ file, url: URL.createObjectURL(file) })).filter((p) => p.url.startsWith("blob:")),
    [photos]
  );
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  const errors = useMemo(() => {
    const e = {};
    if (f.name.trim().length < 2) e.name = "Enter the name customers will see.";
    if (!f.category) e.category = "Choose the kind of venue it is.";
    const phoneDigits = f.phone.replace(/\D/g, "").replace(/^977/, "");
    if (phoneDigits.length < 7 || phoneDigits.length > 10) e.phone = "Enter a phone number the venue answers, like 98XXXXXXXX.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Enter an email address you check. We send updates there.";
    if (f.ownerName.trim().length < 2) e.ownerName = "Enter the name of the person we can ask about this venue.";
    if (!f.province) e.province = "Choose the province.";
    if (!f.city.trim()) e.city = "Enter the city or municipality.";
    if (f.area.trim().length < 3) e.area = "Enter the street, tole or a landmark nearby.";
    if (f.mapLink && !isMapsLink(f.mapLink)) e.mapLink = "That does not look like a Google Maps link.";
    const filled = halls.filter((h) => h.name.trim() || h.capacity);
    if (!filled.length) e.halls = "Add at least one hall.";
    halls.forEach((h, i) => {
      if (h.name.trim() || h.capacity || halls.length === 1) {
        if (!h.name.trim()) e[`hall-${i}-name`] = "Name this hall.";
        if (!(Number(h.capacity) >= 1)) e[`hall-${i}-capacity`] = "How many guests fit?";
      }
    });
    if (photos.length < 3) e.photos = "Add at least 3 photos so customers can see the place.";
    if (!docs.registration) e.registration = "Upload your business registration certificate.";
    if (!docs.panCert) e.panCert = "Upload your PAN certificate.";
    if (!f.pan.trim()) e.pan = "Enter your PAN number.";
    else if (!/^\d{9}$/.test(f.pan.trim())) e.pan = "A PAN number has 9 digits.";
    if (!f.agree) e.agree = "Tick the box to confirm before you send.";
    return e;
  }, [f, halls, photos, docs]);

  const stepKeys = [
    ["name", "category", "email", "phone", "ownerName"],
    ["province", "city", "area", "mapLink"],
    ["halls", ...halls.flatMap((_, i) => [`hall-${i}-name`, `hall-${i}-capacity`])],
    ["photos"],
    ["registration", "panCert", "pan"],
    ["agree"],
  ];
  const stepErrors = (i) => stepKeys[i].filter((k) => errors[k]);
  const stepDone = (i) => stepErrors(i).length === 0;
  const show = (k) => (attempted[stepKeys.findIndex((s) => s.includes(k))] ? errors[k] : undefined);

  // A new step scrolls back up to the progress row and moves keyboard focus to its heading (not on first load).
  const navRef = useRef(null);
  const shownKey = useRef(`${step}-${submitted}`);
  useEffect(() => {
    if (shownKey.current === `${step}-${submitted}`) return;
    shownKey.current = `${step}-${submitted}`;
    (navRef.current ?? topRef.current)?.scrollIntoView({ block: "start", behavior: "instant" });
    topRef.current?.focus({ preventScroll: true });
  }, [step, submitted]);

  const next = () => {
    setAttempted((a) => ({ ...a, [step]: true }));
    const bad = stepErrors(step);
    if (bad.length) {
      requestAnimationFrame(() => document.querySelector(`[aria-invalid="true"], [role="alert"]`)?.scrollIntoView({ block: "center" }));
      return;
    }
    if (step === STEPS.length - 1) return send();
    setStep(step + 1);
  };

  const send = async () => {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    setServerError("");
    const form = new FormData();
    const text = { venueName: f.name.trim(), venueType: f.category, about: f.about.trim(), email: f.email.trim(), phone: f.phone.trim(), contactName: f.ownerName.trim(), province: f.province, city: f.city.trim(), area: f.area.trim(), mapLink: f.mapLink.trim(), panNumber: f.pan.trim() };
    Object.entries(text).forEach(([k, v]) => form.append(k, v));
    if (pin) form.append("coordinates", JSON.stringify(pin));
    form.append("halls", JSON.stringify(halls.filter((h) => h.name.trim()).map((h) => ({ name: h.name.trim(), capacity: Number(h.capacity) }))));
    photos.forEach((file) => form.append("applicationPhotos", file));
    form.append("registrationCert", docs.registration);
    form.append("panCert", docs.panCert);
    try {
      await submitVenueApplicationApi(form);
      setSubmitted(true);
    } catch (err) {
      setServerError(
        err?.response?.data?.message?.replace(/^Validation Error - /, "") ||
          (err?.response ? "We could not send your application. Please try again." : "We could not reach the server. Check your connection and try again.")
      );
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const locate = () => {
    setGeoMsg("");
    if (!navigator.geolocation) return setGeoMsg("This browser cannot share your location. Paste a Google Maps link instead.");
    navigator.geolocation.getCurrentPosition(
      (p) => { setF((s) => ({ ...s, coords: { lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6) } })); setGeoMsg("Pin placed at your current position."); },
      () => setGeoMsg("We could not get your location. Paste a Google Maps link instead."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const addPhotos = (e) => {
    const picked = Array.from(e.target.files ?? []).filter((x) => PHOTO_TYPES.includes(x.type) && x.size <= MAX_MB * 1048576);
    e.target.value = "";
    setPhotos((cur) => [...cur, ...picked.filter((p) => !cur.some((c) => c.name === p.name && c.size === p.size))].slice(0, 12));
  };

  const setHall = (id, k) => (e) => setHalls((hs) => hs.map((h) => (h.id === id ? { ...h, [k]: e.target.value } : h)));

  if (submitted) {
    return (
      <div className="container-site pb-16 pt-8 sm:pt-12">
        <div ref={topRef} tabIndex={-1} className="mx-auto max-w-[720px] outline-none">
          <CheckCircle2 aria-hidden="true" className="size-10 text-success" />
          <h1 className="mt-4 font-display text-h2 font-light text-ink">Thank you. {f.name || "Your venue"} is with our team.</h1>
          <p className="mt-3 font-body text-body text-ink/85">
            We have sent a message to <strong className="font-medium">{f.email || "your email"}</strong> to say your request is being looked at. You do not need an account yet, and nothing is shown to customers.
          </p>
          <ol className="mt-6 space-y-4 font-body text-small text-ink">
            {[
              ["Now", "We read your application and check your registration and PAN documents."],
              ["If we need something", "We write to you at the same email. You do not start again."],
              ["When it is approved", "We email you a link. Open it and choose a password."],
              ["After that", "Sign in with your email and that password, and your venue is live on Venure."],
            ].map(([when, t], i) => (
              <li key={when} className="flex gap-3">
                <span aria-hidden="true" className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-100 text-caption text-gold-800">{i + 1}</span>
                <span><span className="block font-body text-eyebrow uppercase text-gold-800">{when}</span>{t}</span>
              </li>
            ))}
          </ol>
                    <Link to="/list-your-venue" className="mt-6 inline-flex min-h-11 items-center font-body text-button uppercase text-gold-800 underline underline-offset-4">Back to List your venue</Link>
        </div>
      </div>
    );
  }

  const reviewRow = (term, value) => (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="shrink-0 font-body text-small text-taupe">{term}</dt>
      <dd className="min-w-0 break-words text-right font-body text-small text-ink">{value || <span className="text-taupe">Not added</span>}</dd>
    </div>
  );

  return (
    <div className="container-site pb-16 pt-4 sm:pt-6">
      <div className="w-full">
        <Link to="/list-your-venue" className="inline-flex min-h-11 items-center gap-2 font-body text-small text-taupe hover:text-ink"><ArrowLeft aria-hidden="true" className="size-4" /> List your venue</Link>
      </div>
      <div className="mt-1 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
        <nav ref={navRef} aria-label="Application steps" className="scroll-mt-24 lg:sticky lg:top-28 lg:self-start">
          <p className="hidden font-body text-eyebrow uppercase text-gold-800 lg:block">Step {step + 1} of {STEPS.length}</p>
          <ol className="flex items-start lg:mt-3 lg:flex-col lg:gap-1">
            {STEPS.map((t, i) => {
              const reachable = i <= step || STEPS.slice(0, i).every((_, j) => stepDone(j));
              const done = i < step && stepDone(i);
              const last = i === STEPS.length - 1;
              return (
                <li key={t} className={`flex items-start lg:block ${last ? "" : "flex-1 lg:flex-none"}`}>
                  <button
                    type="button"
                    onClick={() => reachable && setStep(i)}
                    disabled={!reachable}
                    aria-current={i === step ? "step" : undefined}
                    className={`flex min-h-11 items-center gap-3 disabled:cursor-not-allowed lg:w-full lg:rounded-card-sm lg:px-3 lg:text-left ${i === step ? "lg:bg-ink lg:text-gold-50" : "text-ink lg:hover:bg-sand lg:disabled:text-taupe lg:disabled:hover:bg-transparent"}`}
                  >
                    <span aria-hidden="true" className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full font-body text-small transition-colors lg:size-6 lg:text-caption ${i === step ? "bg-ink text-gold-50 ring-4 ring-gold-100 lg:bg-gold lg:text-ink lg:ring-0" : done ? "bg-gold-800 text-white" : "border border-border-strong bg-white text-taupe lg:bg-transparent"}`}>
                      {done ? <Check className="size-4 lg:size-3.5" /> : i + 1}
                    </span>
                    <span className="hidden whitespace-nowrap font-body text-small lg:inline">{t}</span>
                    <span className="sr-only">Step {i + 1}: {t}{done ? " (done)" : ""}</span>
                  </button>
                  {!last && <span aria-hidden="true" className={`mx-2 mt-[18px] h-px flex-1 lg:hidden ${done ? "bg-gold-800" : "bg-border-strong"}`} />}
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-center font-body text-small text-ink lg:hidden">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
          <p className="mt-6 hidden font-body text-caption text-taupe lg:block">It takes about 10 minutes. Have your registration and PAN certificates ready.</p>
        </nav>

        <div>
          <div ref={topRef} tabIndex={-1} className="scroll-mt-28 outline-none">
            <h1 className="font-display text-h2 font-light text-ink">{["Tell us about your venue", "Where is it?", "Your halls", "Show it off", "Your business papers", "Check and send"][step]}</h1>
            <p className="mt-2 max-w-xl font-body text-body text-ink/80">
              {[
                "The basics customers see first. You can change all of this later.",
                "Customers find you through the map, so we need the exact place.",
                "Customers book a hall, not a building. Add each hall and how many guests it holds. You set prices when you reply to a request.",
                "Good photos are what makes someone send you a request.",
                "We only list real businesses. Our team reads these and customers never see them.",
                "Read it once more. You can go back to any step.",
              ][step]}
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); next(); }} noValidate className="mt-8 space-y-6">
            {step === 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field id="name" label="Venue name" error={show("name")}>
                    <input id="name" value={f.name} onChange={set("name")} aria-invalid={!!show("name")} aria-describedby={show("name") ? "name-error" : undefined} placeholder="Riverside Garden Hall" className={field} />
                  </Field>
                </div>
                <Field id="category" label="What kind of venue" error={show("category")}>
                  <Select id="category" value={f.category} onChange={set("category")} aria-invalid={!!show("category")} className={field}>
                    <option value="">Choose one</option>
                    {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                </Field>
                <Field id="phone" label="Venue phone" error={show("phone")} hint="Customers are never shown this. Our team may call it.">
                  <input id="phone" type="tel" value={f.phone} onChange={set("phone")} aria-invalid={!!show("phone")} aria-describedby={show("phone") ? "phone-error" : "phone-hint"} placeholder="98XXXXXXXX" className={field} />
                </Field>
                <Field id="email" label="Email" error={show("email")} hint="Your login will use this email. We write to you here when we have news.">
                  <input id="email" type="email" autoComplete="email" value={f.email} onChange={set("email")} aria-invalid={!!show("email")} aria-describedby={show("email") ? "email-error" : "email-hint"} placeholder="you@example.com" className={field} />
                </Field>
                <Field id="ownerName" label="Contact person" error={show("ownerName")} hint="The owner or manager we can ask about this application.">
                  <input id="ownerName" value={f.ownerName} onChange={set("ownerName")} aria-invalid={!!show("ownerName")} aria-describedby={show("ownerName") ? "ownerName-error" : "ownerName-hint"} className={field} />
                </Field>
                <div className="sm:col-span-2">
                  <Field id="about" label="A few words about it" optional hint={`${f.about.length} of 500`}>
                    <textarea id="about" rows={4} maxLength={500} value={f.about} onChange={set("about")} aria-describedby="about-hint" placeholder="A garden by the river with room for 400 guests, a stage and parking for 60 cars." className={field} />
                  </Field>
                </div>
              </div>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="province" label="Province" error={show("province")}>
                    <Select id="province" value={f.province} onChange={set("province")} aria-invalid={!!show("province")} className={field}>
                      <option value="">Choose one</option>
                      {PROVINCES.map((p) => <option key={p}>{p}</option>)}
                    </Select>
                  </Field>
                  <Field id="city" label="City or municipality" error={show("city")}>
                    <input id="city" value={f.city} onChange={set("city")} aria-invalid={!!show("city")} aria-describedby={show("city") ? "city-error" : undefined} placeholder="Bhaktapur" className={field} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field id="area" label="Street, tole or landmark" error={show("area")} hint="Something a driver can find, like “near Suryabinayak chowk”.">
                      <input id="area" value={f.area} onChange={set("area")} aria-invalid={!!show("area")} aria-describedby={show("area") ? "area-error" : "area-hint"} className={field} />
                    </Field>
                  </div>
                </div>

                <div className={card}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-h5 text-ink">Put it on the map</p>
                      <p className="mt-1 max-w-md font-body text-small text-taupe">The map below follows your address. To place the pin exactly, use one of the two options.</p>
                    </div>
                    {pin && <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1 font-body text-caption text-gold-800"><MapPin aria-hidden="true" className="size-3.5" /> Pin set: {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</span>}
                  </div>
                  <div className="mt-4 overflow-hidden rounded-card-md border border-line bg-sand">
                    <iframe title={`Map of ${addressQuery || "Nepal"}`} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-72 w-full border-0 sm:h-80" />
                  </div>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="font-body text-small font-medium text-ink">1. I am at the venue now</p>
                      <p className="mt-1 font-body text-caption text-taupe">Your phone places the pin where you stand.</p>
                      <button type="button" onClick={locate} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-ink px-5 font-body text-button uppercase text-ink hover:bg-ink hover:text-gold-50"><LocateFixed aria-hidden="true" className="size-4" /> Use my location</button>
                      {geoMsg && <p role="status" className="mt-2 font-body text-caption text-ink">{geoMsg}</p>}
                    </div>
                    <div>
                      <p className="font-body text-small font-medium text-ink">2. Paste a Google Maps link</p>
                      <p className="mt-1 font-body text-caption text-taupe">
                        <a href={findOnMaps} target="_blank" rel="noopener noreferrer" className="text-gold-800 underline underline-offset-4">Find your venue on Google Maps<span className="sr-only"> (opens in a new tab)</span></a>, press Share, copy the link and paste it here.
                      </p>
                      <input id="mapLink" aria-label="Google Maps link" value={f.mapLink} onChange={set("mapLink")} aria-invalid={!!show("mapLink")} aria-describedby={show("mapLink") ? "mapLink-error" : undefined} placeholder="https://maps.app.goo.gl/…" className={`${field} mt-3`} />
                      {show("mapLink") && <p id="mapLink-error" role="alert" className={errorClass}>{show("mapLink")}</p>}
                      {f.mapLink && isMapsLink(f.mapLink) && !linkCoords && <p className="mt-1.5 font-body text-caption text-taupe">We saved the link. Short links like this cannot show the pin here, but our team can open it.</p>}
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                {show("halls") && <p role="alert" className={errorClass}>{show("halls")}</p>}
                {halls.map((h, i) => (
                  <fieldset key={h.id} className={card}>
                    <legend className="sr-only">Hall {i + 1}</legend>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display text-h5 text-ink">Hall {i + 1}</p>
                      {halls.length > 1 && (
                        <button type="button" onClick={() => setHalls((hs) => hs.filter((x) => x.id !== h.id))} className="inline-flex min-h-11 items-center gap-1.5 font-body text-small text-taupe hover:text-ink"><Trash2 aria-hidden="true" className="size-4" /> Remove<span className="sr-only"> hall {i + 1}</span></button>
                      )}
                    </div>
                    <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_160px]">
                      <Field id={`hn-${i}`} label="Hall name" error={show(`hall-${i}-name`)}>
                        <input id={`hn-${i}`} value={h.name} onChange={setHall(h.id, "name")} aria-invalid={!!show(`hall-${i}-name`)} aria-describedby={show(`hall-${i}-name`) ? `hn-${i}-error` : undefined} placeholder="Glass Hall" className={field} />
                      </Field>
                      <Field id={`hc-${i}`} label="Guests it holds" error={show(`hall-${i}-capacity`)}>
                        <input id={`hc-${i}`} type="number" inputMode="numeric" min="1" value={h.capacity} onChange={setHall(h.id, "capacity")} aria-invalid={!!show(`hall-${i}-capacity`)} aria-describedby={show(`hall-${i}-capacity`) ? `hc-${i}-error` : undefined} className={field} />
                      </Field>
                    </div>
                  </fieldset>
                ))}
                {halls.length < MAX_HALLS && (
                  <button type="button" onClick={() => setHalls((hs) => [...hs, newHall()])} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink px-5 font-body text-button uppercase text-ink hover:bg-ink hover:text-gold-50"><Plus aria-hidden="true" className="size-4" /> Add another hall</button>
                )}
              </>
            )}

            {step === 3 && (
              <div className={card}>
                <input ref={photoInput} id="photos" type="file" multiple accept={PHOTO_TYPES.join(",")} onChange={addPhotos} aria-label="Add photos" className="sr-only" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-body text-small text-ink">{photos.length} of 12 photos. <span className="text-taupe">JPG, PNG or WebP, up to {MAX_MB} MB each. The first one is the cover.</span></p>
                  <button type="button" onClick={() => photoInput.current?.click()} disabled={photos.length >= 12} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink px-5 font-body text-button uppercase text-ink hover:bg-ink hover:text-gold-50 disabled:opacity-50"><ImagePlus aria-hidden="true" className="size-4" /> Add photos</button>
                </div>
                {previews.length > 0 ? (
                  <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {previews.map((p, i) => (
                      <li key={p.url} className="relative overflow-hidden rounded-card-md border border-line">
                        <img src={p.url} alt={`Photo ${i + 1} of your venue`} className="aspect-[4/3] w-full object-cover" />
                        {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-1 font-body text-caption text-gold-50">Cover</span>}
                        <button type="button" onClick={() => setPhotos((cur) => cur.filter((_, j) => j !== i))} aria-label={`Remove photo ${i + 1}`} className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-full bg-white/95 text-ink shadow hover:bg-white"><X aria-hidden="true" className="size-4" /></button>
                        {i > 0 && <button type="button" onClick={() => setPhotos((cur) => [cur[i], ...cur.filter((_, j) => j !== i)])} className="absolute bottom-2 left-2 rounded-full bg-white/95 px-3 py-1.5 font-body text-caption text-ink shadow hover:bg-white">Make cover<span className="sr-only"> photo {i + 1}</span></button>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <button type="button" onClick={() => photoInput.current?.click()} className="mt-5 flex w-full flex-col items-center gap-2 rounded-card-md border border-dashed border-border-strong bg-cream px-6 py-12 text-center hover:bg-sand">
                    <ImagePlus aria-hidden="true" className="size-8 text-gold-800" />
                    <span className="font-body text-body text-ink">Choose photos of the halls, the grounds and the entrance</span>
                    <span className="font-body text-caption text-taupe">At least 3</span>
                  </button>
                )}
                {show("photos") && <p role="alert" className={errorClass}>{show("photos")}</p>}
              </div>
            )}

            {step === 4 && (
              <>
                <p className="flex items-start gap-3 rounded-card-md border border-line bg-cream p-4 font-body text-small text-ink">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold-800" />
                  Only the Venure team can open these. They are stored privately, never shown on your venue page, and we use them only to check the venue is real.
                </p>
                <FilePick id="d-reg" label="Business registration certificate" hint="The certificate of the company, firm or sole proprietor that runs the venue. A photo or PDF is fine." accept=".pdf,.jpg,.jpeg,.png" types={DOC_TYPES} file={docs.registration} onFile={(x) => setDocs((d) => ({ ...d, registration: x }))} error={show("registration")} required />
                <FilePick id="d-pan" label="PAN certificate" hint="The certificate that shows your PAN number. A photo or PDF is fine." accept=".pdf,.jpg,.jpeg,.png" types={DOC_TYPES} file={docs.panCert} onFile={(x) => setDocs((d) => ({ ...d, panCert: x }))} error={show("panCert")} required />
                <div className={card}>
                  <Field id="pan" label="PAN number" error={show("pan")} hint="The 9 digits on your PAN certificate.">
                    <input id="pan" inputMode="numeric" maxLength={9} value={f.pan} onChange={set("pan")} aria-invalid={!!show("pan")} aria-describedby={show("pan") ? "pan-error" : "pan-hint"} placeholder="9 digits" className={`${field} sm:max-w-xs`} />
                  </Field>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                {[
                  [0, "Your venue", [["Name", f.name], ["Kind", CATEGORIES.find(([v]) => v === f.category)?.[1]], ["Email", f.email], ["Phone", f.phone], ["Contact person", f.ownerName], ["About", f.about]]],
                  [1, "Location", [["Address", [f.area, f.city, f.province].filter(Boolean).join(", ")], ["Map pin", pin ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : f.mapLink ? "Google Maps link saved" : ""]]],
                  [2, "Halls", halls.filter((h) => h.name).map((h) => [h.name, `${h.capacity} guests`])],
                  [3, "Photos", [["Added", `${photos.length} photos`]]],
                  [4, "Documents", [["Registration certificate", docs.registration?.name], ["PAN certificate", docs.panCert?.name], ["PAN number", f.pan]]],
                ].map(([i, title, rows]) => (
                  <section key={title} className={card} aria-label={title}>
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-h5 text-ink">{title}</h2>
                      <button type="button" onClick={() => setStep(i)} className="inline-flex min-h-11 items-center font-body text-small text-gold-800 underline underline-offset-4">Change<span className="sr-only"> {title}</span></button>
                    </div>
                    <dl className="mt-1">{rows.map(([t, v]) => <div key={t}>{reviewRow(t, v)}</div>)}</dl>
                  </section>
                ))}
                <label className="flex min-h-11 cursor-pointer items-start gap-3 font-body text-small text-ink">
                  <input type="checkbox" checked={f.agree} onChange={set("agree")} aria-invalid={!!show("agree")} aria-describedby={show("agree") ? "agree-error" : undefined} className="mt-0.5 size-5 shrink-0 accent-ink" />
                  <span>I confirm this venue is mine to list, and the details and documents are true. I accept the <Link to="/terms" className="underline underline-offset-4">terms of use</Link>.</span>
                </label>
                {show("agree") && <p id="agree-error" role="alert" className={errorClass}>{show("agree")}</p>}
              </>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
              {step > 0 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="inline-flex min-h-11 items-center gap-2 font-body text-button uppercase text-ink"><ArrowLeft aria-hidden="true" className="size-4" /> Back</button>
              ) : <span />}
              <button type="submit" disabled={sending} className="inline-flex disabled:cursor-not-allowed disabled:opacity-60 min-h-11 items-center gap-2 rounded-full border border-gold-800 bg-gold-800 px-8 py-3 font-body text-button uppercase text-white hover:border-gold hover:bg-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
                {step === STEPS.length - 1 ? (sending ? "Sending…" : "Send for review") : "Continue"}
              </button>
            </div>
            {serverError && <p role="alert" className="rounded-card-sm border border-red-700/30 bg-white px-4 py-3 font-body text-small text-red-700">{serverError}</p>}
            {attempted[step] && stepErrors(step).length > 0 && <p role="alert" className="font-body text-small text-red-700">Please fix the {stepErrors(step).length === 1 ? "item" : `${stepErrors(step).length} items`} marked above before you continue.</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
