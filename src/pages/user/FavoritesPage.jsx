import { Link } from "react-router-dom";
import { useRequireLogin } from "../../features/inquiry/hooks/useInquiries";
import { useFavorites, usePendingFavorite, useToggleFavorite } from "../../features/favorites/hooks/useFavorites";
import VenueCard, { VenueCardSkeleton } from "../../features/venues/components/VenueCard";
import Button from "../../components/ui/Button";

export default function FavoritesPage() {
  const { ready } = useRequireLogin();
  const favorites = useFavorites();
  const { venues, isPending, isError, refetch } = favorites;
  const toggle = useToggleFavorite();
  usePendingFavorite(favorites, toggle);

  return (
    <div className="bg-cream">
      <div className="container-site pb-24 pt-[calc(var(--spacing-header)+2.5rem)]">
        <p className="font-body text-eyebrow uppercase text-gold-800">Favorites</p>
        <h1 className="mt-2 font-display text-h2 font-light text-ink">Venues you saved</h1>
        <p className="mt-2 max-w-xl font-body text-body text-taupe">Keep a shortlist while you plan, then send a request to the ones you like.</p>

        {!ready || isPending ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <VenueCardSkeleton key={i} />)}</ul>
        ) : isError ? (
          <div role="alert" className="mt-10 max-w-xl rounded-card-xl border border-dashed border-line bg-white p-8">
            <p className="font-display text-h4 font-light text-ink">We could not load your favorites</p>
            <p className="mt-2 font-body text-small text-taupe">Please check your connection and try again.</p>
            <Button type="button" className="mt-5" onClick={() => refetch()}>Try again</Button>
          </div>
        ) : venues.length === 0 ? (
          <div className="mt-10 max-w-xl rounded-card-xl border border-dashed border-line bg-white p-8">
            <p className="font-display text-h4 font-light text-ink">Nothing saved yet</p>
            <p className="mt-2 font-body text-small text-taupe">Tap the heart on any venue to keep it here. Your shortlist is only visible to you.</p>
            <Button to="/venues" arrow className="mt-5">Browse venues</Button>
          </div>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((v) => (
              <VenueCard key={v._id} venue={v} isFavorite onToggleFavorite={toggle.mutate} favoriteBusy={toggle.isPending && toggle.variables === v._id} />
            ))}
          </ul>
        )}
        {venues.length > 0 && (
          <p className="mt-10 font-body text-small text-taupe">
            Looking for something else? <Link to="/venues" className="text-gold-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">See all venues</Link>
          </p>
        )}
      </div>
    </div>
  );
}
