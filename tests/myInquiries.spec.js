// "My inquiries": the filter buttons, their counts, empty states and the way into a request.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, watchErrors } from "./helpers.js";

test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");

test.beforeEach(async ({ page }) => {
  await login(page, creds.customer);
  await page.goto("/my-inquiries");
  await expect(page.getByRole("heading", { level: 1, name: "Your requests to venues" })).toBeVisible();
});

test("the page has one h1, a title and no console errors", async ({ page }) => {
  const errors = watchErrors(page);
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page).toHaveTitle(/My inquiries/);
  expect(errors()).toEqual([]);
});

test("each filter button shows as many requests as its count says", async ({ page }) => {
  const group = page.getByRole("group", { name: "Filter requests" });
  const buttons = group.getByRole("button");
  await expect(buttons.first()).toBeVisible();
  const n = await buttons.count();
  expect(n).toBe(5);
  for (let i = 0; i < n; i++) {
    const button = buttons.nth(i);
    const count = Number((await button.innerText()).match(/(\d+)\s*$/)?.[1] ?? NaN);
    expect(Number.isNaN(count), "every filter shows a count").toBe(false);
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    // Exactly one filter is pressed at a time
    await expect(group.locator('button[aria-pressed="true"]')).toHaveCount(1);
    // The list comes ten at a time; the count on the button is the size of the whole filter
    await expect(page.getByRole("main").getByRole("listitem").filter({ has: page.getByRole("link") })).toHaveCount(Math.min(count, 10));
  }
});

test("an empty filter explains itself instead of showing a blank page", async ({ page }) => {
  const group = page.getByRole("group", { name: "Filter requests" });
  const closed = group.getByRole("button", { name: /^Closed/ });
  const count = Number((await closed.innerText()).match(/(\d+)\s*$/)?.[1]);
  test.skip(count > 0, "the seeded account has closed requests, so this filter is not empty");
  await closed.click();
  await expect(page.getByRole("main").getByRole("listitem").filter({ has: page.getByRole("link") })).toHaveCount(0);
  await expect(page.getByRole("main")).toContainText(/nothing|no requests|no inquiries/i);
});

test("opening a request shows its detail page with a way back", async ({ page }) => {
  await page.getByRole("main").getByRole("link").filter({ hasText: /Riverside|Pavilion|Hall|Lodge|Centre|Ballroom/ }).first().click();
  await expect(page).toHaveURL(/\/my-inquiries\/[0-9a-f]{24}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page).toHaveTitle(/Your request/);
  await page.goBack();
  await expect(page).toHaveURL(/\/my-inquiries$/);
});

test("a request id that does not exist says so", async ({ page }) => {
  await page.goto("/my-inquiries/000000000000000000000000");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /my inquiries|all requests|back/i }).first()).toBeVisible();
});

test("a long list comes in pages, and the next page shows the rest", async ({ page }) => {
  const all = page.getByRole("group", { name: "Filter requests" }).getByRole("button").first();
  await expect(all).toBeVisible();
  const total = Number((await all.innerText()).match(/(\d+)\s*$/)?.[1]);
  test.skip(total <= 10, "the seeded account has one page of requests");
  const rows = page.getByRole("main").getByRole("listitem").filter({ has: page.getByRole("link") });
  await expect(rows).toHaveCount(10);
  await expect(page.getByText(`of ${total} requests`)).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  await expect(rows).toHaveCount(Math.min(total - 10, 10));
});
