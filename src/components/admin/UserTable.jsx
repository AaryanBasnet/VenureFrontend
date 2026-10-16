import { Fragment, useId, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { toast } from "react-toastify";
import { Pill } from "../dashboard/ui";
import { btnDanger, btnOutline, shortDate } from "../dashboard/styles";
import { inputClass, labelClass } from "../ui/formStyles";

const ROLE_LABEL = { Customer: "Customer", VenueOwner: "Venue owner", Admin: "Admin" };
const ROLE_TONE = { Customer: "neutral", VenueOwner: "success", Admin: "gold" };

const dangerLink =
  "font-body text-small text-red-700 underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700";

const errText = (e) => e?.message || "Could not deactivate this account. Please try again.";

// Labelled search box used above both lists.
export function SearchField({ label, value, onChange, placeholder }) {
  const id = useId();
  return (
    <div className="w-full sm:max-w-sm">
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-taupe" />
        <input id={id} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} pl-11`} />
      </div>
    </div>
  );
}

// Previous / next with a plain-language position line.
export function Pager({ page, totalPages, total, limit, noun, onPage }) {
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-4 sm:px-6">
      <p className="font-body text-small text-taupe" aria-live="polite">
        {from}-{to} of {total} {noun}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} className={`${btnOutline} !px-4 !py-2`}>
          <ChevronLeft aria-hidden="true" className="size-4" /> Previous
        </button>
        <span className="px-2 font-body text-small text-taupe">Page {page} of {totalPages}</span>
        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= totalPages} className={`${btnOutline} !px-4 !py-2`}>
          Next <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </nav>
  );
}

function Initial({ name }) {
  return (
    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-100 font-display text-h5 font-light uppercase text-gold-800">
      {(name || "?").trim().charAt(0)}
    </span>
  );
}

function ConfirmPanel({ user, pending, error, onConfirm, onCancel }) {
  return (
    <div role="alertdialog" aria-label={`Confirm deactivating ${user.name}`} className="rounded-card-md border border-red-300 bg-red-50 p-4 font-body text-small text-ink">
      <p>
        Deactivate <strong className="font-medium">{user.name}</strong>? They are signed out everywhere straight away and can no longer log in.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" onClick={onConfirm} disabled={pending} className={btnDanger}>
          {pending ? "Deactivating..." : "Yes, deactivate"}
        </button>
        <button type="button" onClick={onCancel} disabled={pending} className={btnOutline}>Keep account</button>
      </div>
      {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    </div>
  );
}

// Directory of accounts: a table from md up, stacked cards on phones.
// variant "owners" swaps the role and bookings columns for a venues column.
export default function UserTable({ users, currentUserId, variant = "users", venueCounts = null, onDeactivate }) {
  const owners = variant === "owners";
  const [confirmId, setConfirmId] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const lock = (u) => (u.role === "Admin" ? "Protected" : u._id === currentUserId ? "This is you" : null);

  const open = (id) => { setConfirmId(id); setError(""); };
  const close = () => { setConfirmId(null); setError(""); };
  const confirm = async (u) => {
    setPending(true);
    setError("");
    try {
      await onDeactivate(u._id);
      toast.success(`${u.name} was deactivated`);
      setConfirmId(null);
    } catch (e) {
      setError(errText(e));
    } finally {
      setPending(false);
    }
  };

  const count = (u) => (owners ? (venueCounts ? (venueCounts[u._id] ?? 0) : "-") : (u.bookingCount ?? 0));
  const countLabel = owners ? "Venues" : "Bookings";

  const action = (u) => {
    const locked = lock(u);
    if (locked) return <span className="font-body text-caption text-taupe">{locked}</span>;
    return (
      <button type="button" aria-expanded={confirmId === u._id} aria-label={`Deactivate ${u.name}`} onClick={() => (confirmId === u._id ? close() : open(u._id))} className={dangerLink}>
        Deactivate
      </button>
    );
  };

  const panel = (u) => (
    <ConfirmPanel user={u} pending={pending} error={error} onConfirm={() => confirm(u)} onCancel={close} />
  );

  return (
    <>
      <table className="hidden w-full text-left md:table">
        <caption className="sr-only">{owners ? "Venue owners" : "People with an account"}</caption>
        <thead>
          <tr className="border-b border-line font-body text-eyebrow uppercase text-taupe">
            <th scope="col" className="px-6 py-3 font-medium">{owners ? "Owner" : "Person"}</th>
            <th scope="col" className="px-3 py-3 font-medium">Phone</th>
            {!owners && <th scope="col" className="px-3 py-3 font-medium">Role</th>}
            <th scope="col" className="px-3 py-3 font-medium">Joined</th>
            <th scope="col" className="px-3 py-3 text-right font-medium">{countLabel}</th>
            <th scope="col" className="px-6 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <Fragment key={u._id}>
              <tr className="border-b border-line last:border-0">
                <td className="max-w-[18rem] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Initial name={u.name} />
                    <div className="min-w-0">
                      <p className="truncate font-body text-body text-ink">{u.name}</p>
                      <p className="truncate font-body text-caption text-taupe">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4 font-body text-small text-ink">{u.phone || <span className="text-taupe">Not given</span>}</td>
                {!owners && <td className="px-3 py-4"><Pill tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role] ?? u.role}</Pill></td>}
                <td className="whitespace-nowrap px-3 py-4 font-body text-small text-ink">{shortDate(u.createdAt)}</td>
                <td className="px-3 py-4 text-right font-display text-h5 font-light text-ink">{count(u)}</td>
                <td className="px-6 py-4 text-right">{action(u)}</td>
              </tr>
              {confirmId === u._id && (
                <tr className="border-b border-line last:border-0">
                  <td colSpan={owners ? 5 : 6} className="px-6 pb-4">{panel(u)}</td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-line md:hidden">
        {users.map((u) => (
          <li key={u._id} className="p-4">
            <div className="flex items-start gap-3">
              <Initial name={u.name} />
              <div className="min-w-0 flex-1">
                <p className="break-words font-body text-body text-ink">{u.name}</p>
                <p className="break-all font-body text-caption text-taupe">{u.email}</p>
              </div>
              {!owners && <Pill tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role] ?? u.role}</Pill>}
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-3 font-body text-small">
              <div><dt className="text-eyebrow uppercase text-taupe">Phone</dt><dd className="mt-0.5 break-words text-ink">{u.phone || "Not given"}</dd></div>
              <div><dt className="text-eyebrow uppercase text-taupe">Joined</dt><dd className="mt-0.5 text-ink">{shortDate(u.createdAt)}</dd></div>
              <div><dt className="text-eyebrow uppercase text-taupe">{countLabel}</dt><dd className="mt-0.5 text-ink">{count(u)}</dd></div>
            </dl>
            <div className="mt-3">{action(u)}</div>
            {confirmId === u._id && <div className="mt-3">{panel(u)}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}
