// A customer can send a menu (PDF or photo) with a request, add more later, and the venue owner can open it.
// These run against the real backend and the real file store, so what is checked here is what a visitor gets.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, watchErrors } from "./helpers.js";
import { dbAvailable } from "./db.js";
import { createWorld } from "./world.js";

test.skip(missingCreds("customer", "owner"), "Set the E2E_CUSTOMER_* and E2E_OWNER_* environment variables (see tests/helpers.js)");
test.skip(!dbAvailable, "The local test database is not reachable (set E2E_MONGO_URL to a local MongoDB)");
test.describe.configure({ mode: "serial" });

const PDF = Buffer.from("%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF");
// 1x1 transparent PNG
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
const pdf = (name = "wedding-menu.pdf") => ({ name, mimeType: "application/pdf", buffer: PDF });
const png = (name = "menu-photo.png") => ({ name, mimeType: "image/png", buffer: PNG });

let world;
let day = 340;
const nextDay = () => (day += 2);

test.beforeAll(async ({ playwright }) => {
  world = await createWorld(playwright, "Files");
});
test.afterAll(async () => {
  await world?.dispose();
});

const inquiryFiles = async (inquiry) => (await (await world.api.owner.get(`inquiries/${inquiry._id}`)).json()).data.attachments;

test("the request form takes a menu and sends it with the request", async ({ page }) => {
  const errors = watchErrors(page);
  await login(page, creds.customer);
  await page.goto(`/venue/${world.venueId}/inquire`);
  await page.getByRole("button", { name: "Next month" }).click();
  await page.locator('button[aria-label*=" 26 "]:not([disabled])').first().click();
  await page.getByLabel("Night").check({ force: true });
  await page.fill("#guests", "60");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.selectOption("#eventType", "Wedding");

  // Wrong types and sizes are explained, and nothing is added
  await page.getByLabel(/Attach your menu/).setInputFiles([{ name: "run.exe", mimeType: "application/octet-stream", buffer: Buffer.from("x") }]);
  await expect(page.getByRole("alert").filter({ hasText: "run.exe is not a PDF, JPG, PNG or WebP file." })).toBeVisible();
  await page.getByLabel(/Attach your menu/).setInputFiles([{ name: "big.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) }]);
  await expect(page.getByRole("alert").filter({ hasText: "big.pdf is larger than 5.0 MB." })).toBeVisible();
  await expect(page.getByRole("list", { name: "Files to send" })).toHaveCount(0);

  // A PDF and a photo are added, one can be taken out again, and the button shows the change
  await page.getByLabel(/Attach your menu/).setInputFiles([pdf(), png()]);
  const list = page.getByRole("list", { name: "Files to send" });
  await expect(list.getByRole("listitem")).toHaveCount(2);
  await list.getByRole("button", { name: "Remove menu-photo.png" }).click();
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Add another file" })).toBeVisible();

  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("heading", { name: /Request sent to/ })).toBeVisible();
  await expect(page.getByText("could not attach")).toHaveCount(0);

  // The request carries the file on the server
  const mine = await (await world.api.customer.get("inquiries/my")).json();
  const sent = mine.data.find((i) => i.venue?._id === world.venueId && i.eventType === "Wedding");
  const files = await inquiryFiles(sent);
  expect(files).toHaveLength(1);
  expect(files[0]).toMatchObject({ originalName: "wedding-menu.pdf", mimeType: "application/pdf" });
  expect(errors()).toEqual([]);
});

test("the customer adds and removes files on an open request, and cannot go past three", async ({ page }) => {
  const inquiry = await world.inquiry("customer", { days: nextDay(), eventType: "Birthday" });
  await login(page, creds.customer);
  await page.goto(`/my-inquiries/${inquiry._id}`);

  await expect(page.getByText("No files yet.")).toBeVisible();
  await page.getByLabel("Add a file").setInputFiles([pdf("one.pdf"), png("two.png")]);
  await page.getByRole("button", { name: "Send files" }).click();
  const files = page.getByRole("region", { name: "Your files" });
  await expect(files.getByRole("button", { name: /^one.pdf/ })).toBeVisible();
  await expect(files.getByRole("button", { name: /^two.png/ })).toBeVisible();

  // One more fits, a fourth does not
  await page.getByLabel("Add a file").setInputFiles([pdf("three.pdf"), pdf("four.pdf")]);
  await expect(page.getByRole("alert").filter({ hasText: "You can add up to 1 files." })).toBeVisible();
  await page.getByRole("button", { name: "Send file" }).click();
  await expect(files.getByRole("button", { name: /^three.pdf/ })).toBeVisible();
  await expect(page.getByLabel("Add a file")).toHaveCount(0);

  await files.getByRole("button", { name: "Remove one.pdf" }).click();
  await expect(files.getByRole("button", { name: /^one.pdf/ })).toHaveCount(0);
  expect(await inquiryFiles(inquiry)).toHaveLength(2);
  await expect(page.getByLabel("Add a file")).toBeVisible();
});

test("the venue owner opens the customer's file, and nobody else can", async ({ browser, baseURL, page }) => {
  const inquiry = await world.inquiry("customer", { days: nextDay(), eventType: "Reception" });
  const up = await world.api.customer.post(`inquiries/${inquiry._id}/attachments`, { multipart: { attachments: pdf("owner-sees-this.pdf") } });
  expect(up.status(), await up.text()).toBe(201);
  const [file] = await inquiryFiles(inquiry);

  // The owner sees it on the request and opening it gives the real PDF through a signed link
  const owner = await browser.newContext({ baseURL });
  const ownerPage = await owner.newPage();
  await login(ownerPage, creds.owner);
  await ownerPage.goto(`/owner/inquiries/${inquiry._id}`);
  await expect(ownerPage.getByText("Files from the customer")).toBeVisible();
  const [tab] = await Promise.all([owner.waitForEvent("page"), ownerPage.getByRole("button", { name: /owner-sees-this\.pdf/ }).click()]);
  await tab.waitForURL(/api\.cloudinary\.com/, { timeout: 20000 });
  expect(tab.url()).toContain("signature=");
  await owner.close();

  // The link comes from the API only to people allowed to see the request
  const link = (who) => world.api[who].get(`inquiries/${inquiry._id}/attachments/${file._id}/link`);
  expect((await link("customer")).status()).toBe(200);
  expect((await link("owner")).status()).toBe(200);
  expect((await link("other")).status()).toBe(403);
  const signed = (await (await link("owner")).json()).data.url;
  const fetched = await fetch(signed);
  expect(fetched.status).toBe(200);
  expect(Buffer.from(await fetched.arrayBuffer()).subarray(0, 5).toString()).toBe("%PDF-");
  // The address stored with the file is useless without the signature
  const unsigned = signed.replace(/signature=[^&]+/, "signature=0");
  expect((await fetch(unsigned)).status).toBeGreaterThanOrEqual(400);

  // A closed request keeps its files but cannot change them
  await world.api.customer.put(`inquiries/${inquiry._id}/cancel`);
  await login(page, creds.customer);
  await page.goto(`/my-inquiries/${inquiry._id}`);
  await expect(page.getByLabel("Add a file")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Remove owner-sees-this.pdf" })).toHaveCount(0);
});

test("a file that only claims to be a PDF is refused politely and the site keeps working", async ({ page }) => {
  const inquiry = await world.inquiry("customer", { days: nextDay(), eventType: "Anniversary" });
  await login(page, creds.customer);
  await page.goto(`/my-inquiries/${inquiry._id}`);
  await page.getByLabel("Add a file").setInputFiles([{ name: "fake.pdf", mimeType: "application/pdf", buffer: Buffer.from("this is not a pdf at all") }]);
  await page.getByRole("button", { name: "Send file" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "could not be processed" })).toBeVisible();
  expect(await inquiryFiles(inquiry)).toHaveLength(0);

  // The server is still up and the same request still takes a real file
  expect((await world.api.customer.get("inquiries/my")).status()).toBe(200);
  await page.getByRole("button", { name: "Remove fake.pdf" }).click();
  await page.getByLabel("Add a file").setInputFiles([pdf("real.pdf")]);
  await page.getByRole("button", { name: "Send file" }).click();
  await expect(page.getByRole("button", { name: /^real\.pdf/ })).toBeVisible();
});
