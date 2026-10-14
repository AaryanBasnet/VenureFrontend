// A paid booking from every side: the customer and owner both see it, the owner records the balance, the customer cancels
// (refund tier text and the pending refund payment), the owner cancels or completes it, then the review travels
// customer -> owner -> admin -> landing page.
// A real eSewa payment cannot be made in a test, so each booking is inserted into the LOCAL database the way the payment
// verification leaves it (see world.js).
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, watchErrors } from "./helpers.js";
import { dbAvailable } from "./db.js";
import { createWorld, npr } from "./world.js";

test.skip(missingCreds("customer", "owner", "admin"), "Set the E2E_CUSTOMER_*, E2E_OWNER_* and E2E_ADMIN_* environment variables (see tests/helpers.js)");
test.skip(!dbAvailable, "The local test database is not reachable (set E2E_MONGO_URL to a local MongoDB)");

let world;
let n = 0;
const tag = () => `Case ${Date.now().toString(36)}${++n}`;
// Each booking sits on its own day so none of them collide
let day = 60;
const nextDay = () => (day += 2);

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  world = await createWorld(playwright, "Life");
});

test.afterAll(async () => {
  await world?.dispose();
});

const entry = (page, text) => page.getByRole("listitem").filter({ hasText: text });

test("a paid booking shows for the customer and for the owner, with the right amounts", async ({ page, browser, baseURL }) => {
  const errors = watchErrors(page);
  const eventType = tag();
  await world.booked("customer", { days: nextDay(), eventType, price: 120000, deposit: 25 });

  await login(page, creds.customer);
  await page.goto("/my-bookings");
  const mine = entry(page, eventType);
  await expect(mine).toBeVisible();
  await expect(mine.getByText("Confirmed")).toBeVisible();
  await expect(mine).toContainText(world.venueName);
  await expect(mine).toContainText("Glass Hall");
  await expect(mine).toContainText(npr(120000));
  await expect(mine.getByText("Deposit paid on eSewa")).toBeVisible();
  await expect(mine).toContainText(npr(30000));
  await expect(mine).toContainText(npr(90000));
  await expect(mine).not.toContainText(/per hour|hourly/i);
  expect(errors()).toEqual([]);

  const ctx = await browser.newContext({ baseURL });
  const ownerPage = await ctx.newPage();
  await login(ownerPage, creds.owner);
  await ownerPage.goto("/owner/bookings");
  const theirs = entry(ownerPage, eventType);
  await expect(theirs).toBeVisible();
  await expect(theirs).toContainText("Glass Hall");
  await expect(theirs).toContainText(npr(120000));
  await expect(theirs).toContainText("Deposit received");
  await expect(theirs).toContainText("Not yet received");
  await ctx.close();
});

test("the owner records the balance as received, and the customer sees it settled", async ({ page, browser, baseURL }) => {
  const eventType = tag();
  const { bookingId } = await world.booked("customer", { days: nextDay(), eventType });

  await login(page, creds.owner);
  await page.goto("/owner/bookings");
  const card = entry(page, eventType);
  await card.getByRole("button", { name: "Record balance received" }).click();
  await card.getByRole("combobox", { name: "Paid by" }).click();
  await page.getByRole("option", { name: "Bank transfer" }).click();
  await card.getByLabel("Note (optional)").fill("slip 123");
  await card.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Balance recorded")).toBeVisible();
  await expect(card).toContainText("Received (Bank transfer - slip 123)");
  await expect(card.getByRole("button", { name: "Record balance received" })).toHaveCount(0);
  const saved = await world.booking(bookingId);
  expect(saved.balanceSettled).toBe(true);
  expect(saved.balanceSettledMethod).toBe("Bank transfer - slip 123");

  const ctx = await browser.newContext({ baseURL });
  const mine = await ctx.newPage();
  await login(mine, creds.customer);
  await mine.goto("/my-bookings");
  await expect(entry(mine, eventType)).toContainText("settled");
  await ctx.close();
});

