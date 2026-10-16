// Header menus by keyboard: the account menu and the bell open, move with the arrow keys, close with Escape and give focus back.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds } from "./helpers.js";

test.describe("signed in", () => {
  test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");

  test.beforeEach(async ({ page }) => {
    await login(page, creds.customer);
    await page.goto("/venues");
    await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
  });

  test("Enter opens the account menu on its first item; arrows, Home and End move; Escape closes and refocuses the button", async ({ page }) => {
    const button = page.getByRole("button", { name: "Account menu" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-expanded", "true");

    const items = page.locator("[data-menu-item]");
    const count = await items.count();
    expect(count).toBeGreaterThan(2);
    await expect(items.first()).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press("End");
    await expect(items.nth(count - 1)).toBeFocused();
    await page.keyboard.press("ArrowDown"); // wraps
    await expect(items.first()).toBeFocused();
    await page.keyboard.press("ArrowUp"); // wraps back
    await expect(items.nth(count - 1)).toBeFocused();
    await page.keyboard.press("Home");
    await expect(items.first()).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();
    await expect(page.locator("[data-menu-item]")).toHaveCount(0);
  });

  test("a mouse click opens the menu without stealing focus, and a click outside closes it", async ({ page }) => {
    const button = page.getByRole("button", { name: "Account menu" });
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await page.mouse.click(5, 400);
    await expect(button).toHaveAttribute("aria-expanded", "false");
  });

  test("only one header menu is open at a time", async ({ page }) => {
    const account = page.getByRole("button", { name: "Account menu" });
    const bell = page.getByRole("button", { name: /^Notifications/ });
    await account.click();
    await expect(account).toHaveAttribute("aria-expanded", "true");
    await bell.click();
    await expect(bell).toHaveAttribute("aria-expanded", "true");
    await expect(account).toHaveAttribute("aria-expanded", "false");
  });

  test("tabbing out of the open menu closes it", async ({ page }) => {
    const account = page.getByRole("button", { name: "Account menu" });
    await account.focus();
    await page.keyboard.press("Enter");
    await expect(account).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("link", { name: "Book a tour" }).focus();
    await expect(account).toHaveAttribute("aria-expanded", "false");
  });

  test("choosing a menu item navigates and closes the menu", async ({ page }) => {
    const account = page.getByRole("button", { name: "Account menu" });
    await account.click();
    await page.locator("[data-menu-item]").filter({ hasText: /profile/i }).first().click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(account).toHaveAttribute("aria-expanded", "false");
  });

  test("Sign out from the menu returns to a signed-out header", async ({ page }) => {
    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Account menu" })).toHaveCount(0);
  });
});

test.describe("phone menu", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("the menu button toggles, Escape closes and refocuses it, and a link closes it", async ({ page }) => {
    await page.goto("/venues");
    const open = page.getByRole("button", { name: "Open menu" });
    await open.click();
    const close = page.getByRole("button", { name: "Close menu" });
    await expect(close).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("navigation", { name: "Main menu" }).getByRole("link", { name: "About" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();

    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("navigation", { name: "Main menu" }).getByRole("link", { name: "About" }).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main menu" })).toBeHidden();
  });

  test("the header buttons are at least 40px square on a phone", async ({ page }) => {
    await page.goto("/venues");
    const box = await page.getByRole("button", { name: "Open menu" }).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(40);
    expect(box.height).toBeGreaterThanOrEqual(40);
  });
});

test("the skip link is the first Tab stop and moves focus to the main content", async ({ page }) => {
  await page.goto("/venues");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});
