import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useGoToLogin } from "../../auth/returnTo";
import { Check, CheckCircle2, Loader2 } from "lucide-react";
import { AuthContext } from "../../auth/AuthProvider";
import { useVenueDetails } from "../../hooks/user/useVenueDetails";
import { useVenueSpaces } from "../../features/venues/hooks/useVenueSpaces";
import { priceFormatter } from "../../features/venues/venueFormat";
import DatePicker from "../../features/inquiry/components/DatePicker";
import { bsLabel } from "../../features/inquiry/bsCalendar";
import { useAvailability } from "../../features/inquiry/hooks/useAvailability";
import { isDateUnavailable } from "../../features/inquiry/availability";
import { inquiryErrorMessage, useCreateInquiry } from "../../features/inquiry/hooks/useCreateInquiry";
import { useMyInquiries } from "../../features/inquiry/hooks/useInquiries";
import { EVENT_TYPES, SHIFT_OPTIONS, formatDate, formatHours, serverDay, shiftLabel, toInquiryDate } from "../../features/inquiry/inquiryOptions";
import Select from "../../components/ui/Select";
import { AttachmentPicker } from "../../features/inquiry/components/Attachments";
import { uploadInquiryAttachmentsApi } from "../../api/user/inquiry";
import { plural } from "../../utils/plural";

const field =
  "w-full rounded-card-sm border border-border-strong bg-white px-4 py-3 font-body text-body text-ink placeholder:text-taupe focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink aria-[invalid=true]:border-red-700";
const label = "mb-1.5 block font-body text-eyebrow uppercase text-taupe";
const errorText = "mt-1.5 font-body text-small text-red-700";
const choice = (active, disabled) =>
  `block rounded-card-md border p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink ${
    disabled ? "cursor-not-allowed border-line bg-sand opacity-70" : active ? "cursor-pointer border-ink bg-gold-50" : "cursor-pointer border-line bg-white hover:border-border-strong"
  }`;

function Row({ term, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="font-body text-small text-taupe">{term}</dt>
      <dd className="text-right font-body text-small text-ink">{children}</dd>
    </div>
  );
}

const STEPS = ["Date, shift and hall", "Your details"];
const draftKey = (venueId) => `venure:inquiry-draft:${venueId}`;
const pad = (n) => String(n).padStart(2, "0");
const loadDraft = (venueId) => {
  try {
    const d = JSON.parse(sessionStorage.getItem(draftKey(venueId)) || "null");
    if (d?.date) {
      const [y, m, day] = d.date.split("-").map(Number);
      d.date = new Date(y, m - 1, day);
      if (d.date <= new Date()) d.date = null; // a draft from yesterday must not keep a date that has passed
    }
    return d || {};
  } catch {
    return {};
  }
};

