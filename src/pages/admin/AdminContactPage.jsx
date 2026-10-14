import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Mail, Phone, Search } from "lucide-react";
import { toast } from "react-toastify";
import { EmptyState, ErrorState, PageHeader, Panel, RowsSkeleton } from "../../components/dashboard/ui";
import { btnOutline, btnPrimary, shortDate } from "../../components/dashboard/styles";
import { inputClass, labelClass } from "../../components/ui/formStyles";
import useGetContact from "../../hooks/useGetContact";

const PER_PAGE = 10;

const timeOf = (d) => (d ? new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "");

function MessageRow({ msg }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const panelId = `msg-${msg._id}`;
  const mailto = msg.email ? `mailto:${msg.email}?subject=${encodeURIComponent("Re: your message to Venure")}` : null;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(msg.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Select the address and copy it by hand.");
    }
  };

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 px-6 py-4 text-left hover:bg-cream focus-visible:bg-cream focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
      >
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-100 font-display text-h5 font-light text-gold-800">
          {(msg.name ?? "?").charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline justify-between gap-x-4">
            <span className="break-words font-body text-body text-ink">{msg.name}</span>
            <span className="font-body text-caption text-taupe">{shortDate(msg.createdAt)}</span>
          </span>
          <span className={`mt-0.5 block break-words font-body text-small text-taupe ${open ? "" : "line-clamp-1"}`}>{msg.message}</span>
        </span>
        <ChevronDown aria-hidden="true" className={`mt-2 size-4 shrink-0 text-taupe transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.5} />
      </button>

      {open && (
        <div id={panelId} className="px-6 pb-5 sm:pl-[5.5rem]">
          <p className="whitespace-pre-line break-words font-body text-small text-ink">{msg.message}</p>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-body text-small">
            <div>
              <dt className="text-caption uppercase text-taupe">Received</dt>
              <dd className="text-ink">
                {shortDate(msg.createdAt)} at {timeOf(msg.createdAt)}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-caption uppercase text-taupe">Email</dt>
              <dd className="break-all text-ink">{msg.email || "Not given"}</dd>
            </div>
            {msg.phone && (
              <div>
                <dt className="text-caption uppercase text-taupe">Phone</dt>
                <dd className="text-ink">
                  <a href={`tel:${msg.phone}`} className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
                    <Phone aria-hidden="true" className="size-4" strokeWidth={1.5} /> {msg.phone}
                  </a>
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {mailto ? (
              <>
                <a href={mailto} className={btnPrimary}>
                  <Mail aria-hidden="true" className="size-4" strokeWidth={1.5} /> Reply by email
                </a>
                <button type="button" onClick={copyEmail} className={btnOutline}>
                  {copied ? <Check aria-hidden="true" className="size-4" strokeWidth={1.5} /> : <Copy aria-hidden="true" className="size-4" strokeWidth={1.5} />}
                  {copied ? "Copied" : "Copy email"}
                </button>
              </>
            ) : (
              <p className="font-body text-small text-taupe">This person did not leave an email address{msg.phone ? ", but you can call them." : "."}</p>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function AdminContactPage() {
  const { data: contacts = [], isPending, isError, refetch } = useGetContact();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = search.trim().toLowerCase();

  useEffect(() => {
    setPage(1);
  }, [q]);

  // The server already sorts newest first; sort again so the order never depends on it.
  const filtered = useMemo(
    () =>
      [...contacts]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .filter((c) => !q || [c.name, c.email, c.phone, c.message].some((f) => f?.toLowerCase().includes(q))),
    [contacts, q]
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Messages"
        description="Messages sent through the contact form on the site, newest first."
        actions={!isPending && !isError && <p className="font-body text-small text-taupe">{contacts.length} in total</p>}
      />

      <div className="mb-6 sm:max-w-sm">
        <label htmlFor="msg-search" className={labelClass}>Search messages</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-taupe" strokeWidth={1.5} />
          <input id="msg-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, phone or text" className={`${inputClass} pl-10`} />
        </div>
      </div>

      <Panel bodyClassName="p-0">
        {isPending ? (
          <RowsSkeleton rows={4} />
        ) : isError ? (
          <ErrorState onRetry={refetch}>Messages could not be loaded right now.</ErrorState>
        ) : contacts.length === 0 ? (
          <EmptyState icon={Mail} title="No messages yet">Messages from the contact form will show up here.</EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No matching messages">Nothing matches "{search.trim()}".</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {shown.map((m) => (
              <MessageRow key={m._id} msg={m} />
            ))}
          </ul>
        )}

        {filtered.length > PER_PAGE && (
          <nav aria-label="Message pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
            <p className="font-body text-caption text-taupe" aria-live="polite">
              Page {page} of {pages} · {filtered.length} messages
            </p>
            <div className="flex gap-2">
              <button type="button" className={btnOutline} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.5} /> Previous
              </button>
              <button type="button" className={btnOutline} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </nav>
        )}
      </Panel>
    </>
  );
}
