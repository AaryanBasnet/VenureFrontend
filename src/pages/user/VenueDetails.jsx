import { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useGoToLogin } from "../../auth/returnTo";
import { usePageTitle } from "../../utils/usePageTitle";
import { ExternalLink, MessageCircle, Phone } from "lucide-react";
import { toast } from "react-toastify";
import { AuthContext } from "../../auth/AuthProvider";
import { useVenueDetails } from "../../hooks/user/useVenueDetails";
import { useChat } from "../../hooks/useChat";
import { useVenueSpaces } from "../../features/venues/hooks/useVenueSpaces";
import VenueHero from "../../features/venues/sections/VenueHero";
import VenueGallery from "../../features/venues/sections/VenueGallery";
import VenueOverview from "../../features/venues/sections/VenueOverview";
import VenueSpaces from "../../features/venues/sections/VenueSpaces";
import VenueLocation from "../../features/venues/sections/VenueLocation";
import VenuePackages from "../../features/venues/sections/VenuePackages";
import { cheapestPlatePrice, toWhatsAppNumber } from "../../features/venues/venueFormat";
import VenueSectionNav from "../../features/venues/sections/VenueSectionNav";
import VenueReviews from "../../features/venues/sections/VenueReviews";
import VenueMobileBar from "../../features/venues/sections/VenueMobileBar";
import { rememberPendingFavorite, useFavorites, usePendingFavorite, useToggleFavorite } from "../../features/favorites/hooks/useFavorites";

const contactBtn =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-gold-50/70 px-6 py-3 font-body text-button uppercase transition-colors hover:bg-gold-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function PageMessage({ title, children }) {
  return (
    <div className="container-site flex min-h-[60vh] flex-col items-center justify-center gap-4 pt-[var(--spacing-header)] text-center">
      <h1 className="font-display text-h2 font-light text-ink">{title}</h1>
      {children}
    </div>
  );
}

