// A new customer registers (and is signed in straight away), signs out, and signs back in.
import { test, expect } from "@playwright/test";

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
  await page.getByRole("button", { name: "Create my account" }).click();

  // Registration signs you in: the account menu appears in the header
  const menu = page.getByRole("button", { name: "Account menu" });
  await expect(menu).toBeVisible();

  await menu.click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();

  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: /sign in/i }).first().click();
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
});

test("signing in sends you back to the page you were trying to reach", async ({ page }) => {
  await page.goto("/my-bookings");
  await expect(page).toHaveURL(/\/login/);

  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: /sign in/i }).first().click();
  await expect(page).toHaveURL(/\/my-bookings$/);
});
