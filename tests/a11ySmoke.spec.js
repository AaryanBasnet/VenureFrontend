// Accessibility and layout smoke checks over every customer-facing page: structure, labels, focus, reflow, motion.
// These are cheap automated checks, not a replacement for a manual audit with a screen reader.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds } from "./helpers.js";

const PUBLIC = ["/", "/venues", "/about", "/contact", "/login", "/register", "/password-reset", "/unauthorized", "/no-such-page"];
const SIGNED_IN = ["/favorites", "/my-bookings", "/my-inquiries", "/profile", "/chat"];

// Pages known to fail a check today: the reason is the bug. Remove an entry when the page is fixed (the test then runs for real).
const KNOWN = {
  "main landmark": {
    "/login": "the auth layout has no <main> landmark",
    "/register": "the auth layout has no <main> landmark",
    "/password-reset": "the reset flow has no <main> landmark",
  },
  "one h1": {
    "/password-reset": "the reset flow has no <h1> (it starts at h2)",
  },
  "reflow at 640px": {
    "/about": "the venue-type carousel (-mx-5 overflow-x list) is 20px wider than the window",
  },
  "reflow at 320px": {
    "/contact": "the contact form column is 2px wider than a 320px window",
  },
  "tap targets": {
    "/contact": "the email and phone links are 20px tall, under the 24px WCAG 2.2 minimum",
    "/about": "the \"Explore all venues\" text link is 20px tall, under the 24px WCAG 2.2 minimum",
    "/": "the \"Explore all venues\" text link is 20px tall, under the 24px WCAG 2.2 minimum",
  },
};

const structure = () => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible).map((h) => Number(h.tagName[1]));
  const skips = [];
  levels.forEach((l, i) => i > 0 && l > levels[i - 1] + 1 && skips.push(`h${levels[i - 1]} then h${l}`));
  const unlabelled = [...document.querySelectorAll("input,select,textarea")]
    .filter((e) => e.type !== "hidden" && (visible(e) || e.type === "file" || e.type === "checkbox" || e.type === "radio"))
    .filter((e) => {
      if (e.getAttribute("aria-label") || e.getAttribute("aria-labelledby")) return false;
      if (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) return false;
      return !e.closest("label");
    })
    .map((e) => `${e.tagName.toLowerCase()}#${e.id || e.name}`);
  const noAlt = [...document.querySelectorAll("img")].filter((i) => i.getAttribute("alt") === null).map((i) => i.src.slice(-40));
  const unnamed = [...document.querySelectorAll("a[href],button")]
    .filter(visible)
    .filter((e) => !(e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || e.textContent.trim() || e.querySelector("[aria-label],img[alt]:not([alt=''])") || e.title))
    .map((e) => e.outerHTML.slice(0, 90));
  return {
    h1: levels.filter((l) => l === 1).length,
    skips,
    unlabelled,
    noAlt,
    unnamed,
    mains: document.querySelectorAll("main,[role=main]").length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    lang: document.documentElement.lang,
  };
};

async function open(page, path) {
  await page.goto(path);
  await expect(page.locator("h1:visible, h2:visible").first()).toBeVisible();
  await page.waitForLoadState("networkidle");
}

const known = (check, path) => KNOWN[check]?.[path];

test.describe("public pages at 390px", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of PUBLIC) {
    test(`${path}: structure, labels and no sideways scrolling`, async ({ page }) => {
      await open(page, path);
      const r = await page.evaluate(structure);
      expect(r.lang).toBe("en");
      expect(r.overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);
      expect(r.unlabelled, "inputs without a label").toEqual([]);
      expect(r.noAlt, "images without an alt attribute").toEqual([]);
      expect(r.unnamed, "links or buttons with no accessible name").toEqual([]);
      expect(r.skips, "skipped heading levels").toEqual([]);
    });

    test(`${path}: exactly one h1`, async ({ page }) => {
      test.fixme(!!known("one h1", path), known("one h1", path));
      await open(page, path);
      expect((await page.evaluate(structure)).h1).toBe(1);
    });

    test(`${path}: has a main landmark`, async ({ page }) => {
      test.fixme(!!known("main landmark", path), known("main landmark", path));
      await open(page, path);
      expect((await page.evaluate(structure)).mains).toBe(1);
    });
  }
});

