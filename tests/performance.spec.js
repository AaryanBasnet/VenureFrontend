// Guards the "switching pages feels slow" fixes. Thresholds are deliberately generous: they catch a regression back to
// a full-screen splash, a remounted header, no prefetching or a doubled session check, not a few hundred milliseconds.
// Runs against PLAYWRIGHT_BASE_URL (the dev server by default); the checks that only make sense on the optimised
// production build (vite preview, port 4180) are skipped elsewhere.
import { test, expect } from "@playwright/test";

const onPreview = () => new URL(process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173").port === "4180";

// Flags any full-screen status element (a splash or spinner covering the page) that appears after the page has loaded.
const watchSplash = (page) =>
  page.addInitScript(() => {
    window.__splash = false;
    const check = () => {
      if (!document.body) return;
      for (const el of document.querySelectorAll("[role=status]")) {
        if (getComputedStyle(el).position === "fixed" || el.getBoundingClientRect().height >= innerHeight * 0.95) window.__splash = true;
      }
    };
    new MutationObserver(() => window.__armed && check()).observe(document, { childList: true, subtree: true });
  });

const arm = (page) => page.evaluate(() => { window.__armed = true; window.__splash = false; window.__header = document.querySelector("header"); });

test.describe("page switching performance", () => {
  test("a guest's first load asks the auth endpoints at most once", async ({ page }) => {
    const auth = [];
    page.on("request", (r) => { if (/\/api\/auth\//.test(r.url())) auth.push(new URL(r.url()).pathname); });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("main")).toBeVisible();
    expect(auth.length, `auth requests: ${auth.join(", ")}`).toBeLessThanOrEqual(1);
    expect(auth.filter((p) => p.endsWith("/refresh"))).toEqual([]);
  });

  test("the header stays mounted and no full-screen splash appears while switching pages", async ({ page }) => {
    await watchSplash(page);
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
    await page.waitForLoadState("networkidle");
    await arm(page);

    const steps = [
      [async () => page.locator('header a[href="/venues"]:visible').first().click(), /\/venues$/],
      [async () => page.locator('a[href^="/venue/"]:visible').first().click(), /\/venue\/[^/]+$/],
      [async () => page.locator('header a[href="/about"]:visible').first().click(), /\/about$/],
      [async () => page.locator('header a[href="/contact"]:visible').first().click(), /\/contact$/],
    ];
    for (const [act, url] of steps) {
      await act();
      await expect(page).toHaveURL(url);
      await expect(page.locator("main h1").first()).toBeVisible({ timeout: 10000 });
    }
    expect(await page.evaluate(() => document.querySelector("header") === window.__header && window.__header.isConnected), "same <header> element throughout").toBe(true);
    expect(await page.evaluate(() => window.__splash), "a full-screen status/splash appeared").toBe(false);
    await expect(page.locator("footer")).toBeVisible();
  });

  test("hovering a link fetches the next page's code before the click", async ({ page }) => {
    const chunks = [];
    page.on("request", (r) => { if (/ContactUs/.test(r.url()) && /\.(js|jsx)(\?|$)/.test(r.url())) chunks.push(r.url()); });
    await page.goto("/about");
    await expect(page.locator("main h1").first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    const before = chunks.length;
    await page.locator('header a[href="/contact"]:visible').first().hover();
    await expect.poll(() => chunks.length, { timeout: 5000, message: "contact page chunk requested on hover" }).toBeGreaterThan(before);
  });

  test("keyboard focus on a link prefetches it too", async ({ page }) => {
    const chunks = [];
    page.on("request", (r) => { if (/PrivacyPage/.test(r.url()) && /\.(js|jsx)(\?|$)/.test(r.url())) chunks.push(r.url()); });
    await page.goto("/about");
    await expect(page.locator("main h1").first()).toBeVisible();
    await page.waitForLoadState("networkidle");
    const link = page.locator('footer a[href="/privacy"]').first();
    test.skip(!(await link.count()), "the footer has no privacy link");
    const before = chunks.length;
    await link.focus();
    await expect.poll(() => chunks.length, { timeout: 5000 }).toBeGreaterThan(before);
  });

  test("hovering a venue card prefetches that venue's data", async ({ page }) => {
    await page.goto("/venues");
    const card = page.locator('a[href^="/venue/"]:visible').first();
    await expect(card).toBeVisible({ timeout: 15000 });
    const id = (await card.getAttribute("href")).split("/")[2];
    const hits = [];
    page.on("request", (r) => { if (new RegExp(`/api/venues/${id}(\\?|$)`).test(r.url())) hits.push(r.url()); });
    await card.hover();
    await expect.poll(() => hits.length, { timeout: 5000, message: "venue data requested on hover" }).toBeGreaterThan(0);
    await card.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });
    expect(hits.length, "venue data is requested once, not again after the click").toBe(1);
  });

  test("a new page's main heading appears within a loose bound after the click", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const started = Date.now();
    await page.locator('header a[href="/venues"]:visible').first().click();
    await expect(page.locator("main h1").first()).toBeVisible({ timeout: 10000 });
    const took = Date.now() - started;
    expect(took, `took ${took} ms`).toBeLessThan(onPreview() ? 1500 : 8000);
  });

  test("the pages a guest is likely to open next are fetched while the browser is idle", async ({ page }) => {
    test.skip(!onPreview(), "chunk file names are only predictable in the production preview (port 4180)");
    const chunks = [];
    page.on("request", (r) => { if (/assets\/VenuesPage-.*\.js/.test(r.url())) chunks.push(r.url()); });
    await page.goto("/");
    await expect(page.locator("main h1").first()).toBeVisible();
    await expect.poll(() => chunks.length, { timeout: 10000, message: "venues chunk prefetched without any hover" }).toBeGreaterThan(0);
  });
});
