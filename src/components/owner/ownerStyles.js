// Formatting helpers and button classes shared by the owner pages.

export const npr = (n) => `NPR ${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

const dateFmt = { day: "numeric", month: "short", year: "numeric" };
export const shortDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB", dateFmt) : "");

// Buttons for owner screens (same pill language as the customer site, a little smaller).
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-2.5 font-body text-button uppercase text-gold-50 transition-colors hover:bg-gold-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50";
export const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border-strong px-6 py-2.5 font-body text-button uppercase text-ink transition-colors hover:border-ink hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-full border border-red-300 px-6 py-2.5 font-body text-button uppercase text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50";