test.describe("the customer cancels", () => {
  // days ahead, refund percent now, text the page shows
  const CASES = [
    { days: 80, percent: 100, text: /refunds 100% of your deposit: NPR 20,000 of NPR 20,000/ },
    { days: 22, percent: 75, text: /refunds 75% of your deposit: NPR 15,000 of NPR 20,000/ },
    { days: 11, percent: 50, text: /refunds 50% of your deposit: NPR 10,000 of NPR 20,000/ },
    { days: 3, percent: 0, text: /deposit is not refunded/ },
  ];
  for (const c of CASES) {
    test(`${c.days} days before the event the refund is ${c.percent}%`, async ({ page }) => {
      const eventType = tag();
      const { bookingId } = await world.booked("customer", { days: c.days, eventType });

      await login(page, creds.customer);
      await page.goto("/my-bookings");
      const card = entry(page, eventType);
      await card.getByRole("button", { name: "Cancel this booking" }).click();
      await expect(card).toContainText(c.text);
      // The row for today's tier is marked, and the table lists every tier
      const table = card.getByRole("table", { name: "Refund by how early you cancel" });
      await expect(table.getByRole("row")).toHaveCount(5);
      await expect(table.getByRole("row", { name: /\(now\)/ })).toContainText(`${c.percent}%`);

      // Keep it changes nothing
      await card.getByRole("button", { name: "Keep it" }).click();
      expect((await world.booking(bookingId)).status).toBe("confirmed");

      await card.getByRole("button", { name: "Cancel this booking" }).click();
      await card.getByRole("button", { name: "Yes, cancel the booking" }).click();
      await expect(page.getByRole("status").filter({ hasText: "is cancelled. You can find it under Cancelled." })).toBeVisible();
      await expect(card).toHaveCount(0);

      expect((await world.booking(bookingId)).status).toBe("cancelled");
      const refunds = (await world.payments(bookingId)).filter((p) => p.type === "refund");
      if (c.percent === 0) {
        expect(refunds).toHaveLength(0);
      } else {
        expect(refunds).toHaveLength(1);
        expect(refunds[0].status).toBe("pending");
        expect(refunds[0].amountNPR).toBe(-20000 * (c.percent / 100));
      }

      await page.getByRole("button", { name: /^Cancelled/ }).click();
      await expect(entry(page, eventType)).toContainText("Cancelled");
      await expect(entry(page, eventType)).toContainText("refund of the deposit is sent back");

      // The venue owner is told
      const notes = (await (await world.api.owner.get("notification")).json()).data.map((x) => x.message);
      expect(notes.some((m) => m.startsWith(`A booking at "${world.venueName}" on `) && m.endsWith("was cancelled by the customer."))).toBe(true);
    });
  }

  test("the date is free for someone else afterwards", async () => {
    const { quotation, bookingId } = await world.booked("customer", { days: nextDay(), eventType: tag() });
    const from = new Date(new Date(quotation.eventDate).getTime() - 86400000).toISOString();
    const to = new Date(new Date(quotation.eventDate).getTime() + 86400000).toISOString();
    const busy = async () => (await (await world.api.other.get(`venues/${world.venueId}/availability?from=${from}&to=${to}`)).json()).data;
    expect(await busy()).toHaveLength(1);
    const res = await world.api.customer.put(`bookings/${bookingId}/cancel`);
    expect(res.ok()).toBeTruthy();
    expect(await busy()).toHaveLength(0);
  });

  test("a customer cannot cancel someone else's booking", async () => {
    const { bookingId } = await world.booked("other", { days: nextDay(), eventType: tag() });
    const res = await world.api.customer.put(`bookings/${bookingId}/cancel`);
    expect(res.status()).toBe(403);
    expect((await world.booking(bookingId)).status).toBe("confirmed");
  });
});

