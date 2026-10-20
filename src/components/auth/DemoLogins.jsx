import { Building2, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { useDemoLogin } from "../../hooks/auth/useDemoLogin";

const ROLES = [
  { role: "customer", Icon: UserRound, title: "Customer", text: "Browse venues and send a request" },
  { role: "owner", Icon: Building2, title: "Venue owner", text: "Inbox, quotations, bookings and earnings" },
  { role: "admin", Icon: ShieldCheck, title: "Admin", text: "Applications, venues, users and reviews" },
];

// Lets a visitor see every side of Venure without signing up. The server makes these sessions read-only.
export default function DemoLogins() {
  const { mutate, isPending, variables } = useDemoLogin();

  return (
    <section aria-labelledby="demo-heading" className="w-full rounded-2xl border border-line bg-white p-5">
      <h2 id="demo-heading" className="font-display text-h5 font-normal text-ink">Just looking around?</h2>
      <p className="mt-1 font-body text-small text-taupe">Open a demo in one click. Nothing to sign up for, and nothing you do can change real data.</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {ROLES.map(({ role, Icon, title, text }) => {
          const loading = isPending && variables === role;
          return (
            <li key={role}>
              <button
                type="button"
                onClick={() => mutate(role)}
                disabled={isPending}
                aria-busy={loading}
                className="flex h-full min-h-11 w-full cursor-pointer flex-col items-start gap-1 rounded-xl border border-border-strong px-4 py-3 text-left transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center gap-2 font-body text-small font-medium text-ink">
                  {loading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Icon aria-hidden="true" className="size-4 text-gold-800" />}
                  {title}
                </span>
                <span className="font-body text-caption text-taupe">{text}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
