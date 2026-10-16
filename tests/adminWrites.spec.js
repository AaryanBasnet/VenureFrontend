// Admin write paths: approve, feature, reject venues; deactivate a user. The owner's venue is created through the API
// (the form itself is covered in ownerWrites.spec.js) and everything the admin does goes through the real pages.
import { test, expect } from "@playwright/test";
import { apiAs, creds, deleteOwnerVenues, login, missingCreds, unique, watchErrors } from "./helpers.js";
import { dbAvailable, insertCustomer, withDb } from "./db.js";

test.skip(missingCreds("owner", "admin"), "Set the E2E_OWNER_* and E2E_ADMIN_* environment variables (see tests/helpers.js)");

const PREFIX = "E2E Mod";
const name = unique("Mod");
const second = unique("Mod Dash");
let owner;
let admin;
const ids = {};

test.describe.configure({ mode: "serial" });

async function makeVenue(venueName) {
  const res = await owner.post("venues", {
    data: {
      venueName,
      category: "garden-estates",
      description: "Created by the admin end to end suite.",
      location: { address: "2 Test Road", city: "Bhaktapur", state: "Bagmati", country: "Nepal" },
      amenities: ["Parking"],
      packages: [{ name: "Silver", pricePerPlate: 1500, minPlates: 50, highlights: ["Dal bhat"] }],
    },
  });
  expect(res.status()).toBe(201);
  const venue = (await res.json()).data;
  const space = await owner.post(`venues/${venue._id}/spaces`, { data: { name: "Main Hall", capacity: 200 } });
  expect(space.status()).toBe(201);
  return venue._id;
}

const venueTitle = (page, venueName) => page.getByRole("heading", { level: 2, name: venueName, exact: true });
const row = (page, venueName) => page.getByRole("listitem").filter({ has: venueTitle(page, venueName) });

test.beforeAll(async ({ playwright }) => {
  owner = await apiAs(playwright, creds.owner);
  admin = await apiAs(playwright, creds.admin);
  await deleteOwnerVenues(owner, PREFIX);
  ids.venue = await makeVenue(name);
  ids.second = await makeVenue(second);
});

test.afterAll(async () => {
  await deleteOwnerVenues(owner, PREFIX);
  if (dbAvailable) {
    await withDb(async ({ db, ObjectId }) => {
      const venueIds = [ids.venue, ids.second].filter(Boolean).map((v) => new ObjectId(v));
      await db.collection("notifications").deleteMany({ message: { $regex: `"${PREFIX}` } });
      await db.collection("spaces").deleteMany({ venue: { $in: venueIds } });
      await db.collection("venues").deleteMany({ _id: { $in: venueIds } });
      const people = await db.collection("users").find({ email: /^e2e-admin-.*@example\.com$/ }).project({ _id: 1 }).toArray();
      await db.collection("refreshtokens").deleteMany({ userId: { $in: people.map((u) => u._id) } });
      await db.collection("users").deleteMany({ _id: { $in: people.map((u) => u._id) } });
    });
  }
  await owner.dispose();
  await admin.dispose();
});

const publicSearch = async (venueName) => (await (await owner.get("venues?search=" + encodeURIComponent(venueName))).json()).data;
const adminVenue = async (id) => (await (await admin.get("venues/admin/all?limit=50&search=" + encodeURIComponent(PREFIX))).json()).venues.find((v) => v._id === id);
const featuredNames = async () => (await (await owner.get("venues/featured")).json()).data.map((v) => v.venueName);

test("a new venue waits under Pending and on the dashboard, and is not public yet", async ({ page }) => {
  await login(page, creds.admin);
  await page.goto("/admin/dashboard");
  const awaiting = page.getByRole("region", { name: "Venues awaiting approval" }).or(page.locator("section").filter({ hasText: "Venues awaiting approval" }));
  await expect(awaiting.first()).toContainText(name);

  await page.goto("/admin/venue");
  const tabs = page.getByRole("tablist", { name: "Venue status" });
  await expect(tabs.getByRole("tab", { selected: true })).toContainText("Pending");
  await expect(venueTitle(page, name)).toBeVisible();
  await expect(row(page, name).getByText("Pending review")).toBeVisible();
  // Pending venues cannot be featured
  await expect(row(page, name).getByRole("switch", { name: "Featured on landing page" })).toBeDisabled();
  await expect(row(page, name)).toContainText("Only approved venues can be featured.");

  expect(await publicSearch(name)).toHaveLength(0);
  await page.goto(`/venue/${ids.venue}`);
  await expect(page.getByRole("heading", { level: 1, name })).toHaveCount(0);
});

