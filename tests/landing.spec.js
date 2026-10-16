// The home page's copy comes from GET /api/landing (with a bundled fallback), and its venue counts come from the same request.
// The images stay in the frontend and are never part of the content. The admin edit test restores what it changes.
import { test, expect } from "@playwright/test";
import { API_URL, apiAs, creds, missingCreds, watchErrors } from "./helpers.js";

const FALLBACK_TAGLINE = "Handpicked heritage venues across Nepal's most sacred valleys.";
const LANDING_URL = `${API_URL.replace(/\/$/, "")}/landing`;

// A failed or aborted request is logged by the browser as a console error. That is the only error allowed when the API is down.
const NETWORK_NOISE = /Failed to load resource|ERR_FAILED|ERR_CONNECTION|net::|Network Error/i;
const unexpected = (errors) => errors().filter((e) => !NETWORK_NOISE.test(e));

async function currentContent(request) {
  const res = await request.get(LANDING_URL);
  expect(res.status()).toBe(200);
  return (await res.json()).data;
}

test("the home page shows the backend's content, with one h1 and one landing request for its first paint", async ({ page, request }) => {
  const errors = watchErrors(page);
  const requests = [];
  page.on("request", (r) => requests.push(new URL(r.url()).pathname));

  const { content, categoryCounts } = await currentContent(request);
  await page.goto("/");
  await expect(page.getByText(content.hero.tagline)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  // Every editorial section renders its backend copy
  for (const intro of [content.venueTypesIntro, content.storiesIntro, content.seasonsIntro, content.partnerCta]) {
    await expect(page.getByRole("heading", { level: 2, name: new RegExp(intro.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible();
  }
  await expect(page.getByText(content.venueTypesIntro.description)).toBeVisible();
  for (const type of content.venueTypes) {
    await expect(page.locator(`a[href="/venues?category=${type.slug}"]`).first()).toBeAttached();
  }
  for (const season of content.seasons) await expect(page.getByText(season.description)).toBeAttached();

  // Counts per category come from the same response as the copy
  for (const type of content.venueTypes) {
    const count = categoryCounts[type.slug];
    const card = page.locator(`main a[href="/venues?category=${type.slug}"]`).first();
    if (count) await expect(card).toContainText(`${count} ${count === 1 ? "venue" : "venues"}`);
    else await expect(card).not.toContainText(/\d+ venues?/);
  }

  await page.waitForLoadState("networkidle");
  expect(requests.filter((p) => p === "/api/landing")).toHaveLength(1);
  expect(requests.filter((p) => p === "/api/venues/categories/counts")).toHaveLength(0);
  expect(errors()).toEqual([]);
});

test("the story cards lead to a venue or to a category, and the partner button leads to the owner page", async ({ page, request }) => {
  const { content } = await currentContent(request);
  await page.goto("/");
  const stories = page.locator("#stories");
  for (const story of content.stories) {
    const href = story.venueId ? `/venue/${story.venueId}` : `/venues?category=${story.category}`;
    await expect(stories.getByRole("link", { name: story.title })).toHaveAttribute("href", href);
  }
  await expect(page.getByRole("link", { name: /apply as a venue partner/i })).toHaveAttribute("href", "/list-your-venue");
});

test("the endpoint is cacheable and the content holds no image files", async ({ request }) => {
  const res = await request.get(LANDING_URL);
  expect(res.headers()["cache-control"]).toBe("public, max-age=60");
  expect(res.headers().etag).toBeTruthy();
  const text = JSON.stringify((await res.json()).data.content);
  expect(text).not.toMatch(/\.(png|jpe?g|webp|avif|svg)|https?:\/\//i);
});

test("when the API is down the bundled copy still shows, with no console errors beyond the network one", async ({ page }) => {
  const errors = watchErrors(page);
  await page.route("**/api/landing", (route) => route.abort());
  await page.goto("/");
  await expect(page.getByText(FALLBACK_TAGLINE)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 2, name: /Find your\s*perfect space/ })).toBeVisible();
  await expect(page.locator("#stories article")).toHaveCount(3);
  await expect(page.locator("#experiences li")).toHaveCount(4);
  await expect(page.getByRole("link", { name: /apply as a venue partner/i })).toBeVisible();
  await page.waitForLoadState("networkidle");
  expect(unexpected(errors)).toEqual([]);
});

test("while the request is slow the bundled copy is already on screen, then the fetched copy replaces it", async ({ page, request }) => {
  const payload = await currentContent(request);
  const changed = structuredClone(payload);
  changed.content.hero.tagline = "A different tagline from the server.";
  await page.route("**/api/landing", async (route) => {
    await new Promise((r) => setTimeout(r, 1500));
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: changed }) });
  });
  await page.goto("/");
  await expect(page.getByText(FALLBACK_TAGLINE)).toBeVisible();
  await expect(page.getByText(changed.content.hero.tagline)).toBeVisible({ timeout: 10000 });
  await expect(page.getByText(FALLBACK_TAGLINE)).toHaveCount(0);
});

test("an unknown image key in the content never breaks the page", async ({ page, request }) => {
  const payload = await currentContent(request);
  const changed = structuredClone(payload);
  changed.content.stories[0].imageKey = "doesNotExist";
  changed.content.seasons[0].imageKey = "alsoMissing";
  const errors = watchErrors(page);
  await page.route("**/api/landing", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: changed }) }));
  await page.goto("/");
  await expect(page.locator("#stories article")).toHaveCount(3);
  await expect(page.locator("#experiences li")).toHaveCount(4);
  expect(errors()).toEqual([]);
});

test.describe("editing through the admin API", () => {
  test.skip(missingCreds("admin"), "Set the E2E_ADMIN_* environment variables (see tests/helpers.js)");

  test("a change shows on the page after a reload, only an admin can make it, and the original is restored", async ({ page, playwright, request }) => {
    test.setTimeout(90000);
    const admin = await apiAs(playwright, creds.admin);
    const original = (await currentContent(request)).content;
    const edited = structuredClone(original);
    edited.hero.tagline = "E2E edited tagline for the home page.";
    edited.partnerCta.title = "E2E own a venue?";

    try {
      // An anonymous caller cannot write
      const anonymous = await request.put(LANDING_URL, { data: original });
      expect(anonymous.status()).toBe(401);
      // A bad body is refused and nothing changes
      const bad = await admin.put("landing", { data: { ...edited, hero: { tagline: "" } } });
      expect(bad.status()).toBe(400);

      const res = await admin.put("landing", { data: edited });
      expect(res.status()).toBe(200);

      await page.goto("/");
      await expect(page.getByText(edited.hero.tagline)).toBeVisible();
      await expect(page.getByRole("heading", { level: 2, name: /E2E own a venue\?/ })).toBeVisible();
    } finally {
      const restored = await admin.put("landing", { data: original });
      expect(restored.status()).toBe(200);
      await admin.dispose();
    }

    expect((await currentContent(request)).content.hero.tagline).toBe(original.hero.tagline);
  });
});
