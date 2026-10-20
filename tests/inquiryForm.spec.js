// The request form: calendar (AD and BS, booked days), field validation and keyboard use. Nothing is sent.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, openInquiryForm, openVenue, dayLabel } from "./helpers.js";

test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");

const VENUE = "Riverside Garden Hall";

test.beforeEach(async ({ page }) => {
  await login(page, creds.customer);
});

test("booked days are struck through, announced as booked and cannot be chosen", async ({ page }) => {
  // Make three days from now fully booked, for every space of the venue
  const target = new Date();
  target.setDate(target.getDate() + 3);
  const spaces = new Promise((resolve) => {
    page.on("response", async (res) => {
      if (/\/venues\/[^/]+\/spaces/.test(res.url()) && res.ok()) resolve((await res.json()).data ?? []);
    });
  });
  await page.route("**/venues/*/availability*", async (route) => {
    const list = await spaces;
    const start = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate()) - (5 * 60 + 45) * 60 * 1000;
    await route.fulfill({
      json: { success: true, data: list.map((s) => ({ space: s._id, startTime: new Date(start).toISOString(), endTime: new Date(start + 24 * 3600 * 1000).toISOString() })) },
    });
  });

  await openInquiryForm(page, VENUE);
  const grid = page.getByRole("grid");
  if (target.getMonth() !== new Date().getMonth()) await page.getByRole("button", { name: "Next month" }).click();

  const booked = grid.getByRole("button", { name: `${dayLabel(target)} (already booked)` });
  await expect(booked).toBeVisible();
  await expect(booked).toHaveAttribute("aria-disabled", "true");
  await expect(booked).toHaveCSS("text-decoration-line", "line-through");
  await booked.click({ force: true });
  await expect(booked.locator("..")).toHaveAttribute("aria-selected", "false");
});

test("the calendar switches between English (AD) and Nepali (BS) and shows both dates for a chosen day", async ({ page }) => {
  await openInquiryForm(page, VENUE);
  const ad = page.getByRole("button", { name: /English \(AD\)/ });
  const bs = page.getByRole("group", { name: "Calendar" }).getByRole("button").nth(1);
  await expect(ad).toHaveAttribute("aria-pressed", "true");

  await bs.click();
  await expect(bs).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { level: 3 }).filter({ hasText: /[\d०-९]{4}$/ })).toContainText(
    /बैशाख|जेठ|असार|साउन|भदौ|असोज|कात्तिक|मंसिर|पुस|माघ|फागुन|चैत/, // Nepali months and digits (weekdays stay English)
  );
  const cell = page.getByRole("grid").locator("button:not([aria-disabled])").first();
  await expect(cell).toHaveAttribute("aria-label", /^[०-९]+ (?:बैशाख|जेठ|असार|साउन|भदौ|असोज|कात्तिक|मंसिर|पुस|माघ|फागुन|चैत) [०-९]{4}, /);
  await cell.click();

  // back in English, the chosen day is shown with its Nepali (BS) date beside it
  await ad.click();
  await expect(ad).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText(/ BS$/).last()).toBeVisible();
});

test("calendar keyboard: arrows move between days, Enter picks, today and the past cannot be picked", async ({ page }) => {
  await openInquiryForm(page, VENUE);
  const grid = page.getByRole("grid");
  const first = grid.locator('button[tabindex="0"]');
  await first.focus();
  await expect(first).toBeFocused();
  await page.keyboard.press("ArrowRight");
  const second = grid.locator('button[tabindex="0"]');
  await expect(second).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(second.locator("..")).toHaveAttribute("aria-selected", "true");

  const today = new Date();
  await expect(grid.getByRole("button", { name: new RegExp(`${dayLabel(today)} \\(today`) })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByRole("button", { name: "Previous month" })).toBeDisabled();
});

test("step one asks for a date and sensible guest numbers, and moves focus to the problem", async ({ page }) => {
  await openInquiryForm(page, VENUE);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Choose a date for your event." })).toBeVisible();
  await expect(page.getByRole("grid").locator("button:focus")).toHaveCount(1);

  await page.getByRole("grid").locator("button:not([aria-disabled])").nth(2).click();
  await page.fill("#guests", "9999");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Enter 5,000 guests or fewer.")).toBeVisible();
  await expect(page.locator("#guests")).toBeFocused();

  await page.fill("#guests", "5000");
  await expect(page.getByText(/holds up to|Enter a smaller number/).first()).toBeVisible(); // more than the largest hall

  await page.fill("#guests", "0");
  await expect(page.getByText("Enter how many guests you expect.")).toBeVisible();
});

test("step two lists every missing detail, then accepts valid ones (without sending)", async ({ page }) => {
  await openInquiryForm(page, VENUE);
  await page.getByRole("grid").locator("button:not([aria-disabled])").nth(3).click();
  await page.fill("#guests", "50");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Tell the venue about it" })).toBeFocused();

  await page.fill("#name", "");
  await page.fill("#phone", "");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Choose the type of event.")).toBeVisible();
  await expect(page.getByText("Enter your full name.")).toBeVisible();
  await expect(page.getByText("Enter a phone number the venue can reach you on.")).toBeVisible();

  await page.fill("#phone", "abc");
  await expect(page.getByText(/Enter a valid phone number/)).toBeVisible();
  await page.fill("#phone", "9801234567");
  await expect(page.getByText(/Enter a valid phone number/)).toHaveCount(0);

  // Back keeps what was typed
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "When is your event?" })).toBeFocused();
  await expect(page.locator("#guests")).toHaveValue("50");
});

test("a refresh keeps the form (draft) and the title names the page", async ({ page }) => {
  await openInquiryForm(page, VENUE);
  await expect(page).toHaveTitle(/Request a date/);
  await page.fill("#guests", "77");
  await page.reload();
  await expect(page.locator("#guests")).toHaveValue("77");
});

test("the request form of a venue that does not exist says so", async ({ page }) => {
  await page.goto("/venue/000000000000000000000000/inquire");
  await expect(page.getByRole("heading", { level: 1, name: "We could not find this venue" })).toBeVisible();
});

test("a space's own button opens the form with that space chosen", async ({ page }) => {
  await openVenue(page, VENUE);
  await page.getByRole("button", { name: "Request this space" }).first().click();
  await expect(page).toHaveURL(/\/inquire$/);
  await expect(page.getByRole("radio", { name: /Main Space/ })).toBeChecked();
});
