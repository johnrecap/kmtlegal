import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: ".playwright/test-results",
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL,
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    trace: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /consultation-endurance\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] }
    },
    ...(process.env.PLAYWRIGHT_MOBILE_ENGINES === "true" ? [
      { name: "iphone-se-webkit", testMatch: /consultation-endurance\.spec\.ts/, use: { ...devices["iPhone SE"], browserName: "webkit" as const, channel: undefined } },
      { name: "iphone-13-webkit", testMatch: /consultation-endurance\.spec\.ts/, use: { ...devices["iPhone 13"], browserName: "webkit" as const, channel: undefined } },
      { name: "android-chromium", testMatch: /consultation-endurance\.spec\.ts/, use: { ...devices["Pixel 7"], browserName: "chromium" as const, channel: "chrome" } }
    ] : [])
  ]
});
