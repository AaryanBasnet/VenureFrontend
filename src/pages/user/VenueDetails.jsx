import { useContext, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MessageCircle, Phone } from "lucide-react";
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
import { cheapestPlatePrice } from "../../features/venues/venueFormat";
import VenueSectionNav from "../../features/venues/sections/VenueSectionNav";
import VenueReviews from "../../features/venues/sections/VenueReviews";

const contactBtn =
  "inline-flex items-center gap-2 rounded-full border border-gold-50/70 px-6 py-3 font-body text-button uppercase transition-colors hover:bg-gold-50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

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
  const { isAuthenticated, user } = useContext(AuthContext);

  const { data: venue, isPending, isError } = useVenueDetails(id);
  const { data: spaces = [], isPending: spacesPending } = useVenueSpaces(venue?._id);
  const { startChatWith } = useChat(user, venue?._id || null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedDrink, setSelectedDrink] = useState(null);

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
    return (
      <PageMessage title="We could not find this venue">
        <p className="font-body text-body text-taupe">It may have been removed, or the link is wrong.</p>
        <Link to="/venues" className="font-body text-button uppercase text-gold-800 underline underline-offset-4">
          Browse venues
        </Link>
      </PageMessage>
    );
  }

  const maxCapacity = spaces.reduce((max, s) => Math.max(max, s.capacity ?? 0), 0);
  const fromPlate = cheapestPlatePrice(venue);
  const hasMenu = (venue.packages?.length ?? 0) + (venue.drinkOptions?.length ?? 0) > 0;
  const available = ["overview", "spaces", ...(hasMenu ? ["menu"] : []), "location", "reviews"];
  const phoneDigits = (venue.contactPhone ?? "").replace(/[^\d+]/g, "");
  const whatsappNumber = phoneDigits.replace(/^\+/, "");

  // "Check a date" starts the inquiry wizard; a chosen space, package and drink come along as preferences.
  const handleCheckDate = (space) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate(`/venue/${venue._id}/inquire`, {
      state: { spaceId: space?._id, packageId: selectedPackage, drinkId: selectedDrink },
    });
  };

  const handleChatWithOwner = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    const ownerId = venue.owner?._id || venue.owner;
    if (!ownerId) {
      toast.error("Venue owner information unavailable");
      return;
    }
    try {
      const chat = await startChatWith(ownerId);
      navigate("/chat", { state: { chatId: chat._id, currentUserId: user._id, venueId: venue._id } });
    } catch {
      toast.error("Unable to start chat");
    }
  };

  return (
    <div className="pb-24 lg:pb-0">
      <VenueHero
        venue={venue}
        maxCapacity={maxCapacity}
        spaceCount={spaces.length}
        fromPlate={fromPlate}
        onCheckDate={() => handleCheckDate()}
      />
      <VenueSectionNav venueName={venue.venueName} fromPlate={fromPlate} available={available} onCheckDate={() => handleCheckDate()} />
      <VenueGallery images={venue.venueImages} />
      <VenueOverview venue={venue} />
      <VenueSpaces spaces={spaces} isPending={spacesPending} onCheckDate={handleCheckDate} />
      <VenuePackages
        packages={venue.packages}
        drinkOptions={venue.drinkOptions}
        selectedPackage={selectedPackage}
        onSelectPackage={setSelectedPackage}
        selectedDrink={selectedDrink}
        onSelectDrink={setSelectedDrink}
      />

      <section aria-labelledby="ask-title" className="bg-ink py-12 text-gold-50">
        <div className="container-site flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h2 id="ask-title" className="font-display text-h3 font-light">
              Not sure which space fits?
            </h2>
            <p className="mt-2 font-body text-body text-gold-200">
              Ask the venue about dates, menus and capacity before you request.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleChatWithOwner} className={contactBtn}>
              <MessageCircle aria-hidden="true" className="size-4" /> Message the venue
            </button>
            {phoneDigits && (
              <>
                <a href={`tel:${phoneDigits}`} className={contactBtn}>
                  <Phone aria-hidden="true" className="size-4" /> Call
                </a>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello, I am interested in ${venue.venueName} on Venure.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={contactBtn}
                >
                  WhatsApp
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      <VenueLocation venue={venue} />

      <VenueReviews venue={venue} />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 p-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => handleCheckDate()}
          className="w-full rounded-full bg-ink py-3 font-body text-button uppercase text-gold-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Check a date
        </button>
      </div>
    </div>
  );
};

export default VenueDetails;