test.describe("signed-in pages", () => {
  test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");

  for (const width of [390, 1280]) {
    for (const path of SIGNED_IN) {
      test(`${path} at ${width}px: one h1, one main, labels, no sideways scrolling`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await login(page, creds.customer);
        await open(page, path);
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        const r = await page.evaluate(structure);
        expect(r.mains).toBe(1);
        expect(r.overflow).toBeLessThanOrEqual(0);
        expect(r.unlabelled).toEqual([]);
        expect(r.noAlt).toEqual([]);
        expect(r.unnamed).toEqual([]);
        expect(r.skips).toEqual([]);
      });
    }
  }
});

test.describe("reflow", () => {
  const sizes = [["640px", 640, "200% zoom of a 1280px window"], ["320px", 320, "400% zoom of a 1280px window"]];
  for (const [label, width, what] of sizes) {
    for (const path of ["/", "/venues", "/about", "/contact", "/login"]) {
      test(`${path} at ${label} (${what}): nothing scrolls sideways`, async ({ page }) => {
        test.fixme(!!known(`reflow at ${label}`, path), known(`reflow at ${label}`, path));
        await page.setViewportSize({ width, height: 800 });
        await open(page, path);
        expect((await page.evaluate(structure)).overflow).toBeLessThanOrEqual(0);
      });
    }
  }

  test("WCAG text spacing overrides do not push content off screen on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/venues", "/contact", "/login"]) {
      await open(page, path);
      await page.addStyleTag({
        content: "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }",
      });
      expect((await page.evaluate(structure)).overflow, path).toBeLessThanOrEqual(0);
    }
  });
});

test("keyboard focus is always visible on the main public pages", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  for (const path of ["/", "/venues", "/contact", "/login"]) {
    await open(page, path);
    const hidden = [];
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        if (el.tagName === "IFRAME") return null; // the Google button is a third-party frame
        const s = getComputedStyle(el);
        const ring = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== "none");
        // A focused field inside a wrapper that shows the ring (focus-within) also counts
        const wrapper = el.closest("[class*='focus-within']");
        return { ring: Boolean(ring || wrapper), name: `${el.tagName.toLowerCase()} ${(el.getAttribute("aria-label") || el.textContent || el.name || "").trim().slice(0, 30)}` };
      });
      if (info && !info.ring) hidden.push(info.name);
    }
    expect(hidden, `${path}: focused elements with no visible focus ring`).toEqual([]);
  }
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("smooth scrolling and long CSS animations are switched off", async ({ page }) => {
    await open(page, "/");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
    const longAnimations = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a instanceof CSSAnimation && a.effect.getComputedTiming().duration > 50)
        .map((a) => a.animationName),
    );
    expect(longAnimations).toEqual([]);
  });
});

test.describe("tap targets on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of ["/", "/venues", "/contact", "/login", "/about"]) {
    test(`${path}: header and main controls are at least 24px (WCAG 2.2)`, async ({ page }) => {
      test.fixme(!!known("tap targets", path), known("tap targets", path));
      await open(page, path);
      const small = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll("header a, header button, main a, main button, main input:not([type=hidden]), main select")) {
          const r = el.getBoundingClientRect();
          const s = getComputedStyle(el);
          if (r.width < 2 || r.height === 0 || s.visibility === "hidden") continue;
          if (el.tagName === "A" && s.display === "inline" && el.closest("p")) continue; // a link inside a sentence is exempt
          if (r.height < 24 || r.width < 24) out.push(`${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || el.name || "").trim().slice(0, 25)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
        }
        return out;
      });
      expect(small, "controls smaller than 24px").toEqual([]);
    });
  }
});
