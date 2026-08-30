import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 5, Module 1 — end-to-end product testing.
 *
 * Runs against a real running dev server and a real Postgres database,
 * exactly like a real user's browser — no mocking. `webServer` starts
 * `next dev` automatically if nothing is already listening on :3000
 * (reuses an already-running one locally, e.g. during manual QA).
 *
 * PLAYWRIGHT_CHROMIUM_PATH lets a sandboxed dev environment point at a
 * pre-installed Chromium (see CLAUDE environment notes:
 * PLAYWRIGHT_BROWSERS_PATH) instead of downloading one; CI installs its
 * own via `npx playwright install --with-deps chromium` and leaves this
 * unset.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    launchOptions: {
      // Phase 5, Module 8: mobile-emulation device presets (isMobile:
      // true, e.g. devices["iPhone SE"]) hit Chromium's zygote sandbox
      // restriction when the test runner itself is root (this sandbox,
      // and some CI containers) — --no-sandbox is the standard, safe fix
      // for a test-runner Chromium in a containerized environment.
      args: ["--no-sandbox"],
      ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}),
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
