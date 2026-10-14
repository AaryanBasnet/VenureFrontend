import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar, ClipboardList, Heart, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "react-toastify";
import { useUpdateUserProfile, useUserProfile } from "../../hooks/user/useUserProfile";
import EditProfileModal from "../../components/modal/EditProfileModal";
import Button from "../../components/ui/Button";
import { assetUrl } from "../../utils/assetUrl";

const ACTIVITY = [
  { to: "/my-inquiries", icon: ClipboardList, title: "My inquiries", text: "Requests you sent and the quotations that came back." },
  { to: "/my-bookings", icon: Calendar, title: "My bookings", text: "Confirmed events, deposits and balances." },
  { to: "/favorites", icon: Heart, title: "Favorites", text: "Venues you saved for later." },
];

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("") || "V";

function Detail({ icon: Icon, label, value, onAdd }) {
  return (
    <div className="flex items-start gap-4 border-b border-line py-5 last:border-0">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-800">
        <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
      </span>
      <div className="min-w-0">
        <dt className="font-body text-eyebrow uppercase text-taupe">{label}</dt>
        <dd className="mt-1 break-words font-body text-body text-ink">
          {value || (
            <button type="button" onClick={onAdd} className="text-gold-800 underline underline-offset-4 hover:text-ink">
              Add {label.toLowerCase()}
            </button>
          )}
        </dd>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data, isPending, isError, refetch } = useUserProfile();
  const update = useUpdateUserProfile();
  const [editing, setEditing] = useState(false);

  if (isPending) {
    return (
      <div role="status" aria-label="Loading your profile">
        <div className="h-72 animate-pulse bg-ink/90" />
        <div className="container-site mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="h-80 animate-pulse rounded-card-xl bg-gold-100" />
          <div className="h-80 animate-pulse rounded-card-xl bg-gold-100" />
        </div>
      </div>
    );
  }

  if (isError || !data?.user) {
    return (
      <div className="container-site flex min-h-[60vh] flex-col items-center justify-center gap-4 pt-[var(--spacing-header)] text-center">
        <h1 className="font-display text-h2 font-light text-ink">We could not load your profile</h1>
        <p className="font-body text-body text-taupe">Please check your connection and try again.</p>
        <Button type="button" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const user = data.user;
  const photo = assetUrl(user.avatar);
  const since = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : null;

  const save = async (formData) => {
    try {
      await update.mutateAsync(formData);
      setEditing(false);
      toast.success("Profile updated");
    } catch {
      toast.error("We could not update your profile. Please try again.");
    }
  };

  return (
    <>
      <section aria-labelledby="profile-title" className="relative isolate overflow-hidden bg-ink pb-14 pt-[calc(var(--spacing-header)+3rem)] text-gold-50">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_85%_0%,rgb(184_150_60/0.25),transparent)]" />
        <div className="container-site flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            {photo ? (
              <img src={photo} alt="" className="size-24 shrink-0 rounded-full border-2 border-gold/60 object-cover" />
            ) : (
              <span aria-hidden="true" className="flex size-24 shrink-0 items-center justify-center rounded-full border-2 border-gold/60 bg-gold-100 font-display text-h2 font-light text-gold-800">
                {initials(user.name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="font-body text-eyebrow uppercase text-gold-200">Your account</p>
              <h1 id="profile-title" className="mt-2 truncate font-display text-h2 font-light">{user.name}</h1>
              {since && <p className="mt-1 font-body text-small text-gold-200">Member since {since}</p>}
            </div>
          </div>
          <Button type="button" variant="outline-light" onClick={() => setEditing(true)}>
            Edit profile
          </Button>
        </div>
      </section>

      <section aria-label="Account details" className="bg-cream py-12 lg:py-16">
        <div className="container-site grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="rounded-card-xl border border-line bg-white p-6 sm:p-8">
            <h2 className="font-display text-h3 font-light text-ink">Your details</h2>
            <dl className="mt-4">
              <Detail icon={Mail} label="Email" value={user.email} />
              <Detail icon={Phone} label="Phone" value={user.phone} onAdd={() => setEditing(true)} />
              <Detail icon={MapPin} label="Address" value={user.address} onAdd={() => setEditing(true)} />
            </dl>
            <p className="mt-4 font-body text-caption text-taupe">Your name and phone number are prefilled when you send a venue a request.</p>
          </div>

          <aside aria-label="Your activity">
            <h2 className="font-display text-h3 font-light text-ink">Your activity</h2>
            <ul className="mt-4 space-y-3">
              {ACTIVITY.map(({ to, icon: Icon, title, text }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group flex items-center gap-4 rounded-card-lg border border-line bg-white p-5 transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-800">
                      <Icon aria-hidden="true" className="size-5" strokeWidth={1.5} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-h5 font-normal text-ink">{title}</span>
                      <span className="block font-body text-small text-taupe">{text}</span>
                    </span>
                    <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-taupe transition-transform group-hover:translate-x-1 group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      {editing && <EditProfileModal user={user} onClose={() => setEditing(false)} onSubmit={save} isLoading={update.isPending} />}
    </>
  );
}
