// playwright.config.js
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60 * 1000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173",
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 1000 },
    // Set PLAYWRIGHT_CHANNEL=chrome to use an installed Chrome instead of Playwright's own browsers.
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
  },
});
