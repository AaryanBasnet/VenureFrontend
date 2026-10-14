// Messages between a customer and a venue owner, in two browser contexts at once. Message texts are unique per run.
import { test, expect } from "@playwright/test";
import { creds, login, missingCreds, openVenue, signedInContext } from "./helpers.js";

const VENUE = "Riverside Garden Hall";

test.describe("with both accounts", () => {
  test.skip(missingCreds("customer", "owner"), "Set the E2E_* environment variables (see tests/helpers.js)");

  test("the customer messages the venue and the owner replies, live on both sides", async ({ page, browser, baseURL }) => {
    const hello = `e2e hello ${Date.now()}`;
    const reply = `e2e reply ${Date.now()}`;

    await login(page, creds.customer);
    await openVenue(page, VENUE);
    await page.getByRole("button", { name: "Message the venue" }).click();
    await expect(page).toHaveURL(/\/chat$/);
    const box = page.getByRole("textbox", { name: "Type your message" });
    await expect(box).toBeVisible();
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible(); // the conversation title

    // Send is disabled until there is text; Enter sends, Shift+Enter makes a new line
    const send = page.getByRole("button", { name: "Send message" });
    await expect(send).toBeDisabled();
    await box.fill(hello);
    await expect(send).toBeEnabled();
    await box.press("Enter");
    await expect(page.getByRole("log", { name: "Messages" }).getByText(hello)).toBeVisible();
    await expect(box).toHaveValue("");

    const owner = await signedInContext(browser, baseURL, creds.owner);
    try {
      await owner.page.goto("/owner/chat");
      await owner.page.getByRole("button", { name: /Local Customer|Customer/ }).first().click();
      await expect(owner.page.getByRole("log", { name: "Messages" }).getByText(hello)).toBeVisible();

      await owner.page.getByRole("textbox", { name: "Type your message" }).fill(reply);
      await owner.page.getByRole("button", { name: "Send message" }).click();
      await expect(owner.page.getByRole("log", { name: "Messages" }).getByText(reply)).toBeVisible();

      // The customer receives it without reloading
      await expect(page.getByRole("log", { name: "Messages" }).getByText(reply)).toBeVisible();
    } finally {
      await owner.context.close();
    }

    // And it is still there after a reload
    await page.goto("/chat");
    await page.getByRole("button", { name: /Venue Owner/ }).first().click();
    await expect(page.getByRole("log", { name: "Messages" }).getByText(reply)).toBeVisible();
  });
});

test.describe("customer only", () => {
  test.skip(missingCreds("customer"), "Set the E2E_* environment variables (see tests/helpers.js)");

  test("the conversation list can be searched and says when nothing matches", async ({ page }) => {
    await login(page, creds.customer);
    await page.goto("/chat");
    await expect(page.getByRole("heading", { level: 1, name: "Your conversations" })).toBeVisible();
    const search = page.getByRole("searchbox", { name: "Search conversations" });
    await expect(search).toBeVisible();
    await search.fill("zzzz-nobody");
    await expect(page.getByText("No conversation matches that name.")).toBeVisible();
    await search.fill("");
    await expect(page.getByText("No conversation matches that name.")).toHaveCount(0);
  });

  test("a failed conversation list shows an error with Try again, not an empty inbox", async ({ page }) => {
    await login(page, creds.customer);
    let fail = true;
    await page.route(/\/chats(\?.*)?$/, (route) => (fail && route.request().method() === "GET" ? route.fulfill({ status: 500, json: { message: "boom" } }) : route.fallback()));
    await page.goto("/chat");
    await expect(page.getByRole("alert").filter({ hasText: "We could not load your conversations" })).toBeVisible();
    await expect(page.getByText("No conversations yet")).toHaveCount(0);

    fail = false;
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "We could not load your conversations" })).toHaveCount(0);
    await expect(page.getByRole("searchbox", { name: "Search conversations" })).toBeVisible();
  });

  test("a failed message history shows an error with Try again", async ({ page }) => {
    await login(page, creds.customer);
    let fail = true;
    await page.route(/\/chats\/[^/]+\/messages$/, (route) => (fail ? route.fulfill({ status: 500, json: { message: "boom" } }) : route.fallback()));
    await page.goto("/chat");
    await page.getByRole("list").getByRole("button").first().click();
    await expect(page.getByRole("alert").filter({ hasText: "We could not load this conversation" })).toBeVisible();
    fail = false;
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByRole("textbox", { name: "Type your message" })).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("on a phone, opening a conversation moves focus to it and Back returns to the list", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await login(page, creds.customer);
    await page.goto("/chat");
    const first = page.getByRole("list").getByRole("button").first();
    await first.click();
    await expect(page.getByRole("heading", { level: 2 })).toBeFocused();
    const back = page.getByRole("button", { name: "Back to conversations" });
    const box = await back.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(40);
    expect(box.height).toBeGreaterThanOrEqual(40);
    await back.click();
    await expect(page.getByRole("searchbox", { name: "Search conversations" })).toBeFocused();
  });
});

test("the chat page sends a signed-out visitor to sign in", async ({ page }) => {
  await page.goto("/chat");
  await expect(page).toHaveURL(/\/login/);
});
