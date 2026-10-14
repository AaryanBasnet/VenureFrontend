// The Terms and Privacy pages exist, say what they are, and are linked from the footer and the register consent line.
import { test, expect } from "@playwright/test";

for (const [path, title] of [["/terms", "Terms of use"], ["/privacy", "Privacy"]]) {
  test(`${path} is a short plain-language page with the not-legal-advice note`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("It is not legal advice.")).toBeVisible();
    await expect(page).toHaveTitle(new RegExp(`^${title}`));
    await expect(page.getByRole("main")).toBeVisible();
  });
}

test("the footer and the register consent line link to both pages", async ({ page }) => {
  await page.goto("/about");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Terms of use" })).toHaveAttribute("href", "/terms");
  await expect(footer.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  await page.goto("/register");
  await expect(page.getByRole("link", { name: /terms of use/ })).toHaveAttribute("href", "/terms");
  await expect(page.getByRole("link", { name: /privacy page/ })).toHaveAttribute("href", "/privacy");
});

test("a signed-out visitor sent to sign in from an owner page is remembered", async ({ page }) => {
  await page.goto("/owner/inquiries");
  await expect(page).toHaveURL(/\/login/);
  expect(await page.evaluate(() => history.state?.usr?.from)).toBe("/owner/inquiries");
});
