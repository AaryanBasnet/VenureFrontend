// playwright.config.js
import { defineConfig } from "@playwright/test";

// The write-path specs create, change and delete real records (venues, bookings, reviews, notifications) in the shared
// test database, so they must never run at the same time as the read-only specs or as each other. Each one is its own
// project and each project waits for the one before it.
const WRITE_SPECS = ["ownerWrites", "adminWrites", "inquiryFlows", "bookingLifecycle"];
const writeProjects = WRITE_SPECS.map((name, i) => ({
  name,
  testMatch: new RegExp(String.raw`${name}\.spec\.js$`),
  dependencies: [i === 0 ? "read" : WRITE_SPECS[i - 1]],
}));

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
  projects: [{ name: "read", testIgnore: new RegExp(String.raw`(${WRITE_SPECS.join("|")})\.spec\.js$`) }, ...writeProjects],
});
