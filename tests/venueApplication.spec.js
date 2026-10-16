// The whole way in for a venue owner: apply (no account), the admin checks the documents and approves, the owner chooses a
// password from the emailed link and signs in. A second application is rejected with a reason.
// Files go to the real file store; the emailed link is replaced by one the test writes (only a hash of the real one is stored).
import { test, expect } from "@playwright/test";
import crypto from "node:crypto";
import { creds, login, missingCreds, watchErrors } from "./helpers.js";
import { dbAvailable, withDb } from "./db.js";

test.skip(missingCreds("admin"), "Set the E2E_ADMIN_* environment variables (see tests/helpers.js)");
test.skip(!dbAvailable, "The local test database is not reachable (set E2E_MONGO_URL to a local MongoDB)");
test.describe.configure({ mode: "serial" });

const stamp = Date.now().toString(36);
const APPLICANT = { email: `e2e-apply-${stamp}@example.com`, venue: `E2E Application Hall ${stamp}`, password: "Sunrise-2026-Ok" };
const REJECTED = { email: `e2e-reject-${stamp}@example.com`, venue: `E2E Rejected Hall ${stamp}` };
const TOKEN = crypto.randomBytes(32).toString("hex");

const PDF = Buffer.from("%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const photo = (n) => ({ name: `hall-${n}.png`, mimeType: "image/png", buffer: Buffer.concat([PNG, Buffer.from([n])]) });

test.afterAll(async () => {
  await withDb(async ({ db }) => {
    for (const email of [APPLICANT.email, REJECTED.email]) {
      const user = await db.collection("users").findOne({ email });
      if (user) {
        const venues = await db.collection("venues").find({ owner: user._id }).toArray();
        await db.collection("spaces").deleteMany({ venue: { $in: venues.map((v) => v._id) } });
        await db.collection("venues").deleteMany({ owner: user._id });
        await db.collection("refreshtokens").deleteMany({ userId: user._id });
        await db.collection("notifications").deleteMany({ recipient: user._id });
        await db.collection("users").deleteOne({ _id: user._id });
      }
      await db.collection("venueapplications").deleteMany({ email });
    }
  });
});

// Fills the six steps. `email` and `name` make each application its own.
async function fillApplication(page, { email, name }) {
  await page.goto("/list-your-venue/apply");
  await page.fill("#name", name);
  await page.selectOption("#category", "banquet-party-palace");
  await page.fill("#email", email);
  await page.fill("#phone", "9812345678");
  await page.fill("#ownerName", "Sita Sharma");
  await page.fill("#about", "A garden by the river.");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.selectOption("#province", "Bagmati");
  await page.fill("#city", "Bhaktapur");
  await page.fill("#area", "Suryabinayak chowk");
  await page.fill("#mapLink", "https://www.google.com/maps/place/Bhaktapur/@27.6710,85.4298,15z");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.fill("#hn-0", "Glass Hall");
  await page.fill("#hc-0", "300");
  await page.getByRole("button", { name: "Add another hall" }).click();
  await page.fill("#hn-1", "Lawn");
  await page.fill("#hc-1", "600");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Add photos").setInputFiles([photo(1), photo(2), photo(3)]);
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Business registration certificate").setInputFiles({ name: "registration.pdf", mimeType: "application/pdf", buffer: PDF });
  await page.getByLabel("PAN certificate").setInputFiles({ name: "pan-certificate.pdf", mimeType: "application/pdf", buffer: PDF });
  await page.fill("#pan", "123456789");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel(/I confirm this venue/).check();
  await page.getByRole("button", { name: "Send for review" }).click();
}

test("an owner applies without an account, and is told what happens next", async ({ page }) => {
  const errors = watchErrors(page);
  await fillApplication(page, { email: APPLICANT.email, name: APPLICANT.venue });
  await expect(page.getByRole("heading", { name: new RegExp(`${APPLICANT.venue} is with our team`) })).toBeVisible({ timeout: 30000 });
  await expect(page.getByText(APPLICANT.email)).toBeVisible();
  await expect(page.getByText("We email you a link. Open it and choose a password.")).toBeVisible();

  const saved = await withDb(({ db }) => db.collection("venueapplications").findOne({ email: APPLICANT.email }));
  expect(saved).toMatchObject({ status: "pending", venueName: APPLICANT.venue, venueType: "banquet-party-palace", panNumber: "123456789" });
  expect(saved.halls).toEqual([{ name: "Glass Hall", capacity: 300 }, { name: "Lawn", capacity: 600 }]);
  expect(saved.photos).toHaveLength(3);
  expect(saved.coordinates).toEqual({ lat: 27.671, lng: 85.4298 });
  // No account and no venue yet
  expect(await withDb(({ db }) => db.collection("users").countDocuments({ email: APPLICANT.email }))).toBe(0);
  expect(errors()).toEqual([]);
});

test("the same email cannot apply twice while the first is waiting", async ({ page }) => {
  await fillApplication(page, { email: APPLICANT.email, name: `${APPLICANT.venue} again` });
  await expect(page.getByRole("alert").filter({ hasText: "already being reviewed" })).toBeVisible();
  // The answer stays on the last step with everything still filled in
  await expect(page.getByRole("button", { name: "Send for review" })).toBeEnabled();
});

test("the admin sees it waiting, opens the documents, and approves it", async ({ page }) => {
  await login(page, creds.admin);
  await page.goto("/admin/applications");
  await expect(page.getByRole("link", { name: /Applications/ }).first()).toBeVisible();
  const row = page.getByRole("link", { name: new RegExp(APPLICANT.venue) });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Banquet hall and party palace");
  await expect(row).toContainText("2 halls");
  await row.click();

  await expect(page.getByRole("heading", { level: 1, name: APPLICANT.venue })).toBeVisible();
  await expect(page.getByRole("link", { name: APPLICANT.email })).toBeVisible();
  await expect(page.getByText("27.67100, 85.42980")).toBeVisible();
  await expect(page.getByText("Glass Hall", { exact: true })).toBeVisible();
  await expect(page.getByText("600 guests")).toBeVisible();
  await expect(page.getByText("123456789")).toBeVisible();
  await expect(page.getByRole("img", { name: /Photo 1 of/ })).toBeVisible();

  // A private document opens through a signed, expiring link
  const [tab] = await Promise.all([page.context().waitForEvent("page"), page.getByRole("button", { name: /pan-certificate\.pdf/ }).click()]);
  await tab.waitForURL(/api\.cloudinary\.com/, { timeout: 20000 });
  expect(tab.url()).toContain("signature=");
  await tab.close();

  // The suggested site category is pre-chosen; approving needs one click
  await expect(page.locator("#category")).toHaveValue("garden-estates");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  // The local backend has no mail account, so the page says the email could not be sent and offers to send it again
  await expect(page.getByText(/Approved, but the email could not be sent/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Send the link again" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Decision" })).toBeVisible();
  await expect(page.getByText("Approved", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);

  const owner = await withDb(({ db }) => db.collection("users").findOne({ email: APPLICANT.email }));
  expect(owner).toMatchObject({ role: "VenueOwner", name: "Sita Sharma" });
  expect(owner.password).toBeUndefined();
  const venue = await withDb(({ db }) => db.collection("venues").findOne({ owner: owner._id }));
  expect(venue).toMatchObject({ venueName: APPLICANT.venue, status: "approved", category: "garden-estates" });
});

test("the owner cannot sign in yet, then chooses a password from the link and signs in", async ({ page }) => {
  // Before: no password exists, and the sign-in page says so
  await page.goto("/login");
  await page.getByLabel("Email address").fill(APPLICANT.email);
  await page.getByLabel("Password").first().fill(APPLICANT.password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await expect(page.getByText(/Choose your password first/)).toBeVisible();

  // Stand in for the emailed link: the app stores only a hash of the real one
  await withDb(({ db }) =>
    db.collection("venueapplications").updateOne(
      { email: APPLICANT.email },
      { $set: { setupTokenHash: crypto.createHash("sha256").update(TOKEN).digest("hex"), setupTokenExpires: new Date(Date.now() + 3600_000) } }
    )
  );

  await page.goto("/set-password");
  await expect(page.getByRole("heading", { name: "This link is incomplete" })).toBeVisible();

  await page.goto(`/set-password?token=${TOKEN}`);
  await expect(page.getByRole("heading", { name: "Choose your password" })).toBeVisible();
  await page.getByLabel("Password", { exact: true }).fill("weak");
  await page.getByLabel("Confirm password").fill("different");
  await page.getByRole("button", { name: "Save my password" }).click();
  await expect(page.getByText("Your password does not meet all the requirements below.")).toBeVisible();
  await expect(page.getByText("The passwords do not match.")).toBeVisible();

  await page.getByLabel("Password", { exact: true }).fill(APPLICANT.password);
  await page.getByLabel("Confirm password").fill(APPLICANT.password);
  await page.getByRole("button", { name: "Save my password" }).click();
  await expect(page.getByRole("heading", { name: "Your password is saved" })).toBeVisible();
  await expect(page.getByText(APPLICANT.email)).toBeVisible();

  // The link is used up
  await page.goto(`/set-password?token=${TOKEN}`);
  await page.getByLabel("Password", { exact: true }).fill("Another-2026-Pw");
  await page.getByLabel("Confirm password").fill("Another-2026-Pw");
  await page.getByRole("button", { name: "Save my password" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "expired or was already used" })).toBeVisible();

  // And the owner signs in with the email and the password they chose
  await login(page, { email: APPLICANT.email, password: APPLICANT.password });
  await expect(page).toHaveURL(/\/owner\//);
  await page.goto("/owner/venues");
  await expect(page.getByText(APPLICANT.venue)).toBeVisible();
});

test("the admin can reject an application with a reason, and the owner may apply again", async ({ page }) => {
  await fillApplication(page, { email: REJECTED.email, name: REJECTED.venue });
  await expect(page.getByRole("heading", { name: new RegExp(`${REJECTED.venue} is with our team`) })).toBeVisible({ timeout: 30000 });

  await login(page, creds.admin);
  await page.goto("/admin/applications");
  await page.getByRole("link", { name: new RegExp(REJECTED.venue) }).click();
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  // A reason is required
  await expect(page.getByRole("button", { name: "Reject and email" })).toBeDisabled();
  await page.getByLabel("Why are you rejecting it?").fill("The PAN number does not match the certificate.");
  await page.getByRole("button", { name: "Reject and email" }).click();
  await expect(page.getByText("Rejected. The applicant has been emailed.")).toBeVisible();
  await expect(page.getByText("The PAN number does not match the certificate.")).toBeVisible();

  const saved = await withDb(({ db }) => db.collection("venueapplications").findOne({ email: REJECTED.email }));
  expect(saved).toMatchObject({ status: "rejected", reviewNote: "The PAN number does not match the certificate." });
  expect(await withDb(({ db }) => db.collection("users").countDocuments({ email: REJECTED.email }))).toBe(0);

  // It moves to the Rejected tab, and the same email may apply again
  await page.goto("/admin/applications");
  await page.getByRole("tab", { name: "Rejected" }).click();
  await expect(page.getByRole("link", { name: new RegExp(REJECTED.venue) })).toBeVisible();
});

test("a customer cannot open the admin pages", async ({ page }) => {
  test.skip(missingCreds("customer"), "Set the E2E_CUSTOMER_* environment variables (see tests/helpers.js)");
  await login(page, creds.customer);
  await page.goto("/admin/applications");
  await expect(page).not.toHaveURL(/\/admin\/applications/);
});
