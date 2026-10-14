// A new customer registers (and is signed in straight away), signs out, and signs back in.
import { test, expect } from "@playwright/test";
import { creds, missingCreds } from "./helpers.js";

test.describe.configure({ mode: "serial" });

const email = `testuser${Date.now()}@example.com`;
const password = "Test1234";

test("a visitor can register, sign out and sign back in", async ({ page }) => {
  await page.goto("/register");
  await page.fill('input[name="name"]', "Test User");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="phone"]', "9812345678");
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirmPassword"]', password);
  await page.check('input[name="agreeToTerms"]');
  const registered = page.waitForResponse((r) => r.url().includes("/auth/register") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Create account" }).click();
  // The server limits how many accounts one address may create per hour; repeated local runs can hit it
  test.skip((await registered).status() === 429, "Registration is rate limited for this address; try again later");

  // Registration signs you in: the account menu appears in the header
  const menu = page.getByRole("button", { name: "Account menu" });
  await expect(menu).toBeVisible({ timeout: 20000 });

  await menu.click();
  // Sign-out is fire-and-forget in the app, so wait for the server to clear the cookie before the next page load
  const loggedOut = page.waitForResponse((r) => r.url().includes("/auth/logout"));
  await page.getByRole("button", { name: "Sign out" }).click();
  await loggedOut;
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();

  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.press('input[name="password"]', "Enter");
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
});

test("signing in sends you back to the page you were trying to reach", async ({ page }) => {
  test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");
  await page.goto("/my-bookings");
  await expect(page).toHaveURL(/\/login/);

  await page.fill('input[name="email"]', creds.customer.email);
  await page.fill('input[name="password"]', creds.customer.password);
  await page.press('input[name="password"]', "Enter");
  await expect(page).toHaveURL(/\/my-bookings$/);
});
