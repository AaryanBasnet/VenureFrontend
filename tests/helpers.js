// Shared helpers. Test accounts come from the environment so no credentials live in the repo:
//   E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD   a customer
//   E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD         the owner of "Riverside Garden Hall"
//   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD         an administrator
// The backend must be running against a database that has the seeded venues (npm run seed in VenureBackend).
import { expect } from "@playwright/test";

export const creds = {
  customer: { email: process.env.E2E_CUSTOMER_EMAIL, password: process.env.E2E_CUSTOMER_PASSWORD },
  owner: { email: process.env.E2E_OWNER_EMAIL, password: process.env.E2E_OWNER_PASSWORD },
  admin: { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD },
};

export const missingCreds = (...roles) => roles.some((r) => !creds[r].email || !creds[r].password);

export async function login(page, { email, password }) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  // Enter instead of a click: the Google button loads late and can shift the layout under a click
  await page.press('input[name="password"]', "Enter");
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20000 });
}

// Open a venue's page from the venue list by its name.
export async function openVenue(page, name) {
  await page.goto("/venues");
  await page.getByRole("link", { name }).first().click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

// Known, harmless noise: a signed-out visitor's session check answers 401, and the browser logs it.
// Google's sign-in button also logs a report-only security-policy note about its own frame; that is not our code.
const IGNORED_CONSOLE = [/401 \(Unauthorized\)/, /Failed to load resource.*(401|404)/, /favicon/i, /downloadable font/i, /ResizeObserver/, /Framing 'https:\/\/accounts\.google\.com\/'/];

// Collects JavaScript errors and console errors for a page. Call `errors()` at the end of a test and expect it to be empty.
export function watchErrors(page) {
  const found = [];
  page.on("pageerror", (e) => found.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (!IGNORED_CONSOLE.some((re) => re.test(text))) found.push(`console: ${text.slice(0, 200)}`);
  });
  return () => found;
}

// From a venue's page to its request form ("Request a date").
export async function openInquiryForm(page, name = "Riverside Garden Hall") {
  await openVenue(page, name);
  await page.getByRole("button", { name: /request a date/i }).first().click();
  await expect(page).toHaveURL(/\/inquire$/);
  await expect(page.getByRole("heading", { level: 1, name: "When is your event?" })).toBeVisible();
}

export const dayLabel = (d) =>
  d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// A throwaway browser context for a second user (the owner replying while the customer waits, and so on).
export async function signedInContext(browser, baseURL, account, options = {}) {
  const context = await browser.newContext({ baseURL, ...options });
  const page = await context.newPage();
  await login(page, account);
  return { context, page };
}

// ---- API helpers for the write-path specs (setup and clean-up only; the behaviour under test goes through the UI) ----
export const API_URL = process.env.E2E_API_URL || "http://localhost:5052/api";

// Signs in through the API and returns a request context that carries the session cookies.
export async function apiAs(playwright, account) {
  const ctx = await playwright.request.newContext({ baseURL: API_URL.replace(/\/?$/, "/") });
  const res = await ctx.post("auth/login", { data: { email: account.email, password: account.password } });
  if (!res.ok()) throw new Error(`API sign-in failed (${res.status()})`);
  return ctx;
}

export const unique = (label) => `E2E ${label} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// Soft-deletes every venue of the signed-in owner whose name starts with the prefix.
export async function deleteOwnerVenues(ctx, prefix) {
  const res = await ctx.get("venues/owner/me?limit=50");
  if (!res.ok()) return;
  const body = await res.json();
  for (const v of body.data?.venues ?? []) {
    if (v.venueName.startsWith(prefix)) await ctx.delete(`venues/${v._id}`);
  }
}
