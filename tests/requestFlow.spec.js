// The core journey: a customer asks a venue for a date, the owner quotes it, the customer accepts.
// (Paying the deposit needs a Stripe test key in the frontend, so the test stops at "deposit due".)
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, openVenue } from "./helpers.js";

test.describe.configure({ mode: "serial" });
test.skip(missingCreds("customer", "owner"), "Set the E2E_* environment variables (see tests/helpers.js)");

const VENUE = "Riverside Garden Hall";
const NOTE = `e2e ${Date.now()}`;

test("customer requests a date from a venue", async ({ page }) => {
  await login(page, creds.customer);
  await openVenue(page, VENUE);
  await page.getByRole("button", { name: /request a date/i }).first().click();
  await expect(page).toHaveURL(/\/inquire$/);

  await page.getByRole("button", { name: "Next month" }).click();
  await page.locator('button[aria-label*=" 26 "]:not([disabled])').first().click();
  await page.getByLabel("Night").check({ force: true });
  await page.fill("#guests", "60");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.selectOption("#eventType", "Birthday");
  await page.fill("#notes", NOTE);
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("heading", { name: new RegExp(`Request sent to ${VENUE}`) })).toBeVisible();

  await page.goto("/my-inquiries");
  await expect(page.getByText("Waiting for the venue").first()).toBeVisible();
});

test("the venue owner replies with a quotation", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await login(page, creds.owner);

  await page.goto("/owner/inquiries");
  await page.getByRole("link", { name: /Birthday/ }).first().click();
  await expect(page.getByText(NOTE)).toBeVisible();

  await page.fill("#li-price-0", "50000");
  await page.getByRole("button", { name: "Send quotation" }).click();
  await expect(page.getByText("Quotation sent")).toBeVisible();
  await context.close();
});

test("the customer sees the quotation and accepts it", async ({ page }) => {
  await login(page, creds.customer);
  await page.goto("/my-inquiries");
  await page.getByRole("link", { name: /Birthday/ }).first().click();

  await expect(page.getByRole("heading", { name: "Quotation" })).toBeVisible();
  await expect(page.getByText("NPR 50,000").first()).toBeVisible();
  await page.getByRole("button", { name: /accept and pay deposit/i }).click();
  await expect(page.getByText("Accepted, deposit due").first()).toBeVisible();
});
