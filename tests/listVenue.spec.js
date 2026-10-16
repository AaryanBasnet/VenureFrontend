// The public "List your venue" page for owners: content, FAQ keyboard behaviour, owner sign-up, and what signed-in people see.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, watchErrors } from "./helpers.js";
import { dbAvailable, withDb } from "./db.js";

const PATH = "/list-your-venue";
const stamp = Date.now().toString(36);
const OWNER = { name: "E2E New Owner", email: `e2e-listvenue-${stamp}@example.com`, phone: "9812345678", password: "Owner-Test-1234a" };

async function deleteTestUser(email) {
  if (!dbAvailable) return;
  await withDb(async ({ db }) => {
    const user = await db.collection("users").findOne({ email });
    if (!user) return;
    await db.collection("refreshtokens").deleteMany({ user: user._id });
    await db.collection("users").deleteOne({ _id: user._id });
  });
}

test.afterAll(async () => {
  await deleteTestUser(OWNER.email);
});

test("the page has one h1, the four steps, the checklist and links from the home page and the footer", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto(PATH);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("List your venue");
  await expect(page).toHaveTitle(/^List your venue/);
  await expect(page.getByRole("main")).toBeVisible();

  const steps = page.getByRole("list").filter({ has: page.getByRole("heading", { level: 3, name: /Create an owner account/ }) });
  await expect(steps.getByRole("listitem")).toHaveCount(4);
  for (const need of ["Photos", "Hall capacities", "Package prices per plate", "A contact number"]) {
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

test("sign-up validates, focuses the first error, and needs the terms ticked", async ({ page }) => {
  await page.goto(PATH);
  await page.getByRole("button", { name: "Create owner account" }).click();
  await expect(page.getByText("Enter your full name.")).toBeVisible();
  await expect(page.getByText("Tick the box to agree before creating your account.")).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeFocused();
  await expect(page).toHaveURL(new RegExp(`${PATH}$`));

  const form = page.getByRole("form", { name: "Create a venue owner account" });
  await form.getByLabel("Full name").fill(OWNER.name);
  await form.getByLabel("Phone number").fill("98-12");
  await form.getByLabel("Email address").fill("not-an-email");
  await form.getByLabel("Password", { exact: true }).fill("weak");
  await form.getByLabel("Confirm password").fill("different");
  await page.getByRole("button", { name: "Create owner account" }).click();
  await expect(page.getByText("Use 9 to 15 digits, with no spaces or dashes.")).toBeVisible();
  await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  await expect(page.getByText("The passwords do not match.")).toBeVisible();
  // The links in the consent line open the real pages
  await expect(form.getByRole("link", { name: /terms of use/ })).toHaveAttribute("href", "/terms");
  await expect(form.getByRole("link", { name: /privacy page/ })).toHaveAttribute("href", "/privacy");
});

test("creating an owner account lands on the owner's venues page, and the page then offers the dashboard", async ({ page }) => {
  test.skip(!dbAvailable, "Needs the local database to remove the account it creates");
  await page.goto(PATH);
  const form = page.getByRole("form", { name: "Create a venue owner account" });
  await form.getByLabel("Full name").fill(OWNER.name);
  await form.getByLabel("Phone number").fill(OWNER.phone);
  await form.getByLabel("Email address").fill(OWNER.email);
  await form.getByLabel("Password", { exact: true }).fill(OWNER.password);
  await form.getByLabel("Confirm password").fill(OWNER.password);
  await form.getByLabel(/I agree to Venure/).check();

  const response = page.waitForResponse((r) => r.url().includes("/auth/register") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Create owner account" }).click();
  const status = (await response).status();
  // Registration is limited to a few accounts an hour per IP; a 429 is the limiter working, not a bug in the page.
  test.skip(status === 429, "Registration is IP rate limited locally (HTTP 429): run again later or raise the limit");
  expect(status).toBe(201);

  await expect(page).toHaveURL(/\/owner\/venues$/);
  await expect(page.getByText("Your owner account is ready")).toBeVisible();
  await expect(page.getByRole("button", { name: /add venue/i }).first()).toBeVisible();

  // Back on the page, the same person is offered the dashboard instead of the form
  await page.goto(PATH);
  await expect(page.getByRole("link", { name: "Go to your dashboard" })).toHaveAttribute("href", "/owner/dashboard");
  await expect(page.getByRole("form", { name: "Create a venue owner account" })).toHaveCount(0);
});

test.describe("signed in", () => {
  test("a customer is told they need a separate owner account, with a way to sign out", async ({ page }) => {
    test.skip(missingCreds("customer"), "Set the E2E_CUSTOMER_* environment variables (see tests/helpers.js)");
    await login(page, creds.customer);
    await page.goto(PATH);
    await expect(page.getByText("You are signed in as a customer")).toBeVisible();
    await expect(page.getByText(/separate account/)).toBeVisible();
    await expect(page.getByRole("form", { name: "Create a venue owner account" })).toHaveCount(0);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login/);
    // Signed out, the form is back
    await page.goto(PATH);
    await expect(page.getByRole("form", { name: "Create a venue owner account" })).toBeVisible();
  });

  test("an owner is offered the dashboard", async ({ page }) => {
    test.skip(missingCreds("owner"), "Set the E2E_OWNER_* environment variables (see tests/helpers.js)");
    await login(page, creds.owner);
    await page.goto(PATH);
    await expect(page.getByRole("link", { name: "Go to your dashboard" })).toHaveAttribute("href", "/owner/dashboard");
    await expect(page.getByRole("form", { name: "Create a venue owner account" })).toHaveCount(0);
  });
});

for (const [label, width, height] of [["desktop", 1280, 900], ["phone", 390, 844]]) {
  test(`accessibility basics on ${label}: labels, names, heading order, reflow and the skip to sign-up`, async ({ page }) => {
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

    // The in-page link goes to the sign-up form
    await page.getByRole("link", { name: "Create an owner account" }).first().click();
    await expect(page.getByRole("heading", { level: 2, name: /Create a venue\s*owner account/ })).toBeInViewport();
  });
}