test("approving asks first, cancelling changes nothing, and confirming notifies the owner and publishes the venue", async ({ page, browser, baseURL }) => {
  const errors = watchErrors(page);
  await login(page, creds.admin);
  await page.goto("/admin/venue");
  await page.getByRole("searchbox", { name: "Search by venue name" }).fill(name);
  const r = row(page, name);

  await r.getByRole("button", { name: `Approve ${name}` }).click();
  await expect(r.getByRole("alert")).toContainText("Approve this venue?");
  await r.getByRole("button", { name: "Cancel" }).click();
  await expect(r.getByRole("alert")).toHaveCount(0);
  expect((await adminVenue(ids.venue)).status).toBe("pending");

  await r.getByRole("button", { name: `Approve ${name}` }).click();
  await r.getByRole("button", { name: "Yes, approve" }).click();
  await expect(page.getByText(`${name} was approved. The owner has been notified.`)).toBeVisible();
  // It leaves the Pending list
  await expect(venueTitle(page, name)).toHaveCount(0);
  expect((await adminVenue(ids.venue)).status).toBe("approved");

  // The owner got a notification
  const notes = (await (await owner.get("notification")).json()).data;
  expect(notes.some((n) => n.message === `Your venue "${name}" has been approved.`)).toBe(true);

  // Public: in the list and on its own page
  expect((await publicSearch(name)).map((v) => v.venueName)).toEqual([name]);
  const visitor = await browser.newContext({ baseURL });
  const site = await visitor.newPage();
  await site.goto(`/venue/${ids.venue}`);
  await expect(site.getByRole("heading", { level: 1, name })).toBeVisible();
  await visitor.close();
  expect(errors()).toEqual([]);
});

test("the approved venue appears on the public list page", async ({ page }) => {
  await page.goto("/venues?search=" + encodeURIComponent(name));
  await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();
});

test("featuring puts the venue on the landing page and in the featured API; unfeaturing removes it", async ({ page, browser, baseURL }) => {
  await login(page, creds.admin);
  await page.goto("/admin/venue");
  await page.getByRole("tablist", { name: "Venue status" }).getByRole("tab", { name: /^Approved/ }).click();
  await page.getByRole("searchbox", { name: "Search by venue name" }).fill(name);
  const toggle = row(page, name).getByRole("switch", { name: "Featured on landing page" });
  await expect(toggle).toBeEnabled();
  await expect(toggle).not.toBeChecked();

  await toggle.click();
  await expect(page.getByText(`${name} is now featured.`)).toBeVisible();
  await expect(toggle).toBeChecked();
  expect(await featuredNames()).toContain(name);

  const visitor = await browser.newContext({ baseURL });
  const landing = await visitor.newPage();
  await landing.goto("/");
  await expect(landing.getByText(name).first()).toBeVisible();
  await visitor.close();

  await toggle.click();
  await expect(page.getByText(`${name} is no longer featured.`)).toBeVisible();
  await expect(toggle).not.toBeChecked();
  expect(await featuredNames()).not.toContain(name);
});

