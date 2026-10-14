// The write paths of a request before any money moves: the customer cancels or declines, the owner declines or withdraws,
// a quotation runs out, and two customers ask for the same hall on the same date. Requests and quotations are set up through
// the API; every action under test is done on the real pages.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds } from "./helpers.js";
import { dbAvailable } from "./db.js";
import { createWorld, npr } from "./world.js";

test.skip(missingCreds("customer", "owner"), "Set the E2E_CUSTOMER_* and E2E_OWNER_* environment variables (see tests/helpers.js)");
test.skip(!dbAvailable, "The local test database is not reachable (set E2E_MONGO_URL to a local MongoDB)");

let world;
let n = 0;
const tag = () => `Flow ${Date.now().toString(36)}${++n}`;
let day = 300;
const nextDay = () => (day += 2);

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  world = await createWorld(playwright, "Flow");
});

test.afterAll(async () => {
  await world?.dispose();
});

const mine = (inquiry) => `/my-inquiries/${inquiry._id}`;
const theirs = (inquiry) => `/owner/inquiries/${inquiry._id}`;
const status = async (inquiry) => {
  const res = await world.api.owner.get(`inquiries/${inquiry._id}`);
  return (await res.json()).data.status;
};
const customerNotes = async (who = "customer") => (await (await world.api[who].get("notification")).json()).data.map((x) => x.message);
const ownerNotes = async () => (await (await world.api.owner.get("notification")).json()).data.map((x) => x.message);

test.describe("customer", () => {
  test("cancels their own request, after being asked to confirm", async ({ page }) => {
    const inquiry = await world.inquiry("customer", { days: nextDay(), eventType: tag() });
    await login(page, creds.customer);
    await page.goto(mine(inquiry));
    await expect(page.getByText("Waiting for the venue").first()).toBeVisible();

    await page.getByRole("button", { name: "Cancel this request" }).click();
    await expect(page.getByText("Cancel this request? The venue will no longer hold your date in mind")).toBeVisible();
    await page.getByRole("button", { name: "Keep it" }).click();
    expect(await status(inquiry)).toBe("pending");

    await page.getByRole("button", { name: "Cancel this request" }).click();
    await page.getByRole("button", { name: "Yes, cancel the request" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Your request is cancelled. Nothing was charged." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "You cancelled this request" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel this request" })).toHaveCount(0);
    expect(await status(inquiry)).toBe("cancelled");

    // It moves to Closed in the list
    await page.goto("/my-inquiries");
    await page.getByRole("group", { name: "Filter requests" }).getByRole("button", { name: /^Closed/ }).click();
    await expect(page.getByRole("main").getByRole("link", { name: new RegExp(world.venueName) }).first()).toBeVisible();
  });

  test("declines a quotation: the request goes back to the venue and the owner is told", async ({ page }) => {
    const { inquiry, quotation } = await world.quoted("customer", { days: nextDay(), eventType: tag(), price: 90000 });
    await login(page, creds.customer);
    await page.goto(mine(inquiry));
    await expect(page.getByRole("heading", { name: "Quotation" })).toBeVisible();
    await expect(page.getByText(npr(90000)).first()).toBeVisible();

    await page.getByRole("button", { name: "Decline this quote" }).click();
    await expect(page.getByText("Decline this quotation? Your request goes back to the venue")).toBeVisible();
    await page.getByRole("button", { name: "Keep it" }).click();
    expect((await world.api.owner.get(`quotations/${quotation._id}`).then((r) => r.json())).data.status).toBe("sent");

    await page.getByRole("button", { name: "Decline this quote" }).click();
    await page.getByRole("button", { name: "Yes, decline it" }).click();
    await expect(page.getByRole("status").filter({ hasText: "You declined the quotation." })).toBeVisible();
    await expect(page.getByText("Waiting for the venue").first()).toBeVisible();

    expect((await world.api.owner.get(`quotations/${quotation._id}`).then((r) => r.json())).data.status).toBe("rejected");
    expect(await status(inquiry)).toBe("pending");
    expect(await ownerNotes()).toContain(`Your quotation for "${world.venueName}" was declined by the customer.`);
  });
});

