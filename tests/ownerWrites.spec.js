// Owner write paths, end to end: create a venue through the form, add and remove a hall, edit the venue, delete it.
// Photos are skipped here (uploads go to Cloudinary); everything else is the real form against the local backend.
import { test, expect } from "@playwright/test";
import { dbAvailable, withDb } from "./db.js";
import { apiAs, creds, deleteOwnerVenues, login, missingCreds, unique, watchErrors } from "./helpers.js";

test.skip(missingCreds("owner"), "Set the E2E_OWNER_* environment variables (see tests/helpers.js)");

const PREFIX = "E2E Hall";
const name = unique("Hall");
const renamed = `${name} Renamed`;
let api;

test.describe.configure({ mode: "serial" });

test.beforeAll(async ({ playwright }) => {
  api = await apiAs(playwright, creds.owner);
  await deleteOwnerVenues(api, PREFIX);
});

test.afterAll(async () => {
  await deleteOwnerVenues(api, PREFIX);
  await api.dispose();
  // The delete in the app is a soft delete: remove what the run left behind in the local test database
  if (dbAvailable) {
    await withDb(async ({ db }) => {
      const venues = await db.collection("venues").find({ venueName: { $regex: `^${PREFIX}` } }).project({ _id: 1 }).toArray();
      await db.collection("spaces").deleteMany({ venue: { $in: venues.map((v) => v._id) } });
      await db.collection("venues").deleteMany({ _id: { $in: venues.map((v) => v._id) } });
    });
  }
});

const card = (page, venueName) =>
  page.getByRole("listitem").filter({ has: page.getByRole("heading", { level: 2, name: venueName, exact: true }) });

test("the empty form is refused with a message under each required field", async ({ page }) => {
  await login(page, creds.owner);
  await page.goto("/owner/venues");
  await page.getByRole("button", { name: /^Add venue$/ }).click();
  await expect(page.getByRole("heading", { level: 2, name: "The basics" })).toBeVisible();
  await page.getByRole("button", { name: "Create venue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Required" }).first()).toBeVisible();
  await expect(page.getByLabel(/Venue name/)).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL(/\/owner\/venues$/);
});

test("a package with a name but no price is refused", async ({ page }) => {
  await login(page, creds.owner);
  await page.goto("/owner/venues");
  await page.getByRole("button", { name: /^Add venue$/ }).click();
  await page.getByLabel(/Venue name/).fill(`${name} bad`);
  await page.locator("#venue-category").selectOption({ index: 1 });
  await page.getByLabel(/Description/).fill("Check");
  await page.getByLabel(/Street address/).fill("Street");
  await page.getByLabel(/^City/).fill("Kathmandu");
  await page.getByLabel(/^State/).fill("Bagmati");
  await page.getByLabel(/^Country/).fill("Nepal");
  await page.getByRole("button", { name: "Add a package" }).click();
  await page.getByLabel("Package name").fill("No price");
  await page.getByRole("button", { name: "Create venue" }).click();
  await expect(page.getByRole("alert").filter({ hasText: 'Enter a price per plate for "No price"' })).toBeVisible();
});

