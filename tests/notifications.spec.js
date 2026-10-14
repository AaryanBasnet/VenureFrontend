// The notification bell. The feed is faked at the network edge, so these tests never change real notifications.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds } from "./helpers.js";

test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");

const feed = () => [
  { _id: "n1", message: "Riverside Garden Hall sent you a quotation", read: false, link: "/my-inquiries", createdAt: new Date().toISOString() },
  { _id: "n2", message: "Your request was received", read: false, link: "", createdAt: new Date(Date.now() - 3600 * 1000).toISOString() },
  { _id: "n3", message: "Welcome to Venure", read: true, link: "", createdAt: new Date(Date.now() - 86400 * 1000 * 3).toISOString() },
];

test.beforeEach(async ({ page }) => {
  const calls = [];
  const readIds = new Set();
  page.calls = calls;
  // No live socket: other tests send real notifications to this same account while this one runs
  await page.route(/socket\.io/, (route) => route.abort());
  await page.route(/\/notification(\/.*)?$/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    // Behave like the server: what was marked read stays read when the list is fetched again
    if (req.method() === "GET") return route.fulfill({ json: { success: true, data: feed().map((n) => ({ ...n, read: n.read || readIds.has(n._id) || readIds.has("*") })) } });
    calls.push(`${req.method()} ${url.pathname.replace(/^.*\/notification/, "/notification")}`);
    const id = url.pathname.match(/\/notification\/([^/]+)\/read$/)?.[1];
    readIds.add(id ?? "*");
    return route.fulfill({ json: { success: true } });
  });
  await login(page, creds.customer);
});

test("the bell shows the unread count in its name and lists newest first", async ({ page }) => {
  const bell = page.getByRole("button", { name: "Notifications, 2 unread" });
  await expect(bell).toBeVisible();
  await bell.click();
  await expect(bell).toHaveAttribute("aria-expanded", "true");
  const items = page.getByRole("list").filter({ hasText: "Welcome to Venure" }).getByRole("button");
  await expect(items).toHaveCount(3);
  await expect(items.first()).toContainText("sent you a quotation");
  await expect(page.getByRole("button", { name: "Mark all as read" })).toBeVisible();
});

test("opening one notification marks it read and follows its link", async ({ page }) => {
  await page.getByRole("button", { name: "Notifications, 2 unread" }).click();
  await page.getByRole("button", { name: /sent you a quotation/ }).click();
  await expect(page).toHaveURL(/\/my-inquiries$/);
  await expect(page.getByRole("button", { name: "Notifications, 1 unread" })).toBeVisible();
  expect(page.calls).toContain("PATCH /notification/n1/read");
});

test("Mark all as read clears the badge", async ({ page }) => {
  await page.getByRole("button", { name: "Notifications, 2 unread" }).click();
  await page.getByRole("button", { name: "Mark all as read" }).click();
  await expect(page.getByRole("button", { name: "Notifications", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark all as read" })).toHaveCount(0);
  expect(page.calls).toContain("PATCH /notification/read-all");
});

test("an empty feed says so, and Escape closes the panel with focus back on the bell", async ({ page }) => {
  await page.unroute(/\/notification(\/.*)?$/);
  await page.route(/\/notification$/, (route) => route.fulfill({ json: { success: true, data: [] } }));
  await page.reload();
  const bell = page.getByRole("button", { name: "Notifications", exact: true });
  await bell.click();
  await expect(page.getByText(/Nothing new/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText(/Nothing new/)).toBeHidden();
  await expect(bell).toBeFocused();
});
