// A venue's page: its sections, the section menu, and the way into the request form.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, openVenue, watchErrors } from "./helpers.js";

const VENUE = "Riverside Garden Hall";

test("the venue page has one h1, its sections and no console errors", async ({ page }) => {
  const errors = watchErrors(page);
  await openVenue(page, VENUE);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page).toHaveTitle(new RegExp(VENUE));

  for (const heading of [/About Riverside Garden Hall/, /Choose the space/, /Find your way/, /What guests say/]) {
    await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
  }
  await expect(page.getByRole("region", { name: "Photos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in maps" })).toHaveAttribute("href", /google\.com\/maps/);
  expect(errors()).toEqual([]);
});

test("the section menu jumps to a section and updates the URL hash", async ({ page }) => {
  await openVenue(page, VENUE);
  const nav = page.getByRole("navigation", { name: "Venue sections" });
  await nav.getByRole("link", { name: "Reviews" }).click();
  await expect(page).toHaveURL(/#reviews$/);
  await expect(page.locator("#reviews")).toBeInViewport();
});

test("the photo viewer opens as a dialog, Escape closes it and focus returns to the photo", async ({ page }) => {
  await openVenue(page, VENUE);
  const photo = page.getByRole("button", { name: /Open photo 1 of/ });
  await photo.click();
  const dialog = page.getByRole("dialog", { name: /photos$/ });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(photo).toBeFocused();
});

test("a signed-out visitor who asks for a date signs in and lands on the request form", async ({ page }) => {
  test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");
  await openVenue(page, VENUE);
  const venuePath = new URL(page.url()).pathname;
  await page.getByRole("button", { name: /request a date/i }).first().click();
  await expect(page).toHaveURL(/\/login/);

  await page.fill('input[name="email"]', creds.customer.email);
  await page.fill('input[name="password"]', creds.customer.password);
  await page.getByRole("button", { name: /sign in/i }).first().click();
  await expect(page).toHaveURL(new RegExp(`${venuePath}/inquire$`));
  await expect(page.getByRole("heading", { level: 1, name: "When is your event?" })).toBeVisible();
});

test("a signed-in customer can message the venue and lands in a conversation", async ({ page }) => {
  test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");
  await login(page, creds.customer);
  await openVenue(page, VENUE);
  await page.getByRole("button", { name: "Message the venue" }).click();
  await expect(page).toHaveURL(/\/chat$/);
  await expect(page.getByRole("textbox", { name: "Type your message" })).toBeVisible();
});