test("create a venue with a food package and a drink option, then add a hall", async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, creds.owner);
  await page.goto("/owner/venues");
  await page.getByRole("button", { name: /^Add venue$/ }).click();

  await page.getByLabel(/Venue name/).fill(name);
  await page.locator("#venue-category").selectOption("garden-estates");
  await page.getByLabel(/Description/).fill("A test venue made by the end to end suite.");
  await page.getByLabel(/Contact phone/).fill("9801234567");
  await page.getByLabel(/Street address/).fill("1 Test Road");
  await page.getByLabel(/^City/).fill("Lalitpur");
  await page.getByLabel(/^State/).fill("Bagmati");
  await page.getByLabel(/^Country/).fill("Nepal");
  await page.getByRole("group", { name: "Amenities" }).getByLabel("Parking").check();
  await page.getByRole("group", { name: "Amenities" }).getByLabel("Stage").check();

  await page.getByRole("button", { name: "Add a package" }).click();
  await page.getByLabel("Package name").fill("Gold Package");
  await page.getByLabel("Price per plate (NPR)").fill("1800");
  await page.getByLabel("Minimum plates").fill("50");
  await page.getByLabel(/Menu highlights/).fill("Dal bhat\nSelroti");
  await page.getByRole("button", { name: "Add a drink option" }).click();
  await page.getByLabel("Name", { exact: true }).fill("Soft drinks");
  await page.getByLabel(/What is on offer/).fill("Coke\nFanta");

  await page.getByRole("button", { name: "Create venue" }).click();

  // Straight on to the halls of the new venue
  await expect(page.getByRole("heading", { level: 1, name: "Halls & spaces" })).toBeVisible();
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  await expect(page.getByText("No spaces yet")).toBeVisible();

  // Too-small input is refused
  await page.getByRole("button", { name: "Add space" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /name/i })).toBeVisible();

  await page.getByLabel("Name", { exact: true }).fill("Glass Hall");
  await page.getByLabel("Capacity (guests)").fill("250");
  await page.getByRole("button", { name: "Add space" }).click();
  await expect(page.getByText("Glass Hall", { exact: true })).toBeVisible();
  await expect(page.getByText("Up to 250 guests")).toBeVisible();

  await page.getByLabel("Name", { exact: true }).fill("Pine Lawn");
  await page.getByLabel("Capacity (guests)").fill("400");
  await page.getByRole("button", { name: "Add space" }).click();
  await expect(page.getByText("Pine Lawn", { exact: true })).toBeVisible();

  // Edit a space, then remove it behind the inline confirmation
  const pine = page.getByRole("listitem").filter({ hasText: "Pine Lawn" });
  await pine.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("Capacity (guests)").first().fill("420");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Up to 420 guests")).toBeVisible();

  await pine.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Remove Pine Lawn?" })).toBeVisible();
  await page.getByRole("button", { name: "Keep", exact: true }).click();
  await expect(page.getByText("Pine Lawn", { exact: true })).toBeVisible();
  await pine.getByRole("button", { name: "Remove" }).click();
  await page.getByRole("button", { name: "Yes, remove" }).click();
  await expect(page.getByText("Pine Lawn", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Glass Hall", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "My venues" })).toBeVisible();
  expect(errors()).toEqual([]);
});

test("the new venue is in the list as pending review with its price and amenities", async ({ page }) => {
  await login(page, creds.owner);
  await page.goto("/owner/venues");
  const row = card(page, name);
  await expect(row).toBeVisible();
  await expect(row.getByText("Pending review")).toBeVisible();
  await expect(row).toContainText("Packages from NPR 1,800 per plate");
  await expect(row).toContainText("Lalitpur, Nepal");
  await expect(row.getByRole("list", { name: "Amenities" })).toContainText("Parking");
  await expect(row).not.toContainText(/per hour|hourly/i);

  // Not public until an admin approves it
  const list = await (await api.get("venues?search=" + encodeURIComponent(name))).json();
  expect(list.data).toHaveLength(0);
});

test("edit the venue: the saved package and drink are filled in, and a rename sticks", async ({ page }) => {
  await login(page, creds.owner);
  await page.goto("/owner/venues");
  await card(page, name).getByRole("button", { name: `Edit ${name}` }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Edit venue" })).toBeVisible();
  await expect(page.getByLabel(/Venue name/)).toHaveValue(name);
  await expect(page.getByLabel("Package name")).toHaveValue("Gold Package");
  await expect(page.getByLabel("Price per plate (NPR)")).toHaveValue("1800");
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Soft drinks");
  await expect(page.getByRole("group", { name: "Amenities" }).getByLabel("Parking")).toBeChecked();

  await page.getByLabel(/Venue name/).fill(renamed);
  await page.getByLabel("Price per plate (NPR)").fill("2100");
  await page.getByRole("group", { name: "Amenities" }).getByLabel("AC").check();
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "My venues" })).toBeVisible();
  const row = card(page, renamed);
  await expect(row).toContainText("Packages from NPR 2,100 per plate");
  await expect(row.getByRole("list", { name: "Amenities" })).toContainText("AC");
  await expect(card(page, name)).toHaveCount(0);
});

test("deleting asks first, keeps the venue on Keep it, and removes it on Yes, delete", async ({ page }) => {
  await login(page, creds.owner);
  await page.goto("/owner/venues");
  const row = card(page, renamed);
  await row.getByRole("button", { name: `Delete ${renamed}` }).click();
  await expect(row.getByRole("alert")).toContainText("This is permanent");
  await row.getByRole("button", { name: "Keep it" }).click();
  await expect(row.getByRole("alert")).toHaveCount(0);
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: `Delete ${renamed}` }).click();
  await row.getByRole("button", { name: "Yes, delete" }).click();
  await expect(card(page, renamed)).toHaveCount(0);
  const mine = await (await api.get("venues/owner/me?limit=50")).json();
  expect(mine.data.venues.some((v) => v.venueName.startsWith(PREFIX))).toBe(false);
});
