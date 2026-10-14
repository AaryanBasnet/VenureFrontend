import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useGoToLogin } from "../../auth/returnTo";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthContext } from "../../auth/AuthProvider";
import { useVenueDetails } from "../../hooks/user/useVenueDetails";
import { useVenueSpaces } from "../../features/venues/hooks/useVenueSpaces";
import { priceFormatter } from "../../features/venues/venueFormat";
import DatePicker from "../../features/inquiry/components/DatePicker";
import { bsLabel } from "../../features/inquiry/bsCalendar";
import { useAvailability } from "../../features/inquiry/hooks/useAvailability";
import { isDateUnavailable } from "../../features/inquiry/availability";
import { inquiryErrorMessage, useCreateInquiry } from "../../features/inquiry/hooks/useCreateInquiry";
import { EVENT_TYPES, SHIFT_OPTIONS, formatDate, shiftLabel, toInquiryDate } from "../../features/inquiry/inquiryOptions";

const field =
  "w-full rounded-card-sm border border-border-strong bg-white px-4 py-3 font-body text-body text-ink placeholder:text-taupe-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
const label = "mb-1.5 block font-body text-eyebrow uppercase text-taupe";

function Row({ term, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="font-body text-small text-taupe">{term}</dt>
      <dd className="text-right font-body text-small text-ink">{children}</dd>
    </div>
  );
}

