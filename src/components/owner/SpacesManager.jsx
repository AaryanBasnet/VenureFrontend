import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSpace, deactivateSpace, getSpaces, updateSpace } from "../../api/owner/venueApi";
import { apiError } from "../../features/inquiry/hooks/useInquiries";
import { SHIFT_OPTIONS } from "../../features/inquiry/inquiryOptions";

const input = "w-full px-2 py-1.5 text-sm border rounded-md focus:ring-purple-500 focus:outline-none";
const label = "block text-xs font-medium text-gray-600 mb-1";

function SpaceForm({ initial, submitLabel, busy, onSubmit, onCancel }) {
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
    <form onSubmit={submit} className="space-y-2 rounded-md bg-gray-50 p-3" noValidate>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={label}>Name</label>
          <input className={input} placeholder="e.g. Glass Hall" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        </div>
        <div>
          <label className={label}>Capacity (guests)</label>
          <input className={input} type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} disabled={busy} />
        </div>
      </div>
      <div>
        <label className={label}>Description (optional)</label>
        <textarea className={`${input} resize-none`} rows={2} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} />
      </div>
      {error && <p role="alert" className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={busy} className="rounded-md bg-purple-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60">{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:underline">Cancel</button>}
      </div>
    </form>
  );
}

// Halls and areas a customer can book inside one venue. A venue needs at least one before it can send a quotation.
export default function SpacesManager({ venue, onDone }) {
  const qc = useQueryClient();
  const key = ["venue_spaces", venue._id];
  const { data: spaces = [], isPending, isError } = useQuery({ queryKey: key, queryFn: () => getSpaces(venue._id) });
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
    <div className="p-2">
      <h2 className="text-center text-lg font-semibold text-gray-800">Halls &amp; spaces</h2>
      <p className="mb-4 text-center text-xs text-gray-500">{venue.venueName}</p>
      <p className="mb-4 text-xs text-gray-600">
        A space is a hall or area customers can book on its own, such as a Glass Hall or a Pine Lawn. Customers choose one when they send a request, and you quote it.
        Shifts follow the platform hours ({SHIFT_OPTIONS.map((s) => `${s.label} ${s.fallback.startTime}-${s.fallback.endTime}`).join(", ")}).
      </p>

      <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
        {isPending ? (
          <p className="text-sm text-gray-500">Loading spaces...</p>
        ) : isError ? (
          <p className="text-sm text-red-500">Spaces could not be loaded.</p>
        ) : spaces.length === 0 ? (
          <p className="rounded-md border border-dashed border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">No spaces yet. Add at least one so customers can request this venue.</p>
        ) : (
          spaces.map((s) =>
            editing === s._id ? (
              <SpaceForm key={s._id} initial={s} submitLabel="Save" busy={update.isPending} onSubmit={(p) => run(update, { id: s._id, ...p })} onCancel={() => setEditing(null)} />
            ) : (
              <div key={s._id} className="flex items-start justify-between gap-3 rounded-md border border-gray-200 p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                  <p className="text-xs text-gray-500">Up to {s.capacity} guests</p>
                  {s.description && <p className="mt-1 text-xs text-gray-600">{s.description}</p>}
                </div>
                <div className="flex shrink-0 gap-3 text-xs">
                  <button type="button" onClick={() => setEditing(s._id)} className="text-purple-700 hover:underline">Edit</button>
                  {removing === s._id ? (
                    <span className="flex gap-2">
                      <button type="button" onClick={() => run(remove, s._id)} disabled={remove.isPending} className="font-semibold text-red-600 hover:underline">Confirm remove</button>
                      <button type="button" onClick={() => setRemoving(null)} className="text-gray-500 hover:underline">Keep</button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => setRemoving(s._id)} className="text-red-600 hover:underline">Remove</button>
                  )}
                </div>
              </div>
            )
          )
        )}

        <div>
          <p className="mb-2 text-xs font-semibold text-gray-700">Add a space</p>
          <SpaceForm key={spaces.length} submitLabel={create.isPending ? "Adding..." : "Add space"} busy={create.isPending} onSubmit={(p) => run(create, p)} />
        </div>
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
      <div className="mt-4 text-right">
        <button type="button" onClick={onDone} className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Done</button>
      </div>
    </div>
  );
}
