import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchX, Users } from "lucide-react";
import { AuthContext } from "../../auth/AuthProvider";
import { useAdminUser } from "../../hooks/admin/useAdminUser";
import { useDeleteUser } from "../../hooks/admin/useDeleteUser";
import { useDebounce } from "../../hooks/useDebounce";
import UserTable, { Pager, SearchField } from "../../components/admin/UserTable";
import { EmptyState, ErrorState, PageHeader, Panel, RowsSkeleton } from "../../components/dashboard/ui";

const LIMIT = 10;
const ROLES = [
  { value: "", label: "Everyone" },
  { value: "Customer", label: "Customers" },
  { value: "VenueOwner", label: "Venue owners" },
  { value: "Admin", label: "Admins" },
];

export default function AdminUsersPage() {
  const { user: me } = useContext(AuthContext);
  const [params, setParams] = useSearchParams();
  const role = ROLES.some((r) => r.value === params.get("role")) ? params.get("role") : "";
  const urlSearch = params.get("q") ?? "";
  const page = Math.max(parseInt(params.get("page")) || 1, 1);

  // Typing is instant; the URL (and the request) follow half a second later.
  const [text, setText] = useState(urlSearch);
  const search = useDebounce(text.trim(), 400);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (search !== urlSearch) update({ q: search, page: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const { data, isPending, isError, isFetching, refetch } = useAdminUser(page, LIMIT, urlSearch, role);
  const { mutateAsync: deactivate } = useDeleteUser();

  const users = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / LIMIT), 1);
  const filtered = Boolean(urlSearch || role);

  const clear = () => { setText(""); setParams({}, { replace: true }); };

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Users"
        description="Everyone with a Venure account. Deactivating someone signs them out and stops them logging in again."
      />

      <div className="mb-6 flex flex-wrap items-end gap-x-6 gap-y-4">
        <SearchField label="Search people" value={text} onChange={setText} placeholder="Name or email" />
        <div role="group" aria-label="Filter by role" className="flex flex-wrap gap-2">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={role === r.value}
              onClick={() => update({ role: r.value, page: "" })}
              className={`rounded-full border px-4 py-2 font-body text-small transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                role === r.value ? "border-ink bg-ink text-gold-50" : "border-line bg-white text-ink hover:border-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <Panel bodyClassName={`p-0 ${isFetching && !isPending ? "opacity-70" : ""}`}>
        {isPending ? (
          <RowsSkeleton rows={5} />
        ) : isError ? (
          <ErrorState onRetry={refetch}>People could not be loaded right now.</ErrorState>
        ) : users.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={SearchX}
              title={urlSearch ? `No one matches "${urlSearch}"` : "No one in this group"}
              action={<button type="button" onClick={clear} className="font-body text-button uppercase text-gold-800 underline underline-offset-4">Clear filters</button>}
            >
              Check the spelling, or try a different name, email or group.
            </EmptyState>
          ) : (
            <EmptyState icon={Users} title="No accounts yet">People appear here as they register.</EmptyState>
          )
        ) : (
          <>
            <UserTable users={users} currentUserId={me?._id} onDeactivate={deactivate} />
            <Pager page={page} totalPages={totalPages} total={total} limit={LIMIT} noun="people" onPage={(p) => update({ page: p > 1 ? String(p) : "" })} />
          </>
        )}
      </Panel>
    </>
  );
}
