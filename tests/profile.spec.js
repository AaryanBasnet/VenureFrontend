// The profile page and its edit dialog: validation, keyboard behaviour, a real save (restored afterwards) and the signed-out redirect.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, watchErrors } from "./helpers.js";

test.describe("signed in", () => {
  test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");

  test.beforeEach(async ({ page }) => {
    await login(page, creds.customer);
    await page.goto("/profile");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows the account details, one h1 and the three activity links", async ({ page }) => {
    const errors = watchErrors(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page).toHaveTitle(/Your profile/);
    await expect(page.getByText(creds.customer.email, { exact: true })).toBeVisible();
    const activity = page.getByRole("complementary", { name: "Your activity" });
    for (const name of [/My inquiries/, /My bookings/, /Favorites/]) await expect(activity.getByRole("link", { name })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors()).toEqual([]);
  });

  test("the edit dialog validates, traps Tab, closes on Escape and gives focus back", async ({ page }) => {
    const edit = page.getByRole("button", { name: "Edit profile" });
    await edit.click();
    const dialog = page.getByRole("dialog", { name: "Edit profile" });
    await expect(dialog).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeFocused();

    await page.getByLabel("Full name").fill("");
    await page.getByLabel("Phone").fill("not a number");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(dialog.getByText("Please enter your name.")).toBeVisible();
    await expect(dialog.getByText(/Enter a phone number with 7 to 15 digits/)).toBeVisible();
    await expect(page.getByLabel("Full name")).toBeFocused();
    await expect(page.getByLabel("Full name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Phone")).toHaveAttribute("aria-describedby", "p-phone-error");

    // Tab and Shift+Tab stay inside the dialog
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(edit).toBeFocused();
  });

  test("a photo that is too big or not an image is refused before upload", async ({ page }) => {
    await page.getByRole("button", { name: "Edit profile" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit profile" });
    const save = dialog.getByRole("button", { name: "Save changes" });

    await dialog.locator("#avatar").setInputFiles({ name: "big.jpg", mimeType: "image/jpeg", buffer: Buffer.alloc(5 * 1024 * 1024 + 10) });
    await save.click();
    await expect(dialog.getByText("Please choose an image under 5 MB.")).toBeVisible();

    await dialog.locator("#avatar").setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await save.click();
    await expect(dialog.getByText(/Please choose an image file/)).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test("saving changes the address on the page, and the old value can be put back", async ({ page }) => {
    const original = (await page.locator("dt", { hasText: "Address" }).locator("xpath=following-sibling::dd[1]").innerText()).trim();
    const changed = `E2E address ${Date.now()}`;
    const setAddress = async (value) => {
      await page.getByRole("button", { name: "Edit profile" }).click();
      await page.getByLabel("Address").fill(value);
      await page.getByRole("button", { name: "Save changes" }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
    };
    try {
      await setAddress(changed);
      await expect(page.getByText(changed)).toBeVisible();
      await page.reload();
      await expect(page.getByText(changed)).toBeVisible();
    } finally {
      if (original && !/^Add address$/.test(original)) await setAddress(original);
    }
    await expect(page.getByText(changed)).toHaveCount(0);
  });
});

test("a signed-out visitor is sent to sign in and returns to the profile", async ({ page }) => {
  test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login/);
  await page.fill('input[name="email"]', creds.customer.email);
  await page.fill('input[name="password"]', creds.customer.password);
  await page.press('input[name="password"]', "Enter");
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
