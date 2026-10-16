// Admin area: every page loads cleanly, and the lists search and filter. Read-only: nothing is approved, deleted or deactivated.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, watchErrors } from "./helpers.js";

test.skip(missingCreds("admin"), "Set the E2E_ADMIN_* environment variables (see tests/helpers.js)");

const PAGES = ["/admin/dashboard", "/admin/user", "/admin/venue", "/admin/contact", "/admin/owner", "/admin/reviews"];

test.beforeEach(async ({ page }) => {
  await login(page, creds.admin);
});

for (const path of PAGES) {
  test(`${path} loads with one h1, a title, and no errors`, async ({ page }) => {
    const errors = watchErrors(page);
    const serverErrors = [];
    page.on("response", (res) => res.status() >= 500 && serverErrors.push(`${res.status()} ${res.url()}`));
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page).toHaveTitle(/Admin/);
    await expect(page.getByRole("main")).toBeVisible();
    expect(errors()).toEqual([]);
    expect(serverErrors).toEqual([]);
  });
}

test("an admin who opens a customer page goes to the admin dashboard", async ({ page }) => {
  await page.goto("/venues");
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
});

test("an old admin address still works (testimonials are reviews now)", async ({ page }) => {
  await page.goto("/admin/testimonial");
  await expect(page).toHaveURL(/\/admin\/reviews$/);
});

test("users: search narrows the table, the role buttons filter, and an admin cannot be deactivated", async ({ page }) => {
  await page.goto("/admin/user");
  const table = page.getByRole("table", { name: "People with an account" });
  await expect(table.getByRole("row")).not.toHaveCount(1);
  const all = await table.getByRole("row").count();

  const search = page.getByRole("searchbox", { name: "Search people" });
  await search.fill(creds.admin.email);
  await expect(table.getByRole("row")).toHaveCount(2); // header + the admin
  await expect(table.getByText("Protected")).toBeVisible();
  await expect(table.getByRole("button", { name: /Deactivate/ })).toHaveCount(0);

  await search.fill("zzzz-nobody-has-this-name");
  await expect(page.getByText(/No one matches/)).toBeVisible();
  await expect(table).toHaveCount(0);
  await search.fill("");
  await expect(page.getByRole("table", { name: "People with an account" }).getByRole("row")).toHaveCount(all);

  const customers = page.getByRole("button", { name: "Customers" });
  await customers.click();
  await expect(customers).toHaveAttribute("aria-pressed", "true");
  await expect(table.getByRole("cell", { name: "Admin", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Admins" }).click();
  await expect(table.getByRole("cell", { name: "Customer", exact: true })).toHaveCount(0);
});

test("reviews: the Featured and Not featured buttons filter the list", async ({ page }) => {
  await page.goto("/admin/reviews");
  const filter = page.getByRole("group", { name: "Show reviews" });
  await expect(filter.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
  const toggles = page.getByRole("switch", { name: "Show on the landing page" });
  await expect(toggles.first()).toBeVisible();
  const total = await toggles.count();

  await filter.getByRole("button", { name: "Featured", exact: true }).click();
  await expect(filter.getByRole("button", { name: "Featured", exact: true })).toHaveAttribute("aria-pressed", "true");
  for (const toggle of await toggles.all()) await expect(toggle).toBeChecked();

  await filter.getByRole("button", { name: "Not featured" }).click();
  await expect(filter.getByRole("button", { name: "Not featured" })).toHaveAttribute("aria-pressed", "true");
  // Either the empty message or only switched-off reviews
  await expect.poll(() => toggles.evaluateAll((els) => els.some((e) => e.getAttribute("aria-checked") === "true"))).toBe(false);

  await filter.getByRole("button", { name: "All" }).click();
  await expect(toggles).toHaveCount(total);
});

test("venues: the status tabs switch and Approved lists the live venues", async ({ page }) => {
  await page.goto("/admin/venue");
  const tabs = page.getByRole("tablist", { name: "Venue status" });
  await expect(tabs.getByRole("tab", { selected: true })).toContainText("Pending");
  await tabs.getByRole("tab", { name: /^Approved/ }).click();
  await expect(tabs.getByRole("tab", { name: /^Approved/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Riverside Garden Hall");

  const search = page.getByRole("searchbox", { name: "Search by venue name" });
  await search.fill("Riverside");
  await expect(page.getByRole("tabpanel")).toContainText("Riverside Garden Hall");
  await expect(page.getByRole("tabpanel")).not.toContainText("Grand Ballroom");
  await search.fill("zzzz-nothing");
  await expect(page.getByRole("tabpanel")).not.toContainText("Riverside Garden Hall");
});

test("owners and messages lists have a working search", async ({ page }) => {
  await page.goto("/admin/owner");
  const table = page.getByRole("table", { name: "Venue owners" });
  const search = page.getByRole("searchbox", { name: "Search owners" });
  await expect(table.getByRole("row")).not.toHaveCount(1);
  await search.fill("zzzz-nobody");
  await expect(table).toHaveCount(0);
  await search.fill("");
  await expect(page.getByRole("table", { name: "Venue owners" }).getByRole("row")).not.toHaveCount(1);

  await page.goto("/admin/contact");
  await expect(page.getByRole("searchbox", { name: "Search messages" })).toBeVisible();
});

test("a customer cannot open the admin area", async ({ browser, baseURL }) => {
  test.skip(missingCreds("customer"), "Set the E2E_CUSTOMER_* environment variables");
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();
  await login(page, creds.customer);
  await page.goto("/admin/user");
  await expect(page).toHaveURL(/\/unauthorized$/);
  await context.close();
});
