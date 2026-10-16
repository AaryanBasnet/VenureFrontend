// Routing behaviour: 404, access denied, protected pages, return after sign in, document titles, scroll on navigation,
// a session that expires mid-visit, and a backend that is down.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, watchErrors } from "./helpers.js";

test("an unknown address shows the 404 page with a way home", async ({ page }) => {
  await page.goto("/this/page/does-not-exist");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page).toHaveTitle(/Page not found/);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("link", { name: /home/i }).last()).toBeVisible();
  await page.getByRole("link", { name: "Browse venues" }).click();
  await expect(page).toHaveURL(/\/venues$/);
});

test("the access denied page is reachable, has one h1 and a way out", async ({ page }) => {
  await page.goto("/unauthorized");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page).toHaveTitle(/Access denied/);
  await expect(page.getByRole("link", { name: /home/i }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
});

test("owner and admin areas send a signed-out visitor to the sign-in page", async ({ page }) => {
  for (const path of ["/owner/dashboard", "/owner/inquiries", "/admin/dashboard", "/admin/user"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  }
});

test.describe("protected customer pages", () => {
  test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");

  for (const path of ["/my-bookings", "/my-inquiries", "/favorites", "/profile", "/chat"]) {
    test(`${path}: sign in, then land back on it`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
      await page.fill('input[name="email"]', creds.customer.email);
      await page.fill('input[name="password"]', creds.customer.password);
      await page.press('input[name="password"]', "Enter");
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }

  test("a signed-in customer cannot open the owner or admin area", async ({ page }) => {
    await login(page, creds.customer);
    await page.goto("/owner/dashboard");
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/unauthorized$/);
  });

  test("a signed-in customer who opens /login goes back to the site", async ({ page }) => {
    await login(page, creds.customer);
    await page.goto("/login");
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("moving between pages sets the tab title and scrolls to the top", async ({ page }) => {
    await login(page, creds.customer);
    const titles = [
      ["/venues", /^Venues/],
      ["/favorites", /^Favorites/],
      ["/my-inquiries", /^My inquiries/],
      ["/my-bookings", /^My bookings/],
      ["/chat", /^Messages/],
      ["/profile", /^Your profile/],
      ["/about", /^About/],
      ["/contact", /^Contact/],
    ];
    for (const [path, title] of titles) {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
    }

    await page.goto("/venues");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    await page.getByRole("contentinfo").getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/contact$/);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("when the session ends mid-visit the next request sends the visitor to sign in", async ({ page, context }) => {
    await login(page, creds.customer);
    await page.goto("/venues");
    await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
    await page.waitForLoadState("networkidle"); // the header is on screen before the page's own requests: let them finish with the session still valid
    await context.clearCookies(); // the access and refresh tokens are gone
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.locator("[data-menu-item]").filter({ hasText: /inquiries/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("when the session ends the visitor is told why and returns to the same page after signing in", async ({ page, context }) => {
    await login(page, creds.customer);
    await page.goto("/venues");
    await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
    await page.waitForLoadState("networkidle"); // the header is on screen before the page's own requests: let them finish with the session still valid
    await context.clearCookies();
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.locator("[data-menu-item]").filter({ hasText: /inquiries/i }).first().click();
    await expect(page.getByText(/session has expired/i)).toBeVisible();
    await page.fill('input[name="email"]', creds.customer.email);
    await page.fill('input[name="password"]', creds.customer.password);
    await page.press('input[name="password"]', "Enter");
    await expect(page).toHaveURL(/\/my-inquiries$/);
  });
});

test("the venue list explains a backend that is down, and offers a retry", async ({ page }) => {
  const errors = watchErrors(page);
  await page.route(/\/api\/venues(\?.*)?$/, (route) => route.abort("connectionrefused"));
  await page.goto("/venues");
  await expect(page.getByText("We could not load the venues")).toBeVisible();
  await expect(page.getByRole("button", { name: /Try again|Reload/ })).toBeVisible();
  expect(errors().filter((e) => e.startsWith("pageerror"))).toEqual([]);
});

test("a venue page of a server error offers Try again", async ({ page }) => {
  await page.route(/\/venues\/[0-9a-f]{24}$/, (route) => route.fulfill({ status: 500, json: { message: "boom" } }));
  await page.goto("/venue/6acf2c3d15200e26e3de21cd");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse venues" })).toBeVisible();
});

test("a venue id that does not exist says so instead of failing", async ({ page }) => {
  await page.goto("/venue/000000000000000000000000");
  await expect(page.getByRole("heading", { level: 1, name: "We could not find this venue" })).toBeVisible();
});

test("going offline after the page loaded does not break navigation to a cached page", async ({ page, context }) => {
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await context.setOffline(true);
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await context.setOffline(false);
});
