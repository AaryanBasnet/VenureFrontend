import { useId, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, Users } from "lucide-react";
import { createSpace, deactivateSpace, getSpaces, updateSpace } from "../../api/owner/venueApi";
import { apiError } from "../../features/inquiry/hooks/useInquiries";
import { SHIFT_OPTIONS } from "../../features/inquiry/inquiryOptions";
import { inputClass, labelClass } from "../ui/formStyles";
import { btnDanger, btnOutline, btnPrimary } from "../dashboard/styles";
import { EmptyState, ErrorState, RowsSkeleton } from "../dashboard/ui";

const linkBtn =
  "font-body text-small text-ink underline underline-offset-4 hover:text-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";

function SpaceForm({ initial, submitLabel, busy, onSubmit, onCancel }) {
  const uid = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Give the space a name (at least 2 letters).");
    if (!(Number(capacity) >= 1)) return setError("Enter how many guests it holds.");
    setError("");
    onSubmit({ name: name.trim(), capacity: Number(capacity), description: description.trim() || undefined });
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-card-md bg-cream p-4 sm:p-5" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor={`${uid}-name`} className={labelClass}>Name</label>
          <input id={`${uid}-name`} className={inputClass} placeholder="e.g. Glass Hall" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        </div>
        <div>
          <label htmlFor={`${uid}-cap`} className={labelClass}>Capacity (guests)</label>
          <input id={`${uid}-cap`} className={inputClass} type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={busy} />
        </div>
      </div>
      <div>
        <label htmlFor={`${uid}-desc`} className={labelClass}>Description (optional)</label>
        <textarea id={`${uid}-desc`} className={`${inputClass} resize-none`} rows={2} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} />
      </div>
      {error && <p role="alert" className="font-body text-small text-red-700">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={busy} className={btnPrimary}>{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} className={btnOutline}>Cancel</button>}
      </div>
    </form>
  );
}

// Halls and areas a customer can book inside one venue. A venue needs at least one before it can send a quotation.
export default function SpacesManager({ venue, onDone }) {
  const qc = useQueryClient();
  const key = ["venue_spaces", venue._id];
  const { data: spaces = [], isPending, isError, refetch } = useQuery({ queryKey: key, queryFn: () => getSpaces(venue._id) });
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [error, setError] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const create = useMutation({ mutationFn: (p) => createSpace({ venueId: venue._id, ...p }), onSuccess: refresh });
  const update = useMutation({ mutationFn: updateSpace, onSuccess: () => { setEditing(null); refresh(); } });
  const remove = useMutation({ mutationFn: deactivateSpace, onSuccess: () => { setRemoving(null); refresh(); } });

  const run = async (mutation, arg) => {
    setError("");
    try {
      await mutation.mutateAsync(arg);
    } catch (e) {
      setError(apiError(e));
    }
  };

  return (
    <div>
      <p className="font-body text-small text-taupe">
        A space is a hall or area customers can book on its own, such as a Glass Hall or a Pine Lawn. Customers choose one when they send a request, and you quote it.
        Shifts follow the platform hours ({SHIFT_OPTIONS.map((s) => `${s.label} ${s.fallback.startTime}-${s.fallback.endTime}`).join(", ")}).
      </p>

      <div className="mt-6">
        {isPending ? (
          <RowsSkeleton rows={2} />
        ) : isError ? (
          <ErrorState onRetry={refetch}>Spaces could not be loaded.</ErrorState>
        ) : spaces.length === 0 ? (
          <div className="rounded-card-md border border-dashed border-border-strong">
            <EmptyState icon={LayoutGrid} title="No spaces yet">
              Add at least one so customers can request {venue.venueName}.
            </EmptyState>
          </div>
        ) : (
          <ul className="space-y-3">
            {spaces.map((s) =>
              editing === s._id ? (
                <li key={s._id}>
                  <SpaceForm initial={s} submitLabel="Save" busy={update.isPending} onSubmit={(p) => run(update, { id: s._id, ...p })} onCancel={() => setEditing(null)} />
                </li>
              ) : (
                <li key={s._id} className="rounded-card-md border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-display text-h5 font-light text-ink">{s.name}</p>
                      <p className="mt-1 flex items-center gap-1.5 font-body text-small text-taupe">
                        <Users aria-hidden="true" className="size-4 text-gold-800" strokeWidth={1.5} /> Up to {s.capacity} guests
                      </p>
                      {s.description && <p className="mt-2 break-words font-body text-small text-taupe">{s.description}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <button type="button" onClick={() => setEditing(s._id)} className={linkBtn}>Edit</button>
                      {removing !== s._id && (
                        <button type="button" onClick={() => setRemoving(s._id)} className="font-body text-small text-red-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700">Remove</button>
                      )}
                    </div>
                  </div>
                  {removing === s._id && (
                    <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-card-sm bg-red-50 p-3">
                      <p className="mr-auto font-body text-small text-red-700">Remove {s.name}? Customers will no longer be able to pick it.</p>
                      <button type="button" onClick={() => run(remove, s._id)} disabled={remove.isPending} className={btnDanger}>Yes, remove</button>
                      <button type="button" onClick={() => setRemoving(null)} className={btnOutline}>Keep</button>
                    </div>
                  )}
                </li>
              )
            )}
          </ul>
        )}
      </div>

      <div className="mt-8">
        <h3 className="mb-3 font-display text-h5 font-light text-ink">Add a space</h3>
        <SpaceForm key={spaces.length} submitLabel={create.isPending ? "Adding..." : "Add space"} busy={create.isPending} onSubmit={(p) => run(create, p)} />
      </div>

      {error && <p role="alert" className="mt-4 font-body text-small text-red-700">{error}</p>}
      <div className="mt-8 flex justify-end border-t border-line pt-5">
        <button type="button" onClick={onDone} className={btnPrimary}>Done</button>
      </div>
    </div>
  );
}
