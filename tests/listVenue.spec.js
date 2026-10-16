// The public "List your venue" page for owners: content, FAQ keyboard behaviour, and the way into the application.
import { test, expect } from "@playwright/test";
import { watchErrors } from "./helpers.js";

const PATH = "/list-your-venue";

test("the page has one h1, the four steps, the checklist and links from the home page and the footer", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(PATH);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("List your venue");
  await expect(page).toHaveTitle(/^List your venue/);
  await expect(page.getByRole("main")).toBeVisible();

  const steps = page.getByRole("list").filter({ has: page.getByRole("heading", { level: 3, name: /Apply/ }) });
  await expect(steps.getByRole("listitem")).toHaveCount(4);
  for (const need of ["Registration and PAN", "Photos", "Hall capacities", "Contact details"]) {
    await expect(page.getByRole("heading", { level: 3, name: need })).toBeVisible();
  }
  // Honest page: no invented money or numbers
  await expect(page.getByText(/commission|% off|guaranteed|per month/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "ask us about fees" })).toHaveCount(0); // inside a closed answer

  // Footer and home page both lead here
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "List your venue" })).toHaveAttribute("href", PATH);
  await page.goto("/");
  await expect(page.getByRole("link", { name: /apply as a venue partner/i })).toHaveAttribute("href", PATH);
  expect(errors()).toEqual([]);
});

test("the contact page's partner topic still works", async ({ page }) => {
  await page.goto("/contact?topic=partner");
  await expect(page.getByRole("radio", { name: "List my venue" })).toBeChecked();
});

test("the FAQ opens and closes with the keyboard and keeps aria-expanded in step", async ({ page }) => {
  await page.goto(PATH);
  const questions = page.getByRole("button", { name: /Who sets the prices\?|How do I get paid\?|What happens when a customer cancels\?|Can I list several venues\?|How long does approval take\?|What does it cost\?/ });
  await expect(questions).toHaveCount(6);

  const first = questions.nth(0);
  const second = questions.nth(1);
  await expect(first).toHaveAttribute("aria-expanded", "false");
  const panelId = await first.getAttribute("aria-controls");
  await expect(page.locator(`#${panelId}`)).toBeHidden();

  await first.focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(`#${panelId}`)).toBeVisible();
  await expect(page.locator(`#${panelId}`)).toContainText("You do");

  await page.keyboard.press("Space");
  await expect(first).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(`#${panelId}`)).toBeHidden();

  // Tab moves to the next question, which opens on its own
  await page.keyboard.press("Tab");
  await expect(second).toBeFocused();
  await page.keyboard.press("Space");
  await expect(second).toHaveAttribute("aria-expanded", "true");
  await expect(first).toHaveAttribute("aria-expanded", "false");

  // The honest answers are there: refund tiers, manual eSewa refunds, no promised time, fees via the contact page
  await questions.nth(2).click();
  const refund = page.locator(`#${await questions.nth(2).getAttribute("aria-controls")}`);
  await expect(refund).toContainText("75%");
  await expect(refund).toContainText("50%");
  await expect(refund).toContainText("paid back manually through eSewa");
  await questions.nth(4).click();
  await expect(page.getByText("we cannot promise a time")).toBeVisible();
  await questions.nth(5).click();
  await expect(page.getByRole("link", { name: "ask us about fees" })).toHaveAttribute("href", "/contact?topic=partner");
});

test("both Apply buttons lead to the application, and there is no account form on the page", async ({ page }) => {
  await page.goto(PATH);
  const apply = page.getByRole("link", { name: /Apply to list your venue|Start your application/ });
  await expect(apply).toHaveCount(2);
  for (const link of await apply.all()) await expect(link).toHaveAttribute("href", "/list-your-venue/apply");
  await expect(page.getByRole("link", { name: "Sign in" }).filter({ hasText: /^Sign in$/ }).last()).toHaveAttribute("href", "/login");
  // No account form on this page any more: owners come in through the application
  await expect(page.getByLabel("Password")).toHaveCount(0);
  await apply.first().click();
  await expect(page).toHaveURL(/\/list-your-venue\/apply$/);
  await expect(page.getByRole("heading", { level: 1, name: "Tell us about your venue" })).toBeVisible();
});

for (const [label, width, height] of [["desktop", 1280, 900], ["phone", 390, 844]]) {
  test(`accessibility basics on ${label}: labels, names, heading order, reflow and the jump to the application`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto(PATH);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForLoadState("networkidle");

    const report = await page.evaluate(() => {
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
      };
      const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible).map((h) => Number(h.tagName[1]));
      const skips = levels.flatMap((l, i) => (i > 0 && l > levels[i - 1] + 1 ? [`h${levels[i - 1]} then h${l}`] : []));
      const unlabelled = [...document.querySelectorAll("input,select,textarea")]
        .filter((e) => e.type !== "hidden")
        .filter((e) => !(e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) || e.closest("label")))
        .map((e) => e.name || e.id);
      // The shared header and footer have their own checks (a11ySmoke.spec.js); this is about this page
      const main = document.querySelector("main");
      const unnamed = [...main.querySelectorAll("a[href],button")]
        .filter(visible)
        .filter((e) => !(e.getAttribute("aria-label") || e.textContent.trim()))
        .map((e) => e.outerHTML.slice(0, 80));
      const badControls = [...document.querySelectorAll("[aria-controls]")].filter((e) => !document.getElementById(e.getAttribute("aria-controls"))).length;
      const noAlt = [...document.querySelectorAll("img")].filter((i) => i.getAttribute("alt") === null).length;
      const small = [...main.querySelectorAll("a[href],button")]
        .filter(visible)
        .filter((e) => e.getBoundingClientRect().height < 24 && getComputedStyle(e).display !== "inline")
        .map((e) => e.outerHTML.slice(0, 60));
      return {
        h1: levels.filter((l) => l === 1).length,
        skips,
        unlabelled,
        unnamed,
        badControls,
        noAlt,
        small,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        lang: document.documentElement.lang,
      };
    });
    expect(report).toMatchObject({ h1: 1, skips: [], unlabelled: [], unnamed: [], badControls: 0, noAlt: 0, small: [], overflow: 0 });
    expect(report.lang).toBeTruthy();

    // The "Start your application" section is the last call to action on the page
    await expect(page.getByRole("heading", { level: 2, name: /Apply to list\s*your venue/ })).toBeVisible();
  });
}
