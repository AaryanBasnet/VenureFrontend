import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, FileText, Loader2, MapPin } from "lucide-react";
import { toast } from "react-toastify";
import { ErrorState, PageHeader, Panel, Pill } from "../../components/dashboard/ui";
import { btnDanger, btnOutline, btnPrimary, shortDate } from "../../components/dashboard/styles";
import { inputClass, labelClass } from "../../components/ui/formStyles";
import Select from "../../components/ui/Select";
import { applicationError, useApplication, useApproveApplication, useRejectApplication, useResendApplicationLink } from "../../hooks/admin/useVenueApplications";
import { getApplicationDocumentLinkApi } from "../../api/venueApplications";
import { SITE_CATEGORIES, VENUE_TYPE_LABELS } from "../../features/listVenue/applicationLabels";
import { formatSize } from "../../features/inquiry/attachments";

const TONE = { pending: ["Waiting for review", "gold"], approved: ["Approved", "success"], rejected: ["Rejected", "danger"] };
const backLink = "mb-4 inline-flex min-h-11 items-center gap-2 font-body text-small text-taupe hover:text-ink";

function Row({ term, children }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className="shrink-0 font-body text-small text-taupe">{term}</dt>
      <dd className="min-w-0 break-words text-right font-body text-small text-ink">{children}</dd>
    </div>
  );
}

function DocumentButton({ applicationId, kind, doc, label }) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const open = async () => {
    setError("");
    setOpening(true);
    const tab = window.open("", "_blank"); // opened first so the browser does not treat it as a popup
    try {
      const url = await getApplicationDocumentLinkApi(applicationId, kind);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch (err) {
      tab?.close();
      setError(applicationError(err));
    } finally {
      setOpening(false);
    }
  };
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <button type="button" onClick={open} disabled={opening} className="flex min-h-11 w-full items-center gap-3 rounded-card-sm border border-line bg-white px-4 text-left font-body text-small text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
        {opening ? <Loader2 aria-hidden="true" className="size-4 shrink-0 animate-spin" /> : <FileText aria-hidden="true" className="size-4 shrink-0 text-gold-800" />}
        <span className="min-w-0 flex-1 truncate">{doc.originalName}</span>
        <span className="shrink-0 text-caption text-taupe">{formatSize(doc.size)}</span>
        <span className="sr-only">(opens in a new tab)</span>
      </button>
      {error && <p role="alert" className="mt-1.5 font-body text-small text-red-700">{error}</p>}
    </div>
  );
}

