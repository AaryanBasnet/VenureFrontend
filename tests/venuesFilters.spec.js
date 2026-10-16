// The venue list: every filter lives in the URL, can be cleared, and an empty result says so.
import { test, expect } from "@playwright/test";

const names = (page) => page.locator("main h2 a");

test("searching by name narrows the list and writes ?q= to the URL", async ({ page }) => {
  await page.goto("/venues");
  await expect(names(page).first()).toBeVisible();
  const total = await names(page).count();
  expect(total).toBeGreaterThan(1);

  await page.getByRole("searchbox", { name: "Search by name" }).fill("Riverside");
  await expect(page).toHaveURL(/[?&]q=Riverside/);
  await expect(names(page)).toHaveCount(1);
  await expect(names(page).first()).toHaveText("Riverside Garden Hall");
});

test("no match shows the empty state, and Clear filters brings every venue back", async ({ page }) => {
  await page.goto("/venues");
  await expect(names(page).first()).toBeVisible();
  const total = await names(page).count();
  await page.getByRole("searchbox", { name: "Search by name" }).fill("zzzz-no-such-venue");
  await expect(page.getByText("No venues match those filters")).toBeVisible();
  await expect(names(page)).toHaveCount(0);

  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page).not.toHaveURL(/q=/);
  await expect(page.getByRole("searchbox", { name: "Search by name" })).toHaveValue("");
  await expect(names(page)).toHaveCount(total);
  await expect(page.getByText("No venues match those filters")).toHaveCount(0);
});

test("a shared link restores the filters (city, type, guests)", async ({ page }) => {
  await page.goto("/venues?city=Pokhara");
  await expect(names(page).first()).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Where" })).toContainText("Pokhara");
  for (const name of await names(page).allTextContents()) expect(name).not.toBe("Riverside Garden Hall");
  await expect(page.getByRole("button", { name: "Clear all filters" })).toBeVisible();

  await page.goto("/venues?category=garden-estates");
  await expect(page.getByRole("radio", { name: /Garden Estates/ })).toBeChecked();
  await expect(page.getByRole("radio", { name: /All types/ })).not.toBeChecked();
  await expect(page.getByRole("button", { name: "Remove filter: Garden estate" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Riverside Garden Hall" })).toBeVisible();

  await page.goto("/venues?guests=250");
  await expect(names(page).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Riverside Garden Hall" })).toHaveCount(0); // holds up to 150
});

test("choosing a type chip and the city updates the URL; Clear all filters resets it", async ({ page }) => {
  await page.goto("/venues");
  await page.getByRole("radio", { name: /Garden Estates/ }).click();
  await expect(page).toHaveURL(/category=garden-estates/);

  await page.getByRole("combobox", { name: "Where" }).click();
  await page.getByRole("option", { name: "Kathmandu" }).click();
  await expect(page).toHaveURL(/city=Kathmandu/);
  await expect(page).toHaveURL(/category=garden-estates/);

  await page.getByRole("button", { name: "Clear all filters" }).click();
  await expect(page).toHaveURL(/\/venues$/);
  await expect(page.getByRole("radio", { name: /All types/ })).toBeChecked();
});

test("sorting by top rated is kept in the URL and puts a rated venue first", async ({ page }) => {
  await page.goto("/venues");
  await page.getByRole("combobox", { name: "Sort by" }).click();
  await page.getByRole("option", { name: "Top rated" }).click();
  await expect(page).toHaveURL(/sort=rating/);
  await expect(names(page).first()).toHaveText("Riverside Garden Hall"); // the only seeded venue with a review
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Sort by" })).toContainText("Top rated");
});

test("amenity filters toggle with aria-pressed and show as a removable chip", async ({ page }) => {
  await page.goto("/venues");
  await expect(page.getByRole("button", { name: "Remove filter: Wifi" })).toHaveCount(0);
  const wifi = page.getByRole("button", { name: "Wifi", exact: true });
  await wifi.click();
  await expect(wifi).toHaveAttribute("aria-pressed", "true");
  await expect(page).toHaveURL(/amenities=Wifi/);
  await expect(page.getByRole("button", { name: "Remove filter: Wifi" })).toBeVisible();
  await wifi.click();
  await expect(page).not.toHaveURL(/amenities=/);
});

test("price range filters by plate price, shows a chip and survives a reload; price sort works", async ({ page }) => {
  await page.goto("/venues?minPrice=3000");
  await expect(page.getByRole("button", { name: /Remove filter: From NPR 3,000 per plate/ })).toBeVisible();
  await expect(names(page)).toHaveCount(1);
  await expect(names(page).first()).toHaveText("Nagarkot Sunrise Lodge"); // the only seeded venue with a food package

  await page.goto("/venues");
  await page.getByRole("textbox", { name: "Maximum price per plate (NPR)" }).fill("3000");
  await expect(page).toHaveURL(/maxPrice=3000/);
  await expect(names(page)).toHaveCount(1);

  await page.getByRole("combobox", { name: "Sort by" }).click();
  await page.getByRole("option", { name: "Price: low to high" }).click();
  await expect(page).toHaveURL(/sort=price_asc/);
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await expect(page).toHaveURL(/sort=price_asc/); // clearing filters keeps the sort
  await expect(names(page).first()).toHaveText("Nagarkot Sunrise Lodge"); // venues without packages come last
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("filters open in a sheet that traps focus, closes with Escape and applies a choice", async ({ page }) => {
    await page.goto("/venues");
    const open = page.getByRole("button", { name: /^Filters/ });
    await open.click();
    const sheet = page.getByRole("dialog", { name: "Filters" });
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(open).toBeFocused();

    await open.click();
    await sheet.getByRole("radio", { name: /Garden Estates/ }).click();
    await expect(page).toHaveURL(/category=garden-estates/);
    await sheet.getByRole("button", { name: /^Show \d+ venue/ }).click();
    await expect(sheet).toHaveCount(0);
    await expect(names(page)).toHaveCount(1);
    await expect(page.getByRole("button", { name: /^Filters/ })).toContainText("1");
  });
});