test.describe("owner", () => {
  test("declines a request after being asked to confirm, and the customer is told", async ({ page, browser, baseURL }) => {
    const inquiry = await world.inquiry("customer", { days: nextDay(), eventType: tag() });
    await login(page, creds.owner);
    await page.goto(theirs(inquiry));
    await page.getByRole("button", { name: "Decline this request" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Confirm declining the request" });
    await expect(dialog).toContainText("This cannot be undone");
    await dialog.getByRole("button", { name: "No, keep it" }).click();
    expect(await status(inquiry)).toBe("pending");

    await page.getByRole("button", { name: "Decline this request" }).click();
    await dialog.getByRole("button", { name: "Yes, decline" }).click();
    await expect(page.getByText("Request declined").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Decline this request" })).toHaveCount(0);
    expect(await status(inquiry)).toBe("declined");
    expect(await customerNotes()).toContain(`Your inquiry for "${world.venueName}" was declined.`);

    const ctx = await browser.newContext({ baseURL });
    const guest = await ctx.newPage();
    await login(guest, creds.customer);
    await guest.goto(mine(inquiry));
    await expect(guest.getByRole("heading", { name: "The venue could not take this date" })).toBeVisible();
    await expect(guest.getByText("Declined by the venue").first()).toBeVisible();
    await ctx.close();
  });

  test("withdraws a quotation: the customer can no longer accept it", async ({ page, browser, baseURL }) => {
    const { inquiry, quotation } = await world.quoted("customer", { days: nextDay(), eventType: tag() });
    await login(page, creds.owner);
    await page.goto(theirs(inquiry));
    await page.getByRole("button", { name: "Withdraw this quotation" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Confirm withdrawing the quotation" });
    await dialog.getByRole("button", { name: "Keep it" }).click();
    expect((await world.api.owner.get(`quotations/${quotation._id}`).then((r) => r.json())).data.status).toBe("sent");

    await page.getByRole("button", { name: "Withdraw this quotation" }).click();
    await dialog.getByRole("button", { name: "Yes, withdraw it" }).click();
    await expect(page.getByText("Quotation withdrawn").first()).toBeVisible();
    expect((await world.api.owner.get(`quotations/${quotation._id}`).then((r) => r.json())).data.status).toBe("withdrawn");
    expect(await customerNotes()).toContain(`The quotation for "${world.venueName}" was withdrawn by the venue.`);

    const ctx = await browser.newContext({ baseURL });
    const guest = await ctx.newPage();
    await login(guest, creds.customer);
    await guest.goto(mine(inquiry));
    await expect(guest.getByRole("heading", { name: "The venue could not take this date" })).toBeVisible();
    await expect(guest.getByRole("button", { name: /accept and pay deposit/i })).toHaveCount(0);
    await ctx.close();
    expect((await world.api.customer.put(`quotations/${quotation._id}/accept`)).status()).toBe(400);
  });
});

test.describe("a quotation that has run out", () => {
  test("the customer is told it expired and cannot accept it", async ({ page }) => {
    const { inquiry, quotation } = await world.quoted("customer", { days: nextDay(), eventType: tag() });
    await world.setQuotation(quotation._id, { validUntil: new Date(Date.now() - 2 * 86400000) });

    await login(page, creds.customer);
    await page.goto(mine(inquiry));
    await expect(page.getByText(/quotation (has )?expired/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /accept and pay deposit/i })).toHaveCount(0);
    // The server has put the request back with the venue
    await expect.poll(() => status(inquiry)).toBe("pending");
    await expect(page.getByText("Waiting for the venue").first()).toBeVisible();

    const res = await world.api.customer.put(`quotations/${quotation._id}/accept`);
    expect(res.status()).toBe(400);
    expect((await res.json()).message).toMatch(/expired/i);
  });

  test("the owner is told it expired and can send a new one", async ({ page }) => {
    const { inquiry, quotation } = await world.quoted("customer", { days: nextDay(), eventType: tag() });
    await world.setQuotation(quotation._id, { validUntil: new Date(Date.now() - 2 * 86400000) });

    await login(page, creds.owner);
    await page.goto(theirs(inquiry));
    await expect(page.getByText(/quotation (has )?expired/i).first()).toBeVisible();
    await expect(page.getByText("Needs a reply").first()).toBeVisible();
    await expect(page.locator("#li-price-0")).toBeVisible();
    await page.fill("#li-price-0", "70000");
    await page.getByRole("button", { name: "Send quotation" }).click();
    await expect(page.getByText("Quotation sent").first()).toBeVisible();
    expect(await status(inquiry)).toBe("quoted");
  });
});

test.describe("two customers ask for the same hall, date and shift", () => {
  test("once one has paid, the other cannot accept, and the owner cannot quote a third", async ({ page, browser, baseURL }) => {
    const d = nextDay();
    const first = await world.quoted("customer", { days: d, eventType: tag() });
    const second = await world.quoted("other", { days: d, eventType: tag() });
    // A different hall and a different shift on the same date are not affected
    const otherHall = await world.quoted("other", { days: d, eventType: tag(), space: "b" });
    const otherShift = await world.quoted("other", { days: d, eventType: tag(), shift: "day" });
    expect(otherHall.quotation.status).toBe("sent");
    expect(otherShift.quotation.status).toBe("sent");

    // The first customer accepts on the page and is offered the eSewa payment
    await login(page, creds.customer);
    await page.goto(mine(first.inquiry));
    await page.getByRole("button", { name: /accept and pay deposit/i }).click();
    await expect(page.getByRole("heading", { name: "Pay the deposit" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Pay NPR .* with eSewa/ })).toBeVisible();
    // ...and pays (written straight to the local database, see world.js)
    await world.pay("customer", first.inquiry, first.quotation);

    // The second customer now tries the same date
    const second_ = await browser.newContext({ baseURL });
    const guest = await second_.newPage();
    await login(guest, world.other);
    await guest.goto(mine(second.inquiry));
    await guest.getByRole("button", { name: /accept and pay deposit/i }).click();
    await expect(guest.getByRole("alert").filter({ hasText: "already booked" })).toBeVisible();
    // Their quotation is still open instead of being stuck as accepted and unpayable
    expect((await world.api.owner.get(`quotations/${second.quotation._id}`).then((r) => r.json())).data.status).toBe("sent");
    expect(await status(second.inquiry)).toBe("quoted");

    // The owner cannot quote a third customer for the taken date
    const third = await world.inquiry("customer", { days: d, eventType: tag() });
    const owner = await browser.newContext({ baseURL });
    const ownerPage = await owner.newPage();
    await login(ownerPage, creds.owner);
    await ownerPage.goto(theirs(third));
    await ownerPage.fill("#li-price-0", "80000");
    await ownerPage.getByRole("button", { name: "Send quotation" }).click();
    await expect(ownerPage.getByRole("alert").filter({ hasText: "already booked" })).toBeVisible();
    expect(await status(third)).toBe("pending");

    await second_.close();
    await owner.close();
  });

  test("a customer who accepted first but had not paid is refused when paying after the other booked", async ({ browser, baseURL }) => {
    const d = nextDay();
    const a = await world.quoted("customer", { days: d, eventType: tag() });
    const b = await world.quoted("other", { days: d, eventType: tag() });

    const ctxB = await browser.newContext({ baseURL });
    const pageB = await ctxB.newPage();
    await login(pageB, world.other);
    await pageB.goto(mine(b.inquiry));
    await pageB.getByRole("button", { name: /accept and pay deposit/i }).click();
    await expect(pageB.getByRole("heading", { name: "Pay the deposit" })).toBeVisible();

    // Meanwhile the first customer accepts and pays
    expect((await world.api.customer.put(`quotations/${a.quotation._id}/accept`)).ok()).toBeTruthy();
    await world.pay("customer", a.inquiry, a.quotation);

    // The second customer comes back to pay
    await pageB.reload();
    await expect(pageB.getByRole("heading", { name: "Pay the deposit to confirm" })).toBeVisible();
    await pageB.getByRole("button", { name: "Pay the deposit" }).click();
    await expect(pageB.getByRole("alert").filter({ hasText: "already booked" })).toBeVisible();
    await ctxB.close();
  });
});
