// A customer saves a venue from the list, finds it under Favorites, and removes it again.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds } from "./helpers.js";

test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");

test("save and remove a favorite venue", async ({ page }) => {
  await login(page, creds.customer);
  await page.goto("/venues");

  const heart = page.getByRole("button", { name: /^Save .* to favorites$/ }).first();
  const label = await heart.getAttribute("aria-label");
  const venueName = label.replace(/^Save /, "").replace(/ to favorites$/, "");
  await heart.click();
  await expect(page.getByRole("button", { name: `Remove ${venueName} from favorites` })).toBeVisible();

  await page.goto("/favorites");
  await expect(page.getByRole("heading", { name: "Venues you saved" })).toBeVisible();
  await expect(page.getByRole("link", { name: venueName })).toBeVisible();

  await page.getByRole("button", { name: `Remove ${venueName} from favorites` }).click();
  await expect(page.getByRole("link", { name: venueName })).toHaveCount(0);
});
