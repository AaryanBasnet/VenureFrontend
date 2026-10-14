// Shared helpers. Test accounts come from the environment so no credentials live in the repo:
//   E2E_CUSTOMER_EMAIL / E2E_CUSTOMER_PASSWORD   a customer
//   E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD         the owner of "Riverside Garden Hall"
// The backend must be running against a database that has the seeded venues (npm run seed in VenureBackend).
import { expect } from "@playwright/test";

export const creds = {
  customer: { email: process.env.E2E_CUSTOMER_EMAIL, password: process.env.E2E_CUSTOMER_PASSWORD },
  owner: { email: process.env.E2E_OWNER_EMAIL, password: process.env.E2E_OWNER_PASSWORD },
};

export const missingCreds = (...roles) => roles.some((r) => !creds[r].email || !creds[r].password);

export async function login(page, { email, password }) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: /sign in/i }).first().click();
  await expect(page).not.toHaveURL(/\/login/);
}

// Open a venue's page from the venue list by its name.
export async function openVenue(page, name) {
  await page.goto("/venues");
  await page.getByRole("link", { name }).first().click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}
