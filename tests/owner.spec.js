// Owner area: every page loads cleanly, tabs and filters work, and the quotation builder's live totals are right.
// Nothing here sends a quotation or changes data (requestFlow.spec.js covers the sending).
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, watchErrors } from "./helpers.js";

test.skip(missingCreds("owner"), "Set the E2E_OWNER_* environment variables (see tests/helpers.js)");

const PAGES = [
  ["/owner/dashboard", /Owner dashboard/],
  ["/owner/venues", /My venues/],
  ["/owner/inquiries", /Inquiries/],
  ["/owner/bookings", /Bookings/],
  ["/owner/analytics", /Analytics/],
  ["/owner/payments", /Payments/],
  ["/owner/reviews", /Reviews/],
  ["/owner/chat", /Messages/],
];

test.beforeEach(async ({ page }) => {
  await login(page, creds.owner);
});

for (const [path, title] of PAGES) {
  test(`${path} loads with one h1, a title, and no errors`, async ({ page }) => {
    const errors = watchErrors(page);
    const serverErrors = [];
    page.on("response", (res) => res.status() >= 500 && serverErrors.push(`${res.status()} ${res.url()}`));
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page).toHaveTitle(title);
    await expect(page.getByRole("main")).toBeVisible();
    expect(errors()).toEqual([]);
    expect(serverErrors).toEqual([]);
  });
}

test("a customer-only address sends the owner to their own dashboard", async ({ page }) => {
  await page.goto("/venues");
  await expect(page).toHaveURL(/\/owner\/dashboard$/);
});

test("the inquiry tabs switch panels and expose their counts", async ({ page }) => {
  await page.goto("/owner/inquiries");
  const tabs = page.getByRole("tablist", { name: "Request status" });
  await expect(tabs.getByRole("tab", { selected: true })).toContainText("Needs a reply");
  const waiting = tabs.getByRole("tab", { name: /^Waiting for customer/ });
  await waiting.click();
  await expect(waiting).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toBeVisible();
});

// Known product bug (owner area): role="tab" buttons do not respond to the arrow keys, so a keyboard user must Tab through every tab.
test.fixme("the inquiry tabs move with the arrow keys", async ({ page }) => {
  await page.goto("/owner/inquiries");
  const tabs = page.getByRole("tablist", { name: "Request status" });
  await tabs.getByRole("tab", { name: /^Waiting for customer/ }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab", { name: /^Booked/ })).toBeFocused();
});

test("the bookings page separates upcoming, completed and cancelled events", async ({ page }) => {
  await page.goto("/owner/bookings");
  const tabs = page.getByRole("tablist", { name: "Booking status" });
  for (const name of [/^Upcoming/, /^Completed/, /^Cancelled/]) {
    await tabs.getByRole("tab", { name }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
  }
});

test.describe("quotation builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/owner/inquiries");
    // Riverside Garden Hall has a space to quote; the seeded Lakeview Pavilion has none
    await page.getByRole("tabpanel").getByRole("link", { name: /Riverside Garden Hall/ }).first().click();
    await expect(page.locator("#li-price-0")).toBeVisible();
  });

  const summary = (page) => page.locator("dl").filter({ hasText: "Deposit now" });
  const amounts = async (page) => {
    const text = (await summary(page).innerText()).replace(/\s+/g, " ");
    const pick = (label) => Number((text.match(new RegExp(`${label}\\s*NPR\\s*([\\d,]+)`)) ?? [])[1]?.replace(/,/g, ""));
    return { total: pick("Total"), deposit: pick("Deposit now"), balance: pick("Balance later") };
  };

  test("total, deposit and balance follow the line items and the deposit setting", async ({ page }) => {
    await page.fill("#li-price-0", "100000");
    await expect.poll(() => amounts(page)).toEqual({ total: 100000, deposit: 20000, balance: 80000 });

    await page.getByRole("button", { name: "50%" }).click();
    await expect.poll(() => amounts(page)).toEqual({ total: 100000, deposit: 50000, balance: 50000 });

    await page.getByRole("button", { name: "Fixed amount" }).click();
    await page.fill("#q-dval", "30000");
    await expect.poll(() => amounts(page)).toEqual({ total: 100000, deposit: 30000, balance: 70000 });

    // A second line, charged per guest
    await page.getByRole("button", { name: "Add a line item" }).click();
    await page.fill("#li-label-1", "Plates");
    await page.fill("#li-price-1", "100");
    await page.locator("#li-guest-1").check();
    await page.fill("#q-guests", "50");
    await expect.poll(() => amounts(page)).toEqual({ total: 105000, deposit: 30000, balance: 75000 });

    await page.getByRole("button", { name: "Remove item 2" }).click();
    await expect.poll(() => amounts(page)).toEqual({ total: 100000, deposit: 30000, balance: 70000 });
  });

  test("it refuses an empty quotation and a deposit outside 10 to 50 percent, without sending", async ({ page }) => {
    await page.getByRole("button", { name: "Send quotation" }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();

    await page.fill("#li-price-0", "100000");
    await page.fill("#q-dval", "5");
    await page.getByRole("button", { name: "Send quotation" }).click();
    await expect(page.getByText("A percentage deposit must be between 10% and 50%.")).toBeVisible();

    await page.getByRole("button", { name: "Fixed amount" }).click();
    await page.fill("#q-dval", "100000");
    await page.getByRole("button", { name: "Send quotation" }).click();
    await expect(page.getByText("A fixed deposit must be more than 0 and less than the total.")).toBeVisible();
    await expect(page).toHaveURL(/\/owner\/inquiries\//);
  });

  test("prices are in NPR and never per hour", async ({ page }) => {
    await expect(page.getByLabel("Price (NPR)").first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/per hour|\/hr|hourly/i);
  });
});