// Inquiry wizard (Mero Event style: date, shift and hall first, then details, then send).
// The venue replies with a quotation; nothing is charged here.
export default function InquiryPage() {
  const { id } = useParams();
  const goToLogin = useGoToLogin();
  const { state } = useLocation();
  const { isAuthenticated, loading: authLoading, user } = useContext(AuthContext);
  const headingRef = useRef(null);

  const { data: venue, isPending, isError } = useVenueDetails(id);
  const { data: spaces = [] } = useVenueSpaces(venue?._id);
  const create = useCreateInquiry();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const { data: booked = [] } = useAvailability(venue?._id, visibleMonth);
  const onMonthChange = useCallback((m) => setVisibleMonth(m), []);

  const [step, setStep] = useState(1);
  const [date, setDate] = useState(null);
  const [shift, setShift] = useState(null); // null = flexible
  const [guests, setGuests] = useState(100);
  const [spaceId, setSpaceId] = useState(state?.spaceId ?? null);
  const [eventType, setEventType] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [siteVisit, setSiteVisit] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

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

  useEffect(() => {
    headingRef.current?.focus();
  }, [step, sent]);

  if (isPending || authLoading) {
    return <div role="status" aria-label="Loading" className="container-site min-h-[60vh] pt-[calc(var(--spacing-header)+3rem)]"><div className="h-64 animate-pulse rounded-card-lg bg-gold-100" /></div>;
  }
  if (isError || !venue) {
    return (
      <div className="container-site flex min-h-[60vh] flex-col items-center justify-center gap-3 pt-[var(--spacing-header)] text-center">
        <h1 className="font-display text-h2 font-light text-ink">We could not find this venue</h1>
        <Link to="/venues" className="font-body text-button uppercase text-gold-800 underline underline-offset-4">Browse venues</Link>
      </div>
    );
  }

  const space = spaces.find((s) => s._id === spaceId) ?? null;
  const pkg = venue.packages?.find((p) => (p._id ?? p.name) === state?.packageId) ?? null;
  const drink = venue.drinkOptions?.find((d) => (d._id ?? d.name) === state?.drinkId) ?? null;
  const guestCount = Number(guests) || 0;
  const hoursFor = (opt) => {
    const t = space?.resolvedShifts?.[opt.value] ?? opt.fallback;
    return `${t.startTime}–${t.endTime}`;
  };

  const next = () => {
    if (!date) return setError("Choose a date for your event.");
    if (isDateUnavailable(date, { booked, spaces, spaceId, shift })) {
      return setError("That date is already booked for your choice of hall and shift. Please pick another date, hall or shift.");
    }
    if (guestCount < 1) return setError("Enter how many guests you expect.");
    if (space && guestCount > space.capacity) return setError(`${space.name} holds up to ${space.capacity} guests. Choose another space or fewer guests.`);
    setError("");
    setStep(2);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!eventType) return setError("Choose the type of event.");
    if (name.trim().length < 2) return setError("Enter your name.");
    if (phone.replace(/\D/g, "").length < 7) return setError("Enter a phone number the venue can reach you on.");
    setError("");

    const lines = [];
    if (pkg) lines.push(`Menu preference: ${pkg.name} (NPR ${priceFormatter.format(pkg.pricePerPlate)} per plate, minimum ${pkg.minPlates} plates).`);
    if (drink) lines.push(`Drinks preference: ${drink.name}.`);
    if (siteVisit) lines.push("I would like to visit the venue before confirming.");
    if (notes.trim()) lines.push(notes.trim());

    try {
      await create.mutateAsync({
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
      setSent(true);
    } catch (err) {
      setError(inquiryErrorMessage(err));
    }
  };

  const summary = (
    <aside aria-label="Your request" className="self-start rounded-card-lg border border-line bg-cream p-6 lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)]">
      <p className="font-body text-eyebrow uppercase text-gold-800">{sent ? "Request sent" : "Draft request"}</p>
      <h2 className="mt-1 font-display text-h4 font-light text-ink">{venue.venueName}</h2>
      <dl className="mt-4">
        <Row term="Date">{date ? <>{formatDate(date)}<span className="block text-caption text-taupe">{bsLabel(date)}</span></> : "Not chosen yet"}</Row>
        <Row term="Shift">{shift ? `${shiftLabel(shift)} (${hoursFor(SHIFT_OPTIONS.find((s) => s.value === shift))})` : "Flexible"}</Row>
        <Row term="Hall or space">{space ? space.name : "Venue to recommend"}</Row>
        <Row term="Guests">{guestCount || "—"}</Row>
        {pkg && <Row term="Menu">{pkg.name}</Row>}
        {drink && <Row term="Drinks">{drink.name}</Row>}
        {eventType && <Row term="Event">{eventType}</Row>}
      </dl>
      <p className="mt-4 font-body text-caption text-taupe">
        This is a request, not a booking. The venue replies with a quotation, and nothing is charged until you accept it.
      </p>
    </aside>
  );

  if (sent) {
    return (
      <div className="container-site grid gap-10 pb-20 pt-[calc(var(--spacing-header)+2.5rem)] lg:grid-cols-[1fr_380px]">
        <div>
          <CheckCircle2 aria-hidden="true" className="size-10 text-success" />
          <h1 ref={headingRef} tabIndex={-1} className="mt-4 font-display text-h2 font-light text-ink outline-none">
            Request sent to {venue.venueName}
          </h1>
          <p className="mt-3 max-w-xl font-body text-body text-ink/85">
            The venue will review your date and reply with a quotation. You will get a notification when it arrives. Until you accept a quotation, nothing is booked and nothing is charged.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/my-inquiries" className="rounded-full bg-ink px-6 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800">View my requests</Link>
            <Link to={`/venue/${venue._id}`} className="rounded-full border border-ink px-6 py-3 font-body text-button uppercase text-ink hover:bg-ink hover:text-gold-50">Back to the venue</Link>
            
          </div>
        </div>
        {summary}
      </div>
    );
  }

  return (
    <div className="container-site pb-24 pt-[calc(var(--spacing-header)+2.5rem)]">
      <Link to={`/venue/${venue._id}`} className="font-body text-small text-taupe hover:text-ink">← Back to {venue.venueName}</Link>
      <ol aria-label="Progress" className="mt-6 flex gap-2">
        {["Date, shift and hall", "Your details"].map((t, i) => (
          <li key={t} aria-current={step === i + 1 ? "step" : undefined} className={`flex-1 border-t-4 pt-2 font-body text-eyebrow uppercase ${step >= i + 1 ? "border-gold text-ink" : "border-line text-taupe"}`}>
            {i + 1} · {t}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <form onSubmit={step === 2 ? send : (e) => { e.preventDefault(); next(); }} noValidate className="space-y-8">
          <h1 ref={headingRef} tabIndex={-1} className="font-display text-h2 font-light text-ink outline-none">
            {step === 1 ? "When is your event?" : "Tell the venue about it"}
          </h1>

          {step === 1 ? (
            <>
              <DatePicker
                value={date}
                onChange={setDate}
                onMonthChange={onMonthChange}
                isUnavailable={(d) => isDateUnavailable(d, { booked, spaces, spaceId, shift })}
              />
              <p className="-mt-4 font-body text-caption text-taupe">Struck-through days are already booked for the hall and shift you chose.</p>

              <fieldset>
                <legend className={label}>Shift</legend>
                <div className="grid gap-3 sm:grid-cols-4">
                  {SHIFT_OPTIONS.map((opt) => (
                    <label key={opt.value} className={`cursor-pointer rounded-card-md border p-4 has-[:checked]:border-ink has-[:checked]:bg-gold-50 ${shift === opt.value ? "border-ink" : "border-line bg-white"}`}>
                      <input type="radio" name="shift" className="sr-only" checked={shift === opt.value} onChange={() => setShift(opt.value)} />
                      <span className="block font-body text-body text-ink">{opt.label}</span>
                      <span className="block font-body text-caption text-taupe">{hoursFor(opt)}</span>
                    </label>
                  ))}
                  <label className={`cursor-pointer rounded-card-md border p-4 ${shift === null ? "border-ink bg-gold-50" : "border-line bg-white"}`}>
                    <input type="radio" name="shift" className="sr-only" checked={shift === null} onChange={() => setShift(null)} />
                    <span className="block font-body text-body text-ink">Flexible</span>
                    <span className="block font-body text-caption text-taupe">Venue suggests</span>
                  </label>
                </div>
              </fieldset>

              <div>
                <label htmlFor="guests" className={label}>Expected guests</label>
                <input id="guests" type="number" inputMode="numeric" min="1" max="5000" value={guests} onChange={(e) => setGuests(e.target.value)} className={`${field} max-w-[180px]`} />
              </div>

              <fieldset>
                <legend className={label}>Hall or space</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={`cursor-pointer rounded-card-md border p-4 ${spaceId === null ? "border-ink bg-gold-50" : "border-line bg-white"}`}>
                    <input type="radio" name="space" className="sr-only" checked={spaceId === null} onChange={() => setSpaceId(null)} />
                    <span className="block font-body text-body text-ink">Let the venue recommend</span>
                    <span className="block font-body text-caption text-taupe">Good if you are still deciding</span>
                  </label>
                  {spaces.map((s) => {
                    const tooSmall = guestCount > s.capacity;
                    return (
                      <label key={s._id} className={`rounded-card-md border p-4 ${tooSmall ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${spaceId === s._id ? "border-ink bg-gold-50" : "border-line bg-white"}`}>
                        <input type="radio" name="space" className="sr-only" disabled={tooSmall} checked={spaceId === s._id} onChange={() => setSpaceId(s._id)} />
                        <span className="block font-body text-body text-ink">{s.name}</span>
                        <span className="block font-body text-caption text-taupe">{tooSmall ? `Holds up to ${s.capacity}, too small for ${guestCount}` : `Up to ${s.capacity} guests`}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="eventType" className={label}>Event type</label>
                <select id="eventType" value={eventType} onChange={(e) => setEventType(e.target.value)} className={field}>
                  <option value="">Select event type</option>
                  {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className={label}>Full name</label>
                  <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
                </div>
                <div>
                  <label htmlFor="phone" className={label}>Phone</label>
                  <input id="phone" type="tel" autoComplete="tel" placeholder="98XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} />
                </div>
              </div>
              <div>
                <label htmlFor="notes" className={label}>Notes for the venue (optional)</label>
                <textarea id="notes" rows={4} maxLength={600} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Menu wishes, timings, decoration, anything the venue should know" className={field} />
              </div>
              <label className="flex cursor-pointer items-start gap-3 font-body text-small text-ink">
                <input type="checkbox" checked={siteVisit} onChange={(e) => setSiteVisit(e.target.checked)} className="mt-1 size-4 accent-ink" />
                I would like to visit the venue before confirming.
              </label>
            </>
          )}

          <p role="alert" className="min-h-5 font-body text-small text-red-700">{error}</p>

          <div className="flex items-center justify-between gap-3">
            {step === 2 ? (
              <button type="button" onClick={() => { setError(""); setStep(1); }} className="rounded-full border border-ink px-6 py-3 font-body text-button uppercase text-ink hover:bg-ink hover:text-gold-50">Back</button>
            ) : <span />}
            <button type="submit" disabled={create.isPending} className="inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3 font-body text-button uppercase text-gold-50 hover:bg-gold-800 disabled:opacity-60">
              {create.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
              {step === 1 ? "Continue" : "Send request"}
            </button>
          </div>
        </form>
        {summary}
      </div>
    </div>
  );
}