test("rejecting takes the venue off the public site and clears Featured", async ({ page }) => {
  // Feature it again so there is something to clear
  const featured = await admin.patch(`venues/${ids.venue}/feature`);
  expect(featured.ok()).toBeTruthy();
  expect(await featuredNames()).toContain(name);

  await login(page, creds.admin);
  await page.goto("/admin/venue");
  await page.getByRole("tablist", { name: "Venue status" }).getByRole("tab", { name: /^Approved/ }).click();
  await page.getByRole("searchbox", { name: "Search by venue name" }).fill(name);
  const r = row(page, name);
  await r.getByRole("button", { name: `Reject ${name}` }).click();
  await expect(r.getByRole("alert")).toContainText("taken off the site");
  await r.getByRole("button", { name: "Yes, reject" }).click();
  await expect(page.getByText(`${name} was rejected. The owner has been notified.`)).toBeVisible();

  const after = await adminVenue(ids.venue);
  expect(after.status).toBe("rejected");
  expect(after.isFeatured).toBe(false);
  expect(await publicSearch(name)).toHaveLength(0);
  expect(await featuredNames()).not.toContain(name);
  expect((await owner.get(`venues/${ids.venue}`)).status()).toBe(404);

  // A rejected venue cannot be featured
  await page.getByRole("tablist", { name: "Venue status" }).getByRole("tab", { name: /^Rejected/ }).click();
  await expect(row(page, name).getByRole("switch", { name: "Featured on landing page" })).toBeDisabled();
});

test("the API itself refuses to feature a venue that is not approved", async () => {
  const res = await admin.patch(`venues/${ids.venue}/feature`);
  expect(res.status()).toBe(400);
  expect((await adminVenue(ids.venue)).isFeatured).toBe(false);
});

test("the dashboard approves a pending venue from its own list", async ({ page }) => {
  await login(page, creds.admin);
  await page.goto("/admin/dashboard");
  const item = page.getByRole("listitem").filter({ hasText: second });
  await expect(item).toBeVisible();
  await item.getByRole("button", { name: /^Approve/ }).click();
  await item.getByRole("button", { name: "Yes, approve" }).click();
  await expect(item).toHaveCount(0);
  expect((await adminVenue(ids.second)).status).toBe("approved");
});

test.describe("deactivating a user", () => {
  const email = `e2e-admin-${Date.now().toString(36)}@example.com`;
  const password = "Deact1vate!Me";
  const person = unique("Person");

  test("the account works, then cannot sign in once an admin deactivates it", async ({ page, playwright, browser, baseURL }) => {
    test.skip(!dbAvailable, "The local test database is not reachable, so the throwaway customer cannot be created");
    await insertCustomer({ name: person, email, password });

    // They can sign in now
    const ctx = await browser.newContext({ baseURL });
    const mine = await ctx.newPage();
    await login(mine, { email, password });
    await ctx.close();
    // A session they already have open
    const open = await apiAs(playwright, { email, password });
    expect((await open.get("user/profile")).status()).toBe(200);

    await login(page, creds.admin);
    await page.goto("/admin/user");
    await page.getByRole("searchbox", { name: "Search people" }).fill(email);
    const table = page.getByRole("table", { name: "People with an account" });
    await expect(table.getByRole("row")).toHaveCount(2);
    await table.getByRole("button", { name: `Deactivate ${person}` }).click();
    await expect(page.getByRole("alertdialog", { name: `Confirm deactivating ${person}` })).toBeVisible();
    await page.getByRole("button", { name: "Keep account" }).click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);

    await table.getByRole("button", { name: `Deactivate ${person}` }).click();
    await page.getByRole("button", { name: "Yes, deactivate" }).click();
    await expect(page.getByText(`${person} was deactivated`)).toBeVisible();
    await expect(page.getByText(/No one matches/)).toBeVisible();

    // And now they cannot: the open session is refused and a new sign-in fails
    expect((await open.get("user/profile")).status()).toBe(401);
    await open.dispose();
    const api = await playwright.request.newContext({ baseURL: "http://localhost:5052/api/" });
    expect((await api.post("auth/login", { data: { email, password } })).status()).toBe(401);
    await api.dispose();
    const fresh = await browser.newContext({ baseURL });
    const attempt = await fresh.newPage();
    await attempt.goto("/login");
    await attempt.fill('input[name="email"]', email);
    await attempt.fill('input[name="password"]', password);
    await attempt.press('input[name="password"]', "Enter");
    await expect(attempt).toHaveURL(/\/login/);
    await expect(attempt.getByRole("alert").first()).toBeVisible();
    await fresh.close();
  });
});
