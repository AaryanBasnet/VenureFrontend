import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Info, SearchX, UserCog } from "lucide-react";
import { AuthContext } from "../../auth/AuthProvider";
import { useAdminUser } from "../../hooks/admin/useAdminUser";
import { useDeleteUser } from "../../hooks/admin/useDeleteUser";
import { useOwnerVenueCounts } from "../../hooks/admin/useOwnerVenueCounts";
import { useDebounce } from "../../hooks/useDebounce";
import OwnerTable from "../../components/admin/ownerTable";
import { Pager, SearchField } from "../../components/admin/UserTable";
import { EmptyState, ErrorState, PageHeader, Panel, RowsSkeleton } from "../../components/dashboard/ui";

const LIMIT = 10;

// Admins cannot create owner accounts: the server only has the public sign-up, which would
// log the admin in as the new person. Owners join themselves, so this page lists them instead.
function HowOwnersJoin() {
  return (
    <aside className="mb-6 flex gap-3 rounded-card-lg border border-line bg-white p-5">
      <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-gold-800" strokeWidth={1.5} />
      <div className="font-body text-small text-taupe">
        <p className="text-ink">How venue owners join</p>
        <p className="mt-1">
          Owners create their own account: they register on the Venure sign-up page and choose "Venue owner". They appear here straight away and can list venues for your review.
          Admins cannot create owner accounts for them.
        </p>
      </div>
    </aside>
  );
}

export default function AdminVenueOwnerPage() {
  const { user: me } = useContext(AuthContext);
  const [params, setParams] = useSearchParams();
  const urlSearch = params.get("q") ?? "";
  const page = Math.max(parseInt(params.get("page")) || 1, 1);

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

  const { data, isPending, isError, isFetching, refetch } = useAdminUser(page, LIMIT, urlSearch, "VenueOwner");
  const { data: venueData } = useOwnerVenueCounts();
  const { mutateAsync: deactivate } = useDeleteUser();

  const owners = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(Math.ceil(total / LIMIT), 1);

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Venue owners"
        description="The people who list venues on Venure, with how many venues each has."
      />
      <HowOwnersJoin />

      <div className="mb-6">
        <SearchField label="Search owners" value={text} onChange={setText} placeholder="Name or email" />
      </div>

      <Panel bodyClassName={`p-0 ${isFetching && !isPending ? "opacity-70" : ""}`}>
        {isPending ? (
          <RowsSkeleton rows={4} />
        ) : isError ? (
          <ErrorState onRetry={refetch}>Venue owners could not be loaded right now.</ErrorState>
        ) : owners.length === 0 ? (
          urlSearch ? (
            <EmptyState
              icon={SearchX}
              title={`No owner matches "${urlSearch}"`}
              action={<button type="button" onClick={() => { setText(""); setParams({}, { replace: true }); }} className="font-body text-button uppercase text-gold-800 underline underline-offset-4">Clear search</button>}
            >
              Check the spelling, or try a name or email.
            </EmptyState>
          ) : (
            <EmptyState icon={UserCog} title="No venue owners yet">
              Owners appear here once someone registers and chooses "Venue owner" on the sign-up page.
            </EmptyState>
          )
        ) : (
          <>
            <OwnerTable
              users={owners}
              currentUserId={me?._id}
              venueCounts={venueData?.counts ?? null}
              onDeactivate={deactivate}
            />
            <Pager page={page} totalPages={totalPages} total={total} limit={LIMIT} noun="owners" onPage={(p) => update({ page: p > 1 ? String(p) : "" })} />
            {venueData && !venueData.complete && (
              <p className="border-t border-line px-6 py-3 font-body text-caption text-taupe">Venue counts cover the 50 most recent venues only.</p>
            )}
          </>
        )}
      </Panel>
    </>
  );
}