// Venue details, rebuilt from Figma 385:316. Sections that need data the backend
// does not model yet (food packages, FAQ, practical details) are added once it does.
const VenueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const goToLogin = useGoToLogin();
  const { isAuthenticated, user } = useContext(AuthContext);

  const { data: venue, isPending, isError, error, refetch } = useVenueDetails(id);
  const { hash } = useLocation();
  const { data: spaces = [], isPending: spacesPending } = useVenueSpaces(venue?._id);
  const { startChatWith } = useChat(user, venue?._id || null);
  usePageTitle(venue?.venueName ?? (isError ? "Venue not found" : null));
  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite();
  usePendingFavorite(favorites, toggleFavorite);
  const [chatBusy, setChatBusy] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedDrink, setSelectedDrink] = useState(null);

  // Links like /venue/123#reviews arrive before the page has any content, so scroll once the venue has loaded.
  useEffect(() => {
    if (!venue || !hash) return undefined;
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [venue, hash, spacesPending]);

  if (isPending) {
    return (
      <div role="status" aria-label="Loading venue" className="min-h-screen bg-cream">
        <div className="h-[560px] animate-pulse bg-gold-100 lg:h-[640px]" />
        <div className="container-site mt-10 space-y-4">
          <div className="h-8 w-1/3 animate-pulse rounded bg-gold-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-gold-100" />
        </div>
      </div>
    );
  }

  if (isError || !venue) {
    // The server answers 400/404 for an id that does not exist; anything else (no connection, a server error) is worth retrying.
    const missing = [400, 404].includes(error?.response?.status);
    return (
      <PageMessage title={missing ? "We could not find this venue" : "We could not load this venue"}>
        <p role={missing ? undefined : "alert"} className="max-w-md font-body text-body text-taupe">
          {missing ? "It may have been removed, or the link is wrong." : "Please check your connection and try again."}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {!missing && (
            <button type="button" onClick={() => refetch()} className="min-h-11 rounded-full bg-ink px-6 font-body text-button uppercase text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
              Try again
            </button>
          )}
          <Link to="/venues" className="inline-flex min-h-11 items-center font-body text-button uppercase text-gold-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
            Browse venues
          </Link>
        </div>
      </PageMessage>
    );
  }

  const maxCapacity = spaces.reduce((max, s) => Math.max(max, s.capacity ?? 0), 0);
  const fromPlate = cheapestPlatePrice(venue);
  const hasMenu = (venue.packages?.length ?? 0) + (venue.drinkOptions?.length ?? 0) > 0;
  const available = ["overview", "spaces", ...(hasMenu ? ["menu"] : []), "location", "reviews"];
  // Full international number (+977...), so the call and WhatsApp links work from any phone.
  const phoneNumber = toWhatsAppNumber(venue.contactPhone);
  const hasPhone = phoneNumber.length >= 10;
  const isFavorite = favorites.ids.has(venue._id);
  const onToggleFavorite = () => {
    if (favorites.enabled) {
      toggleFavorite.mutate(venue._id);
    } else {
      rememberPendingFavorite(venue._id);
      goToLogin();
    }
  };

  // "Request a date" starts the inquiry wizard; a chosen space, package and drink come along as preferences.
  const handleCheckDate = (space) => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    navigate(`/venue/${venue._id}/inquire`, {
      state: { spaceId: space?._id, packageId: selectedPackage, drinkId: selectedDrink },
    });
  };

  const handleChatWithOwner = async () => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    const ownerId = venue.owner?._id || venue.owner;
    if (!ownerId) {
      toast.error("We could not reach this venue's owner. Please try again later.");
      return;
    }
    if (chatBusy) return;
    setChatBusy(true);
    try {
      const chat = await startChatWith(ownerId);
      navigate("/chat", { state: { chatId: chat._id, currentUserId: user._id, venueId: venue._id } });
    } catch {
      toast.error("We could not start the chat. Please try again.");
    } finally {
      setChatBusy(false);
    }
  };

  return (
    <div>
      <VenueHero
        venue={venue}
        maxCapacity={maxCapacity}
        spaceCount={spaces.length}
        fromPlate={fromPlate}
        onCheckDate={() => handleCheckDate()}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
        favoriteBusy={toggleFavorite.isPending}
      />
      <VenueSectionNav venueName={venue.venueName} fromPlate={fromPlate} available={available} onCheckDate={() => handleCheckDate()} />
      <VenueGallery images={venue.venueImages} venueName={venue.venueName} />
      <VenueOverview venue={venue} />
      <VenueSpaces spaces={spaces} isPending={spacesPending} onCheckDate={handleCheckDate} />
      <VenuePackages
        packages={venue.packages}
        drinkOptions={venue.drinkOptions}
        selectedPackage={selectedPackage}
        onSelectPackage={setSelectedPackage}
        selectedDrink={selectedDrink}
        onSelectDrink={setSelectedDrink}
        onRequest={() => handleCheckDate()}
      />

      <section aria-labelledby="ask-title" className="bg-ink py-12 text-gold-50">
        <div className="container-site flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 id="ask-title" className="font-display text-h3 font-light">
              Questions before you request?
            </h2>
            <p className="mt-2 font-body text-body text-gold-200">
              Ask the venue about dates, menus and capacity before you request.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleChatWithOwner} disabled={chatBusy} className={`${contactBtn} disabled:opacity-60`}>
              <MessageCircle aria-hidden="true" className="size-4" /> Message the venue
            </button>
            {hasPhone && (
              <>
                <a href={`tel:+${phoneNumber}`} className={contactBtn}>
                  <Phone aria-hidden="true" className="size-4" /> Call
                  <span className="sr-only"> the venue</span>
                </a>
                <a
                  href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(`Hello, I am interested in ${venue.venueName} on Venure.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={contactBtn}
                >
                  WhatsApp <ExternalLink aria-hidden="true" className="size-3.5" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      <VenueLocation venue={venue} />

      <VenueReviews venue={venue} />

      <VenueMobileBar fromPlate={fromPlate} onCheckDate={() => handleCheckDate()} />
    </div>
  );
};

export default VenueDetails;