test("the owner cancels: the customer is owed the full deposit whatever the date", async ({ page, browser, baseURL }) => {
  const eventType = tag();
  const { bookingId } = await world.booked("customer", { days: 2, eventType });

  await login(page, creds.owner);
  await page.goto("/owner/bookings");
  const card = entry(page, eventType);
  await card.getByRole("button", { name: "Cancel booking" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Confirm cancelling the booking" });
  await expect(dialog).toContainText(`full deposit (${npr(20000)})`);
  await dialog.getByRole("button", { name: "No, keep it" }).click();
  expect((await world.booking(bookingId)).status).toBe("confirmed");

  await card.getByRole("button", { name: "Cancel booking" }).click();
  await dialog.getByRole("button", { name: "Yes, cancel and refund" }).click();
  await expect(page.getByText("Booking cancelled and deposit refunded")).toBeVisible();
  await expect(card).toHaveCount(0);

  const refunds = (await world.payments(bookingId)).filter((p) => p.type === "refund");
  expect(refunds).toHaveLength(1);
  expect(refunds[0].amountNPR).toBe(-20000);
  expect(refunds[0].status).toBe("pending");

  // The customer is told, and promised the full deposit
  const notes = (await (await world.api.customer.get("notification")).json()).data.map((x) => x.message);
  expect(notes.some((m) => m.startsWith(`Your booking at "${world.venueName}" on `) && m.endsWith("cancelled by the venue. Your full deposit will be refunded."))).toBe(true);

  await page.getByRole("tab", { name: /^Cancelled/ }).click();
  await expect(entry(page, eventType)).toBeVisible();

  const ctx = await browser.newContext({ baseURL });
  const mine = await ctx.newPage();
  await login(mine, creds.customer);
  await mine.goto("/my-bookings");
  await mine.getByRole("button", { name: /^Cancelled/ }).click();
  await expect(entry(mine, eventType)).toContainText("Cancelled");
  await ctx.close();
});

test("a venue with upcoming bookings cannot be deleted from the owner's list", async ({ page }) => {
  await world.booked("customer", { days: nextDay(), eventType: tag() });
  await login(page, creds.owner);
  await page.goto("/owner/venues");
  const row = page.getByRole("listitem").filter({ has: page.getByRole("heading", { level: 2, name: world.venueName, exact: true }) });
  await row.getByRole("button", { name: `Delete ${world.venueName}` }).click();
  await row.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.getByText(/has \d+ upcoming bookings?\. Cancel/)).toBeVisible();
  await expect(row).toBeVisible();
  expect((await world.api.owner.get(`venues/${world.venueId}`)).status()).toBe(200);
});

test.describe("completing the event and the review that follows", () => {
  const good = tag();
  const poor = tag();
  const comment = `The hall was lovely, ${good}.`;
  const poorComment = `Service was slow on the night, ${poor}.`;
  const ids = {};

  test("the owner marks both events completed", async ({ page }) => {
    ids.good = (await world.booked("customer", { days: nextDay(), eventType: good })).bookingId;
    ids.poor = (await world.booked("customer", { days: nextDay(), eventType: poor })).bookingId;

    await login(page, creds.owner);
    await page.goto("/owner/bookings");
    for (const type of [good, poor]) {
      await entry(page, type).getByRole("button", { name: "Mark event completed" }).click();
      await expect(page.getByText("Event marked as completed").first()).toBeVisible();
      await expect(entry(page, type)).toHaveCount(0);
    }
    await page.getByRole("tab", { name: /^Completed/ }).click();
    await expect(entry(page, good)).toBeVisible();
    expect((await world.booking(ids.good)).status).toBe("completed");

    // A completed booking can no longer be cancelled or completed again
    expect((await world.api.owner.put(`bookings/${ids.good}/complete`)).status()).toBe(400);
    expect((await world.api.owner.put(`bookings/${ids.good}/cancel`)).status()).toBe(400);
  });

  test("the customer must give a rating and a real comment before posting", async ({ page }) => {
    await login(page, creds.customer);
    await page.goto("/my-bookings");
    await page.getByRole("button", { name: /^Past/ }).click();
    const card = entry(page, good);
    await expect(card.getByText("Completed")).toBeVisible();
    await card.getByRole("button", { name: "Review this event" }).click();
    const form = card.getByRole("form", { name: "Review this event" });
    await form.getByRole("button", { name: "Post review" }).click();
    await expect(form.getByRole("alert").filter({ hasText: "Choose a star rating" })).toBeVisible();
    await form.getByRole("radio", { name: /^5 stars/ }).click();
    await form.getByLabel("How was your event?").fill("short");
    await form.getByRole("button", { name: "Post review" }).click();
    await expect(form.getByRole("alert").filter({ hasText: "Write at least 10 characters" })).toBeVisible();
    // Nothing was saved
    const mine = await (await world.api.customer.get(`venue/${world.venueId}`)).json();
    expect(mine.data.filter((r) => r.comment.includes("short"))).toHaveLength(0);
  });

  test("a five star and a three star review are posted and appear on the venue page", async ({ page, browser, baseURL }) => {
    await login(page, creds.customer);
    await page.goto("/my-bookings");
    await page.getByRole("button", { name: /^Past/ }).click();
    for (const [type, stars, text] of [[good, 5, comment], [poor, 3, poorComment]]) {
      const card = entry(page, type);
      await card.getByRole("button", { name: "Review this event" }).click();
      const form = card.getByRole("form", { name: "Review this event" });
      await form.getByRole("radio", { name: new RegExp(`^${stars} stars`) }).click();
      await form.getByLabel("Headline (optional)").fill(`Headline ${type}`);
      await form.getByLabel("How was your event?").fill(text);
      await form.getByRole("button", { name: "Post review" }).click();
      await expect(card.getByText("Thank you. Your review is now on the venue page.")).toBeVisible();
    }

    // The same booking cannot be reviewed twice
    const again = await world.api.customer.post(`venue/${world.venueId}`, { data: { bookingId: ids.good, rating: 4, comment: "A second review for the same event" } });
    expect(again.status()).toBe(400);

    const visitor = await browser.newContext({ baseURL });
    const site = await visitor.newPage();
    await site.goto(`/venue/${world.venueId}`);
    await expect(site.getByText(comment)).toBeVisible();
    await expect(site.getByText(poorComment)).toBeVisible();
    await visitor.close();

    const venue = (await (await world.api.owner.get(`venues/${world.venueId}`)).json()).data;
    expect(venue.totalReviews).toBe(2);
    expect(venue.averageRating).toBe(4);
  });

  test("the owner sees both reviews", async ({ page }) => {
    await login(page, creds.owner);
    await page.goto("/owner/reviews");
    await expect(page.getByText(comment)).toBeVisible();
    await expect(page.getByText(poorComment)).toBeVisible();
    await expect(page.getByText(`Headline ${good}`)).toBeVisible();
  });

  test("the admin features both; only the five star review reaches the landing page", async ({ page, browser, baseURL }) => {
    await login(page, creds.admin);
    await page.goto(`/admin/reviews?search=${encodeURIComponent(good)}`);
    const goodCard = entry(page, comment);
    await expect(goodCard).toBeVisible();
    await goodCard.getByRole("switch", { name: "Show on the landing page" }).click();
    await expect(goodCard.getByRole("switch", { name: "Show on the landing page" })).toBeChecked();

    await page.goto(`/admin/reviews?search=${encodeURIComponent(poor)}`);
    const poorCard = entry(page, poorComment);
    await expect(poorCard).toBeVisible();
    await poorCard.getByRole("switch", { name: "Show on the landing page" }).click();
    await expect(poorCard.getByRole("switch", { name: "Show on the landing page" })).toBeChecked();
    await expect(poorCard).toContainText("Only reviews rated 4 stars or more are shown on the landing page");

    const featured = (await (await world.api.owner.get("featured")).json()).data.map((r) => r.comment);
    expect(featured).toContain(comment);
    expect(featured).not.toContain(poorComment);

    const visitor = await browser.newContext({ baseURL });
    const home = await visitor.newPage();
    await home.goto("/");
    await expect(home.getByText(comment)).toBeVisible();
    await expect(home.getByText(poorComment)).toHaveCount(0);
    await visitor.close();

    // Switching it off removes it from the landing page again
    await page.goto(`/admin/reviews?search=${encodeURIComponent(good)}`);
    await entry(page, comment).getByRole("switch", { name: "Show on the landing page" }).click();
    await expect(entry(page, comment).getByRole("switch", { name: "Show on the landing page" })).not.toBeChecked();
    const after = (await (await world.api.owner.get("featured")).json()).data.map((r) => r.comment);
    expect(after).not.toContain(comment);
  });

  test("the admin deletes the three star review and the venue rating is recalculated", async ({ page }) => {
    await login(page, creds.admin);
    await page.goto(`/admin/reviews?search=${encodeURIComponent(poor)}`);
    const card = entry(page, poorComment);
    await card.getByRole("button", { name: "Delete" }).click();
    const dialog = card.getByRole("alertdialog", { name: "Confirm deleting this review" });
    await dialog.getByRole("button", { name: "Keep review" }).click();
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: "Delete" }).click();
    await dialog.getByRole("button", { name: "Yes, delete" }).click();
    await expect(card).toHaveCount(0);

    await expect
      .poll(async () => {
        const venue = (await (await world.api.owner.get(`venues/${world.venueId}`)).json()).data;
        return [venue.totalReviews, venue.averageRating];
      })
      .toEqual([1, 5]);
  });
});