export default function AdminApplicationDetailPage() {
  const { id } = useParams();
  const { data: a, isPending, isError, refetch } = useApplication(id);
  const approve = useApproveApplication();
  const reject = useRejectApplication();
  const resend = useResendApplicationLink();
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState("");

  if (isPending) {
    return (
      <div role="status" aria-label="Loading" className="space-y-4">
        <div className="h-10 w-64 animate-pulse rounded-card-sm bg-gold-100" />
        <div className="h-72 animate-pulse rounded-card-lg bg-gold-100" />
      </div>
    );
  }
  if (isError || !a) {
    return (
      <>
        <Link to="/admin/applications" className={backLink}><ArrowLeft aria-hidden="true" className="size-4" /> Applications</Link>
        <Panel><ErrorState onRetry={refetch}>This application could not be found or loaded.</ErrorState></Panel>
      </>
    );
  }

  const [statusLabel, statusTone] = TONE[a.status];
  const chosen = category || a.suggestedCategory || "";
  const pin = a.coordinates ? `${a.coordinates.lat},${a.coordinates.lng}` : "";
  const address = [a.location.area, a.location.city, `${a.location.province} Province`, "Nepal"].join(", ");
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(pin || address)}&z=16&output=embed`;
  const openInMaps = a.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin || address)}`;
  const busy = approve.isPending || reject.isPending || resend.isPending;

  const onApprove = async () => {
    setError("");
    try {
      const result = await approve.mutateAsync({ id: a._id, category: chosen });
      if (result.data.emailed) toast.success("Approved. The owner has been emailed a link to choose a password.");
      else toast.warning("Approved, but the email could not be sent. Use “Send the link again” below.", { autoClose: false });
    } catch (e) {
      setError(applicationError(e));
    }
  };
  const onResend = async () => {
    setError("");
    try {
      const result = await resend.mutateAsync({ id: a._id });
      if (result.data.emailed) toast.success("A new link was emailed to the owner.");
      else setError("The email could not be sent. Try again in a moment.");
    } catch (e) {
      setError(applicationError(e));
    }
  };
  const onReject = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await reject.mutateAsync({ id: a._id, reason: reason.trim() });
      setRejecting(false);
      toast.success("Rejected. The applicant has been emailed.");
    } catch (err) {
      setError(applicationError(err));
    }
  };

  return (
    <>
      <Link to="/admin/applications" className={backLink}><ArrowLeft aria-hidden="true" className="size-4" /> Applications</Link>
      <PageHeader
        eyebrow={VENUE_TYPE_LABELS[a.venueType]}
        title={a.venueName}
        description={`Applied ${shortDate(a.createdAt)} by ${a.contactName}`}
        actions={<Pill tone={statusTone}>{statusLabel}</Pill>}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="The applicant">
            <dl className="-my-3">
              <Row term="Contact person">{a.contactName}</Row>
              <Row term="Email"><a href={`mailto:${a.email}`} className="underline underline-offset-4">{a.email}</a></Row>
              <Row term="Phone"><a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="underline underline-offset-4">{a.phone}</a></Row>
              {a.about && <Row term="About">{a.about}</Row>}
            </dl>
          </Panel>

          <Panel title="Location" action={<a href={openInMaps} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-body text-small text-gold-800 underline underline-offset-4"><ExternalLink aria-hidden="true" className="size-3.5" /> Open in Google Maps<span className="sr-only"> (opens in a new tab)</span></a>}>
            <dl className="-my-3 mb-4">
              <Row term="Province">{a.location.province}</Row>
              <Row term="City">{a.location.city}</Row>
              <Row term="Street or landmark">{a.location.area}</Row>
              <Row term="Map pin">{a.coordinates ? <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-3.5 text-gold-800" />{a.coordinates.lat.toFixed(5)}, {a.coordinates.lng.toFixed(5)}</span> : a.mapLink ? "Link only, no pin read" : "Not given"}</Row>
            </dl>
            <div className="overflow-hidden rounded-card-md border border-line bg-sand">
              <iframe title={`Map of ${a.venueName}`} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="h-64 w-full border-0" />
            </div>
          </Panel>

          <Panel title="Halls">
            <ul className="-my-3 divide-y divide-line">
              {a.halls.map((h) => (
                <li key={h.name} className="flex justify-between gap-4 py-2.5 font-body text-small text-ink">
                  <span>{h.name}</span>
                  <span className="text-taupe">{h.capacity} guests</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={`Photos (${a.photos.length})`}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {a.photos.map((p, i) => (
                <li key={p.url}>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-card-md border border-line focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                    <img src={p.url} alt={`Photo ${i + 1} of ${a.venueName}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    <span className="sr-only">(opens full size in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6 self-start">
          <Panel title="Documents" description="Only you can open these. The links last a few minutes.">
            <div className="space-y-4">
              <DocumentButton applicationId={a._id} kind="registrationCert" doc={a.registrationCert} label="Business registration" />
              <DocumentButton applicationId={a._id} kind="panCert" doc={a.panCert} label="PAN certificate" />
              <dl className="-mb-3"><Row term="PAN number">{a.panNumber}</Row></dl>
            </div>
            <p className="mt-4 font-body text-caption text-taupe">Check that the PAN number matches the certificate, and that the name on both documents matches the venue.</p>
          </Panel>

          <Panel title="Decision">
            {a.status === "pending" ? (
              rejecting ? (
                <form onSubmit={onReject} className="space-y-3">
                  <div>
                    <label htmlFor="reason" className={labelClass}>Why are you rejecting it?</label>
                    <textarea id="reason" rows={5} maxLength={1000} required minLength={5} value={reason} onChange={(e) => setReason(e.target.value)} aria-describedby="reason-hint" className={inputClass} />
                    <p id="reason-hint" className="mt-1.5 font-body text-caption text-taupe">This is sent to {a.email}. Say what to fix, so they can apply again.</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" disabled={busy || reason.trim().length < 5} className={btnDanger}>{reject.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />} Reject and email</button>
                    <button type="button" onClick={() => { setRejecting(false); setError(""); }} disabled={busy} className={btnOutline}>Back</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="category" className={labelClass}>List it on the site as</label>
                    <Select id="category" value={chosen} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                      {SITE_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </Select>
                    <p className="mt-1.5 font-body text-caption text-taupe">They said: {VENUE_TYPE_LABELS[a.venueType]}. The site files venues under its own categories.</p>
                  </div>
                  <p className="font-body text-small text-ink">Approving creates the owner account and the live venue with its halls and photos, then emails {a.email} a one-time link to choose a password.</p>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={onApprove} disabled={busy || !chosen} className={btnPrimary}>{approve.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />} Approve</button>
                    <button type="button" onClick={() => { setRejecting(true); setError(""); }} disabled={busy} className={btnDanger}>Reject</button>
                  </div>
                </div>
              )
            ) : (
              <dl className="-my-3">
                <Row term="Decision"><Pill tone={statusTone}>{statusLabel}</Pill></Row>
                {a.reviewedAt && <Row term="On">{shortDate(a.reviewedAt)}</Row>}
                {a.reviewedBy?.name && <Row term="By">{a.reviewedBy.name}</Row>}
                {a.reviewNote && <Row term="Reason">{a.reviewNote}</Row>}
                {a.status === "approved" && <Row term="Venue"><Link to="/admin/venue" className="underline underline-offset-4">See it under Venues</Link></Row>}
                {a.status === "approved" && <Row term="Password">{a.setupPending ? "Not chosen yet" : "Chosen, the owner can sign in"}</Row>}
              </dl>
            )}
            {a.status === "approved" && a.setupPending && (
              <div className="mt-5 border-t border-line pt-4">
                <p className="font-body text-small text-ink">The owner has not chosen a password yet. If they lost the email, send a new link. The old one stops working.</p>
                <button type="button" onClick={onResend} disabled={busy} className={`${btnOutline} mt-3`}>
                  {resend.isPending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />} Send the link again
                </button>
              </div>
            )}
            {error && <p role="alert" className="mt-4 font-body text-small text-red-700">{error}</p>}
          </Panel>
        </div>
      </div>
    </>
  );
}