// Inquiry wizard (Mero Event style: date, shift and hall first, then details, then send).
// The venue replies with a quotation; nothing is charged here. The draft survives a refresh, and
// step 2 has its own history entry so the browser Back button returns to step 1.
export default function InquiryPage() {
  const { id } = useParams();
  const goToLogin = useGoToLogin();
  const { state } = useLocation();
  const { isAuthenticated, loading: authLoading, user } = useContext(AuthContext);
  const headingRef = useRef(null);
  const stepChanged = useRef(false);
  const sending = useRef(false);
  const [params, setParams] = useSearchParams();

  const { data: venue, isPending, isError } = useVenueDetails(id);
  const { data: spaces = [] } = useVenueSpaces(venue?._id);
  const create = useCreateInquiry();
  const { data: openHere } = useMyInquiries({ group: "open", venue: venue?._id, limit: 50 }, isAuthenticated && Boolean(venue?._id));
  const mine = openHere?.items ?? [];
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const { data: booked = [], isFetching: checking, isPlaceholderData, isError: availabilityFailed } = useAvailability(venue?._id, visibleMonth);
  const onMonthChange = useCallback((m) => setVisibleMonth(m), []);

  const [draft] = useState(() => loadDraft(id));
  const [date, setDate] = useState(draft.date ?? null);
  const [shift, setShift] = useState(draft.shift ?? null); // null = flexible
  const [guests, setGuests] = useState(draft.guests ?? 100);
  const [spaceId, setSpaceId] = useState(state?.spaceId ?? draft.spaceId ?? null);
  const [eventType, setEventType] = useState(draft.eventType ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [notes, setNotes] = useState(draft.notes ?? "");
  const [siteVisit, setSiteVisit] = useState(draft.siteVisit ?? false);
  const [attempted, setAttempted] = useState({ 1: false, 2: false });
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);
  const [files, setFiles] = useState([]);
  const [fileNotice, setFileNotice] = useState(""); // set when the request went through but the files did not

  // Wait for the session check (/auth/me) before deciding the visitor is logged out.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) goToLogin({ replace: true });
  }, [authLoading, isAuthenticated, goToLogin]);

  useEffect(() => {
    if (user?._id) {
      setName((n) => n || user.name || "");
      setPhone((p) => p || user.phone || "");
    }
  }, [user?._id, user?.name, user?.phone]);

  // Keep the draft for a refresh (this tab only; the contact details are not stored).
  useEffect(() => {
    if (sent) return;
    try {
      sessionStorage.setItem(
        draftKey(id),
        JSON.stringify({ date: date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : null, shift, guests, spaceId, eventType, notes, siteVisit }),
      );
    } catch {
      /* storage can be unavailable (private window); the form still works without it */
    }
  }, [id, sent, date, shift, guests, spaceId, eventType, notes, siteVisit]);

  const space = spaces.find((s) => s._id === spaceId) ?? null;
  // The same customer asking the same venue for the same day twice just clutters the owner's inbox.
  const duplicate = date
    ? mine.find((q) => (q.venue?._id ?? q.venue) === venue?._id && ["pending", "quoted", "accepted"].includes(q.status) && !q.booking && serverDay(q.preferredDate).getTime() === date.getTime())
    : null;
  const guestCount = Number(guests) || 0;
  const largest = spaces.reduce((m, s) => Math.max(m, s.capacity || 0), 0);
  const unavailableFor = (d, sh = shift) => isDateUnavailable(d, { booked, spaces, spaceId, shift: sh });

  // Problems with each field, computed live; shown after the first try or after leaving the field.
  const step1Errors = {};
  if (!date) step1Errors.date = "Choose a date for your event.";
  else if (unavailableFor(date)) step1Errors.date = "That date is already booked for your choice of hall and shift. Pick another date, hall or shift.";
  if (guestCount < 1) step1Errors.guests = "Enter how many guests you expect.";
  else if (guestCount > 5000) step1Errors.guests = "Enter 5,000 guests or fewer.";
  else if (space && guestCount > space.capacity) step1Errors.guests = `${space.name} holds up to ${plural(space.capacity, "guest")}. Choose another space or fewer guests.`;
  else if (!space && largest && guestCount > largest) step1Errors.guests = `The largest hall here holds ${plural(largest, "guest")}. Enter a smaller number.`;

  const phoneDigits = phone.replace(/\D/g, "");
  const step2Errors = {};
  if (!eventType) step2Errors.eventType = "Choose the type of event.";
  if (name.trim().length < 2) step2Errors.name = "Enter your full name.";
  if (!phone.trim()) step2Errors.phone = "Enter a phone number the venue can reach you on.";
  else if (/[^\d\s+()-]/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) step2Errors.phone = "Enter a valid phone number, for example 98XXXXXXXX.";

  const step1Ok = Object.keys(step1Errors).length === 0;
  const step = params.get("step") === "2" && step1Ok ? 2 : 1;
  const errors = step === 1 ? step1Errors : step2Errors;
  const shown = (key) => (attempted[step] || touched[key]) && errors[key];
  const touch = (key) => () => setTouched((t) => ({ ...t, [key]: true }));

  // Move focus to the step heading when the step changes (not on first load).
  useEffect(() => {
    if (!stepChanged.current) {
      stepChanged.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step, sent]);

  const goToStep = (n) => {
    const p = new URLSearchParams(params);
    if (n === 1) p.delete("step");
    else p.set("step", String(n));
    setParams(p);
    setServerError("");
  };

  const focusFirstError = (errs) => {
    const key = Object.keys(errs)[0];
    requestAnimationFrame(() => {
      const el = key === "date" ? document.querySelector('#date-field [role="grid"] button[tabindex="0"]') : document.getElementById(key);
      el?.focus();
    });
  };

  const next = () => {
    setAttempted((a) => ({ ...a, 1: true }));
    if (!step1Ok) return focusFirstError(step1Errors);
    goToStep(2);
  };

  const send = async (e) => {
    e.preventDefault();
    if (sending.current) return;
    setAttempted((a) => ({ ...a, 2: true }));
    if (Object.keys(step2Errors).length) return focusFirstError(step2Errors);
    setServerError("");

    const pkg = venue.packages?.find((p) => (p._id ?? p.name) === state?.packageId) ?? null;
    const drink = venue.drinkOptions?.find((d) => (d._id ?? d.name) === state?.drinkId) ?? null;
    const lines = [];
    if (pkg) lines.push(`Menu preference: ${pkg.name} (NPR ${priceFormatter.format(pkg.pricePerPlate)} per plate, minimum ${pkg.minPlates} plates).`);
    if (drink) lines.push(`Drinks preference: ${drink.name}.`);
    if (siteVisit) lines.push("I would like to visit the venue before confirming.");
    if (notes.trim()) lines.push(notes.trim());

    sending.current = true;
    try {
      const created = await create.mutateAsync({
        venue: venue._id,
        ...(spaceId ? { space: spaceId } : {}),
        preferredDate: toInquiryDate(date),
        ...(shift ? { preferredShift: shift } : {}),
        numberOfGuests: guestCount,
        eventType,
        message: lines.join("\n").slice(0, 1000),
        contactName: name.trim(),
        phoneNumber: phone.trim(),
      });
      // The request already exists at this point. If the files fail it still stands, and the person is told where to retry.
      if (files.length) {
        try {
          await uploadInquiryAttachmentsApi(created.data._id, files);
        } catch (uploadErr) {
          setFileNotice(inquiryErrorMessage(uploadErr));
        }
      }
      try {
        sessionStorage.removeItem(draftKey(id));
      } catch {
        /* nothing to clear */
      }
      setSent(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setServerError(inquiryErrorMessage(err));
    } finally {
      sending.current = false;
    }
  };

  if (isPending || authLoading) {
    return <div role="status" aria-label="Loading" className="container-site page-pad min-h-[60vh]"><div className="h-64 animate-pulse rounded-card-lg bg-gold-100" /></div>;
  }
  if (isError || !venue) {
    return (
      <div className="container-site page-pad flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="font-display text-h2 font-light text-ink">We could not find this venue</h1>
        <Link to="/venues" className="font-body text-button uppercase text-gold-800 underline underline-offset-4">Browse venues</Link>
      </div>
    );
  }

  const pkg = venue.packages?.find((p) => (p._id ?? p.name) === state?.packageId) ?? null;
  const drink = venue.drinkOptions?.find((d) => (d._id ?? d.name) === state?.drinkId) ?? null;
  const hoursFor = (opt) => {
    const t = space?.resolvedShifts?.[opt.value] ?? opt.fallback;
    return formatHours(t.startTime, t.endTime);
  };

  const summary = (
    <aside aria-label="Your request" className="self-start rounded-card-lg border border-line bg-cream p-6 lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)]">
      <p className="font-body text-eyebrow uppercase text-gold-800">{sent ? "Request sent" : "Draft request"}</p>
      <h2 className="mt-1 font-display text-h4 font-light text-ink">{venue.venueName}</h2>
      <dl className="mt-4">
        <Row term="Date">{date ? <>{formatDate(date)}<span className="block text-caption text-taupe">{bsLabel(date)}</span></> : "Not chosen yet"}</Row>
        <Row term="Shift">{shift ? <>{shiftLabel(shift)}<span className="block text-caption text-taupe">{hoursFor(SHIFT_OPTIONS.find((s) => s.value === shift))}</span></> : "Flexible"}</Row>
        <Row term="Hall or space">{space ? space.name : "Venue to recommend"}</Row>
        <Row term="Guests">{guestCount || "Not set"}</Row>
        {pkg && <Row term="Menu">{pkg.name}</Row>}
        {drink && <Row term="Drinks">{drink.name}</Row>}
        {eventType && <Row term="Event">{eventType}</Row>}
      </dl>
      <p className="mt-4 font-body text-caption text-taupe">
        This is a request, not a booking. The venue replies with a quotation, and nothing is charged until you accept it.
      </p>
    </aside>
  );

  const barItems = [
    ["Date", date ? formatDate(date) : "Not chosen yet"],
    ["Shift", shift ? shiftLabel(shift) : "Flexible"],
    ["Hall", space ? space.name : "Venue to recommend"],
    ["Guests", guestCount || "Not set"],
    ...(pkg ? [["Menu", pkg.name]] : []),
    ...(drink ? [["Drinks", drink.name]] : []),
    ...(step === 2 && eventType ? [["Event", eventType]] : []),
  ];

  if (sent) {
    return (
      <div className="container-site page-pad grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
        <div>
          <CheckCircle2 aria-hidden="true" className="size-10 text-success" />
          <h1 ref={headingRef} tabIndex={-1} className="mt-4 scroll-mt-28 font-display text-h2 font-light text-ink outline-none">
            Request sent to {venue.venueName}
          </h1>
          <p className="mt-3 max-w-xl font-body text-body text-ink/85">
            The venue will review your date and reply with a quotation. You will get a notification when it arrives. Until you accept a quotation, nothing is booked and nothing is charged.
          </p>
          {fileNotice && (
            <p role="alert" className="mt-4 max-w-xl rounded-card-sm border border-gold-800/30 bg-white px-4 py-3 font-body text-small text-ink">
              Your request was sent, but we could not attach your {files.length === 1 ? "file" : "files"}: {fileNotice} Open the request under My inquiries to add {files.length === 1 ? "it" : "them"} again.
            </p>
          )}
          <ol className="mt-6 max-w-xl space-y-3 font-body text-small text-ink">
            {["The venue checks the date and sends you a quotation.", "You read it under My inquiries, then accept or decline.", "If you accept, you pay the deposit on eSewa and the date is yours."].map((t, i) => (
              <li key={t} className="flex gap-3"><span aria-hidden="true" className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-100 text-caption text-gold-800">{i + 1}</span>{t}</li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/my-inquiries" className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800">View my requests</Link>
            <Link to={`/venue/${venue._id}`} className="inline-flex min-h-11 items-center rounded-full border border-ink px-6 py-3 font-body text-button uppercase text-ink hover:bg-ink hover:text-gold-50">Back to the venue</Link>
          </div>
        </div>
        {summary}
      </div>
    );
  }

  const dateShown = shown("date");
  const guestsShown = shown("guests");

  return (
    <div className="container-site page-pad">
      <Link to={`/venue/${venue._id}`} className="inline-flex min-h-11 items-center font-body text-small text-taupe hover:text-ink">← Back to {venue.venueName}</Link>
      <ol aria-label="Progress" className="mt-2 flex gap-2">
        {STEPS.map((t, i) => {
          const done = step > i + 1;
          return (
            <li key={t} aria-current={step === i + 1 ? "step" : undefined} className={`flex min-h-11 flex-1 items-start border-t-4 pt-2 font-body text-eyebrow uppercase ${step >= i + 1 ? "border-gold text-ink" : "border-line text-taupe"}`}>
              {done ? (
                <button type="button" onClick={() => goToStep(i + 1)} className="inline-flex min-h-9 items-center gap-1.5 text-left uppercase underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                  <Check aria-hidden="true" className="size-3.5 shrink-0" />Step {i + 1} · {t}<span className="sr-only">, go back to edit</span>
                </button>
              ) : (
                <span className="inline-flex min-h-9 items-center">Step {i + 1} of {STEPS.length} · {t}</span>
              )}
            </li>
          );
        })}
      </ol>
      <p role="status" className="sr-only">Step {step} of {STEPS.length}: {STEPS[step - 1]}</p>

      <div className="mt-6">
        <form onSubmit={step === 2 ? send : (e) => { e.preventDefault(); next(); }} noValidate className="space-y-6 lg:space-y-8">
          <h1 ref={headingRef} tabIndex={-1} className="scroll-mt-28 font-display text-h2 font-light text-ink outline-none">
            {step === 1 ? "When is your event?" : "Tell the venue about it"}
          </h1>

          {step === 1 ? (
            <div className="grid gap-8 lg:grid-cols-[460px_minmax(0,1fr)] lg:items-start lg:gap-12">
              <div id="date-field">
                <DatePicker
                  value={date}
                  onChange={setDate}
                  onMonthChange={onMonthChange}
                  isUnavailable={(d) => unavailableFor(d)}
                  loading={checking && (isPlaceholderData || !booked.length)}
                  invalid={!!dateShown}
                  describedBy={dateShown ? "date-error" : undefined}
                />
                {dateShown && <p id="date-error" role="alert" className={errorText}>{errors.date}</p>}
                {duplicate && (
                  <p role="status" className="mt-2 rounded-card-sm bg-sand px-4 py-3 font-body text-small text-ink">
                    You already have a request for this date at this venue. <Link to={`/my-inquiries/${duplicate._id}`} className="text-gold-800 underline underline-offset-4">Open it</Link> instead of sending another, or carry on if this is a different event.
                  </p>
                )}
                {availabilityFailed && <p className="mt-2 font-body text-caption text-taupe">We could not check which days are booked. You can still send a request and the venue will confirm the date.</p>}
              </div>

              <div className="space-y-8">
              <fieldset>
                <legend className={label}>Shift</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SHIFT_OPTIONS.map((opt) => {
                    const taken = !!date && shift !== opt.value && unavailableFor(date, opt.value);
                    return (
                      <label key={opt.value} className={choice(shift === opt.value, taken)}>
                        <input type="radio" name="shift" className="sr-only" disabled={taken} checked={shift === opt.value} onChange={() => setShift(opt.value)} />
                        <span className="block font-body text-body text-ink">{opt.label}</span>
                        <span className="block font-body text-caption text-taupe">{taken ? "Booked on this date" : hoursFor(opt)}</span>
                      </label>
                    );
                  })}
                  <label className={choice(shift === null, false)}>
                    <input type="radio" name="shift" className="sr-only" checked={shift === null} onChange={() => setShift(null)} />
                    <span className="block font-body text-body text-ink">Flexible</span>
                    <span className="block font-body text-caption text-taupe">The venue suggests a shift</span>
                  </label>
                </div>
              </fieldset>

              <div>
                <label htmlFor="guests" className={label}>Expected guests</label>
                <input
                  id="guests"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="5000"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  onBlur={touch("guests")}
                  aria-invalid={!!guestsShown}
                  aria-describedby={guestsShown ? "guests-error" : "guests-hint"}
                  className={`${field} max-w-[180px]`}
                />
                {guestsShown ? (
                  <p id="guests-error" role="alert" className={errorText}>{errors.guests}</p>
                ) : (
                  <p id="guests-hint" className="mt-1.5 font-body text-caption text-taupe">
                    {space ? `${space.name} holds up to ${plural(space.capacity, "guest")}.` : largest ? `Halls here hold up to ${plural(largest, "guest")}.` : "An estimate is fine; you can change it later."}
                  </p>
                )}
              </div>

              <fieldset>
                <legend className={label}>Hall or space</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={choice(spaceId === null, false)}>
                    <input type="radio" name="space" className="sr-only" checked={spaceId === null} onChange={() => setSpaceId(null)} />
                    <span className="block font-body text-body text-ink">Let the venue recommend</span>
                    <span className="block font-body text-caption text-taupe">Good if you are still deciding</span>
                  </label>
                  {spaces.map((s) => {
                    const tooSmall = guestCount > s.capacity && spaceId !== s._id;
                    return (
                      <label key={s._id} className={choice(spaceId === s._id, tooSmall)}>
                        <input type="radio" name="space" className="sr-only" disabled={tooSmall} checked={spaceId === s._id} onChange={() => setSpaceId(s._id)} />
                        <span className="block font-body text-body text-ink">{s.name}</span>
                        <span className="block font-body text-caption text-taupe">{tooSmall ? `Holds up to ${s.capacity}, too small for ${plural(guestCount, "guest")}` : `Up to ${plural(s.capacity, "guest")}`}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="space-y-6">
              <div>
                <label htmlFor="eventType" className={label}>Event type</label>
                <Select
                  id="eventType"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  onBlur={touch("eventType")}
                  aria-invalid={!!shown("eventType")}
                  aria-describedby={shown("eventType") ? "eventType-error" : undefined}
                  className={field}
                >
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </Select>
                {shown("eventType") && <p id="eventType-error" role="alert" className={errorText}>{errors.eventType}</p>}
              </div>
              <div className="grid gap-5">
                <div>
                  <label htmlFor="name" className={label}>Full name</label>
                  <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={touch("name")} aria-invalid={!!shown("name")} aria-describedby={shown("name") ? "name-error" : undefined} className={field} />
                  {shown("name") && <p id="name-error" role="alert" className={errorText}>{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className={label}>Phone</label>
                  <input id="phone" type="tel" autoComplete="tel" placeholder="98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={touch("phone")} aria-invalid={!!shown("phone")} aria-describedby={shown("phone") ? "phone-error" : "phone-hint"} className={field} />
                  {shown("phone") ? <p id="phone-error" role="alert" className={errorText}>{errors.phone}</p> : <p id="phone-hint" className="mt-1.5 font-body text-caption text-taupe">The venue calls or messages you on this number.</p>}
                </div>
              </div>
              </div>
              <div className="space-y-6">
              <div>
                <label htmlFor="notes" className={label}>Notes for the venue (optional)</label>
                <textarea id="notes" rows={8} maxLength={600} value={notes} onChange={(e) => setNotes(e.target.value)} aria-describedby="notes-count" placeholder="Menu wishes, timings, decoration, anything the venue should know" className={field} />
                <p id="notes-count" className="mt-1.5 text-right font-body text-caption text-taupe">{notes.length} of 600 characters</p>
              </div>
              <AttachmentPicker files={files} onChange={setFiles} />
              <label className="flex min-h-11 cursor-pointer items-start gap-3 font-body text-small text-ink">
                <input type="checkbox" checked={siteVisit} onChange={(e) => setSiteVisit(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-ink" />
                <span>
                  I would like to visit the venue before confirming.
                  <span className="mt-0.5 block text-caption text-taupe">This adds a note to your request. It does not book a visit; the venue will reply to you.</span>
                </span>
              </label>
              </div>
            </div>
          )}

          {serverError && <p role="alert" className="rounded-card-sm border border-red-700/30 bg-white px-4 py-3 font-body text-small text-red-700">{serverError}</p>}

          <div className="sticky bottom-0 z-30 -mx-5 border-t border-line bg-cream/95 px-5 py-3 backdrop-blur md:-mx-10 md:px-10 lg:static lg:mx-0 lg:rounded-card-lg lg:border lg:p-5 lg:backdrop-blur-none">
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
              <aside aria-label="Your request" className="min-w-0 flex-1">
                <p className="font-body text-eyebrow uppercase text-gold-800">Draft request · {venue.venueName}</p>
                <p className="mt-1 truncate font-body text-small text-ink lg:hidden">{barItems.slice(0, 4).map(([, v]) => v).join(" · ")}</p>
                <dl className="mt-2 hidden flex-wrap gap-x-8 gap-y-2 lg:flex">
                  {barItems.map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-body text-caption text-taupe">{k}</dt>
                      <dd className="font-body text-small text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-2 hidden font-body text-caption text-taupe lg:block">A request, not a booking. The venue replies with a quotation and nothing is charged until you accept it.</p>
              </aside>
              <div className="flex items-center gap-3">
                {step === 2 && (
                  <button type="button" onClick={() => goToStep(1)} className="inline-flex min-h-11 items-center rounded-full border border-ink px-6 py-3 font-body text-button uppercase text-ink hover:bg-ink hover:text-gold-50">Back</button>
                )}
                <button type="submit" disabled={create.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-8 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800 disabled:opacity-60">
                  {create.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
                  {step === 1 ? "Continue" : create.isPending ? "Sending" : "Send request"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
