import { useState, useContext, useCallback } from "react";
import { ArrowLeft, Building2, LayoutGrid, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthProvider";
import VenueRegisterForm from "../../components/owner/venueRegistrationForm";
import SpacesManager from "../../components/owner/SpacesManager";
import { EmptyState, ErrorState, PageHeader, Panel, Pill } from "../../components/owner/ui";
import { btnDanger, btnOutline, btnPrimary, npr } from "../../components/owner/ownerStyles";
import { useVenuesByOwner } from "../../hooks/owner/useVenuesByOwner";
import { deleteVenue } from "../../api/owner/venueApi";
import { sanitizeVenue } from "../../utils/sanitizeVenue";

const STATUS_TONE = { approved: "success", pending: "gold", rejected: "danger" };
const STATUS_LABEL = { approved: "Approved", pending: "Pending review", rejected: "Rejected" };

const iconBtn =
  "inline-flex items-center gap-1.5 font-body text-small text-ink underline underline-offset-4 hover:text-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-50";

function VenueRow({ venue, onEdit, onSpaces, onDelete, isDeleting }) {
  const [confirming, setConfirming] = useState(false);
  const image = venue.venueImages?.[0]?.url;
  const prices = (venue.packages ?? []).map((p) => Number(p.pricePerPlate)).filter((n) => n > 0);
  const cheapest = prices.length ? Math.min(...prices) : 0;
  const place = [venue.location?.city, venue.location?.country].filter(Boolean).join(", ");
  const status = String(venue.status).toLowerCase();
  const amenities = venue.amenities ?? [];

  return (
    <li className="overflow-hidden rounded-card-lg border border-line bg-white">
      <div className="flex flex-col sm:flex-row">
        <div className="h-44 shrink-0 bg-gold-100 sm:h-auto sm:w-56">
          {image ? (
            <img src={image} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Building2 aria-hidden="true" className="size-8 text-gold-800" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="min-w-0 break-words font-display text-h4 font-light text-ink">{venue.venueName}</h2>
            <Pill tone={STATUS_TONE[status] ?? "neutral"}>{STATUS_LABEL[status] ?? venue.status}</Pill>
          </div>

          <p className="mt-2 line-clamp-2 break-words font-body text-small text-taupe">{venue.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-body text-small text-taupe">
            {place && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-4 text-gold-800" strokeWidth={1.5} /> {place}
              </span>
            )}
            {Number(venue.averageRating) > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Star aria-hidden="true" className="size-4 text-gold-800" strokeWidth={1.5} /> {venue.averageRating} rating
              </span>
            )}
          </div>

          <p className="mt-3 font-body text-small text-ink">
            {cheapest > 0 ? `Packages from ${npr(cheapest)} per plate` : "No food packages yet"}
          </p>

          {amenities.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Amenities">
              {amenities.slice(0, 4).map((a) => (
                <li key={a}><Pill>{a}</Pill></li>
              ))}
              {amenities.length > 4 && <li><Pill>+{amenities.length - 4} more</Pill></li>}
            </ul>
          )}

          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-5">
            <button type="button" onClick={() => onSpaces(venue)} className={iconBtn}>
              <LayoutGrid aria-hidden="true" className="size-4" strokeWidth={1.5} /> Halls &amp; spaces
            </button>
            <button type="button" onClick={() => onEdit(venue)} className={iconBtn} aria-label={`Edit ${venue.venueName}`}>
              <Pencil aria-hidden="true" className="size-4" strokeWidth={1.5} /> Edit
            </button>
            {!confirming && (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={isDeleting}
                aria-label={`Delete ${venue.venueName}`}
                className="inline-flex items-center gap-1.5 font-body text-small text-red-700 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:opacity-50"
              >
                <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.5} /> Delete
              </button>
            )}
          </div>

          {confirming && (
            <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 rounded-card-sm bg-red-50 p-3">
              <p className="mr-auto min-w-0 break-words font-body text-small text-red-700">
                Delete {venue.venueName}? This is permanent and cannot be undone.
              </p>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  onDelete();
                  setConfirming(false);
                }}
                className={btnDanger}
              >
                {isDeleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className={btnOutline}>
                Keep it
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function VenueListSkeleton() {
  return (
    <div role="status" aria-label="Loading venues" className="space-y-5">
      {[0, 1].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-card-lg border border-line bg-gold-100" />
      ))}
    </div>
  );
}

const OwnerVenuePage = () => {
  const { user } = useContext(AuthContext);
  const {
    data: venues = [],
    isLoading,
    error,
    refetch,
  } = useVenuesByOwner(user?._id);

  // view: "list" | "form" (create or edit) | "spaces"
  const [view, setView] = useState("list");
  const [editVenue, setEditVenue] = useState(null);
  const [spacesVenue, setSpacesVenue] = useState(null);
  const [deletingVenueId, setDeletingVenueId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const backToList = useCallback(() => {
    setView("list");
    setEditVenue(null);
    setSpacesVenue(null);
  }, []);

  // After creating a venue, go straight to adding its first space so customers can request it.
  const handleAddVenueSuccess = useCallback(
    async (created) => {
      setEditVenue(null);
      if (created?._id) {
        setSpacesVenue(created);
        setView("spaces");
      } else {
        setView("list");
      }
      await refetch();
    },
    [refetch]
  );

  const handleUpdateVenueSuccess = useCallback(async () => {
    setIsUpdating(true);
    try {
      backToList();
      toast.success("Venue saved.");
      await refetch();
    } catch {
      // refetch errors are non-fatal; the form is already closed
    } finally {
      setIsUpdating(false);
    }
  }, [refetch, backToList]);

  const handleDeleteVenue = useCallback(
    async (venueId) => {
      setDeletingVenueId(venueId);
      try {
        await deleteVenue(venueId);
        await refetch();
      } catch {
        toast.error("We could not delete this venue. Please try again.");
      } finally {
        setDeletingVenueId(null);
      }
    },
    [refetch]
  );

  const openSpaces = useCallback((venue) => {
    setEditVenue(null);
    setSpacesVenue(venue);
    setView("spaces");
  }, []);

  const handleAddVenueClick = useCallback(() => {
    setEditVenue(null);
    setView("form");
  }, []);

  const openEditModal = useCallback((venue) => {
    setEditVenue(venue);
    setView("form");
  }, []);

  const backButton = (
    <button type="button" onClick={backToList} disabled={isUpdating} className={btnOutline}>
      <ArrowLeft aria-hidden="true" className="size-4" /> All venues
    </button>
  );

  if (view === "spaces" && spacesVenue) {
    return (
      <>
        <PageHeader
          eyebrow="Venues"
          title="Halls & spaces"
          description={spacesVenue.venueName}
          actions={backButton}
        />
        <Panel>
          <SpacesManager key={spacesVenue._id} venue={spacesVenue} onDone={backToList} />
        </Panel>
      </>
    );
  }

  if (view === "form") {
    return (
      <>
        <PageHeader
          eyebrow="Venues"
          title={editVenue ? "Edit venue" : "Add a venue"}
          description={editVenue ? editVenue.venueName : "Tell customers about your venue. You can add halls and spaces right after."}
          actions={backButton}
        />
        <Panel bodyClassName="p-5 sm:p-8">
          {/* key forces a remount when switching between create and edit */}
          <VenueRegisterForm
            key={editVenue ? `edit-${editVenue._id}` : "create"}
            onSuccess={editVenue ? handleUpdateVenueSuccess : handleAddVenueSuccess}
            mode={editVenue ? "edit" : "create"}
            initialData={editVenue}
          />
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Venues"
        title="My venues"
        description="Manage your listings, their halls and spaces, and what customers see."
        actions={
          <button type="button" onClick={handleAddVenueClick} disabled={isUpdating} className={btnPrimary}>
            <Plus aria-hidden="true" className="size-4" /> Add venue
          </button>
        }
      />

      {isLoading ? (
        <VenueListSkeleton />
      ) : error ? (
        <Panel>
          <ErrorState onRetry={() => refetch()}>We could not load your venues. Please try again.</ErrorState>
        </Panel>
      ) : venues.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Building2}
            title="No venues yet"
            action={
              <button type="button" onClick={handleAddVenueClick} className={btnPrimary}>
                <Plus aria-hidden="true" className="size-4" /> Add your first venue
              </button>
            }
          >
            Add a venue and customers can find it, send requests and book.
          </EmptyState>
        </Panel>
      ) : (
        <ul className="space-y-5">
          {venues.map((rawVenue) => {
            const venue = sanitizeVenue(rawVenue);
            return (
              <VenueRow
                key={venue._id}
                venue={venue}
                onEdit={openEditModal}
                onSpaces={openSpaces}
                onDelete={() => handleDeleteVenue(venue._id)}
                isDeleting={deletingVenueId === venue._id}
              />
            );
          })}
        </ul>
      )}
    </>
  );
};

export default OwnerVenuePage;
