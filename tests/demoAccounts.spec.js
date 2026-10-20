// The one-click demo accounts on the login page: each opens a session for its role, says it is a demo,
// and the server refuses changes. Needs a backend seeded with scripts/seed-demo.js (E2E_DEMO=1).
import { test, expect } from "@playwright/test";

test.skip(!process.env.E2E_DEMO, "Set E2E_DEMO=1 with a backend seeded by scripts/seed-demo.js");

const API = process.env.E2E_API_URL || "http://localhost:5053/api";
const open = async (page, name) => {
  await page.goto("/login");
  await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
  await expect(page.getByRole("status").filter({ hasText: "Demo account" })).toBeVisible();
};

test("the login page offers the three demos", async ({ page }) => {
  await page.goto("/login");
  const section = page.getByRole("region", { name: "Just looking around?" });
  await expect(section.getByRole("button")).toHaveCount(3);
});

test("the customer demo signs in and says it is a demo", async ({ page }) => {
  await open(page, "Customer");
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto("/my-inquiries");
  await expect(page.getByRole("heading", { level: 1, name: "Your requests to venues" })).toBeVisible();
  await expect(page.getByText("Kumari Heritage Hall").first()).toBeVisible();
});

test("the owner demo sees the seeded inbox, bookings and earnings", async ({ page }) => {
  await open(page, "Venue owner");
  await expect(page).toHaveURL(/\/owner\/dashboard/);
  await expect(page.getByText("Needs your reply")).toBeVisible();
  await page.goto("/owner/bookings");
  await expect(page.getByRole("tab", { name: /^Upcoming \(\d+\)/ })).toBeVisible();
  await page.goto("/owner/venues");
  await expect(page.getByText("The Darbar Pavilion").first()).toBeVisible();
});

test("the owner demo cannot change anything: the server refuses with a clear message", async ({ page }) => {
  await open(page, "Venue owner");
  const venues = await page.request.get(`${API}/venues/owner/me`);
  const venue = (await venues.json()).data?.venues?.[0] ?? (await venues.json()).data?.[0];
  const res = await page.request.put(`${API}/venues/${venue._id}`, { data: { venueName: "Hijacked" } });
  expect(res.status()).toBe(403);
  expect((await res.json()).message).toMatch(/demo account/);
});

test("the admin demo sees only demo applications", async ({ page }) => {
  await open(page, "Admin");
  await page.goto("/admin/applications");
  await expect(page.getByText("Mustang Mountain Lodge")).toBeVisible();
  const list = await page.request.get(`${API}/venue-applications`);
  const items = (await list.json()).data.items;
  expect(items.length).toBeGreaterThan(0);
  expect(items.every((a) => a.email.endsWith("@demo.venure.invalid"))).toBe(true);
  const users = await page.request.get(`${API}/user/admin/all?page=1&limit=100`);
  expect((await users.json()).data.every((u) => u.email.endsWith("@demo.venure.invalid"))).toBe(true);
});

test("the customer demo can send a request to a demo venue, but not change a profile", async ({ page }) => {
  await open(page, "Customer");
  const venues = await page.request.get(`${API}/venues?limit=1`);
  const venue = (await venues.json()).data[0];
  const date = new Date(Date.now() + 40 * 86400000).toISOString();
  const sent = await page.request.post(`${API}/inquiries`, { data: { venue: venue._id, preferredDate: date, numberOfGuests: 40, eventType: "Birthday", contactName: "Demo", phoneNumber: "9800000000" } });
  expect(sent.status()).toBe(201);
  const profile = await page.request.put(`${API}/user/profile`, { data: { name: "Changed" } });
  expect(profile.status()).toBe(403);
});
