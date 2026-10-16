// Layout rhythm: no sideways overflow, a sane gap under the header and above the footer, and the
// request form using its width (calendar and options side by side on desktop).
import { test, expect } from "@playwright/test";
import { login, creds, missingCreds } from "./helpers.js";

test.skip(missingCreds("customer"), "needs the customer test account");

const pages = (venueId) => [
  ["/my-inquiries", "My inquiries"],
  ["/my-bookings", "My bookings"],
  ["/favorites", "Favorites"],
  ["/chat", "Chat"],
  ["/terms", "Terms"],
  ["/privacy", "Privacy"],
  [`/venue/${venueId}/inquire`, "Request"],
];

async function metrics(page) {
  return page.evaluate(() => {
    const main = document.getElementById("main-content");
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    // Leaves that carry content (text, images, inputs); the sticky action bar is left out of the bottom measure
    const leaves = [...main.querySelectorAll("*")].filter((e) => {
      const r = e.getBoundingClientRect();
      const content = e.children.length === 0 ? e.textContent.trim() !== "" || /^(IMG|SVG|INPUT|TEXTAREA)$/i.test(e.tagName) : false;
      return content && r.width > 8 && r.height > 8 && getComputedStyle(e).visibility !== "hidden";
    });
    const top = Math.min(...leaves.map((e) => e.getBoundingClientRect().top));
    const flow = leaves.filter((e) => !(e.closest(".sticky") && getComputedStyle(e.closest(".sticky")).position === "sticky"));
    const bottom = Math.max(...flow.map((e) => e.getBoundingClientRect().bottom + window.scrollY));
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      topGap: top - header.getBoundingClientRect().bottom,
      bottomGap: footer.getBoundingClientRect().top + window.scrollY - bottom,
    };
  });
}

for (const width of [1440, 390]) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("customer pages keep the spacing system", async ({ page }) => {
      await login(page, creds.customer);
      await page.goto("/venues");
      const href = await page.locator('a[href^="/venue/"]').first().getAttribute("href");
      const venueId = href.split("/")[2];
      for (const [path, name] of pages(venueId)) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(800);
        const m = await metrics(page);
        expect.soft(m.overflow, `${name}: horizontal overflow`).toBeLessThanOrEqual(0);
        expect.soft(m.topGap, `${name}: gap under the header`).toBeGreaterThanOrEqual(16);
        expect.soft(m.topGap, `${name}: gap under the header`).toBeLessThanOrEqual(64);
        expect.soft(m.bottomGap, `${name}: gap above the footer`).toBeGreaterThanOrEqual(32);
        // The chat panel has a fixed height, so the space inside it is not a gap
        if (name !== "Chat") expect.soft(m.bottomGap, `${name}: gap above the footer`).toBeLessThanOrEqual(220);
      }
    });
  });
}

test.describe("request form, step 1", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("calendar and options sit side by side and fill the width", async ({ page }) => {
    await login(page, creds.customer);
    await page.goto("/venues");
    const href = await page.locator('a[href^="/venue/"]').first().getAttribute("href");
    await page.goto(`${href}/inquire`);
    const calendar = page.locator("#date-field");
    const shift = page.getByRole("group", { name: "Shift" });
    await expect(calendar).toBeVisible();
    const c = await calendar.boundingBox();
    const s = await shift.boundingBox();
    expect(s.x).toBeGreaterThan(c.x + c.width);
    expect(Math.abs(s.y - c.y)).toBeLessThanOrEqual(24); // the legend sits a few pixels above the first card
    const container = await page.locator("#main-content .container-site").first().evaluate((e) => {
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return r.right - parseFloat(cs.paddingRight);
    });
    const right = await page.evaluate(() => Math.max(...[...document.querySelectorAll("#main-content label, #main-content fieldset")].map((e) => e.getBoundingClientRect().right)));
    expect(container - right).toBeLessThanOrEqual(80);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
});
