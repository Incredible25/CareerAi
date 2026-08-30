/**
 * Phase 5, Module 7 — performance & reliability.
 *
 * Targets what Module 10's engine-level harness and the other E2E specs
 * can't see: does the UI actually show a loading state during a slow
 * request, does a genuinely interrupted network request produce a clean
 * error instead of a stuck/broken UI, and does a server error surface the
 * message the server actually sent rather than something generic when a
 * specific one is available.
 */
import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/prisma";

const RUN_ID = Date.now();
const PASSWORD = "TestPass123!";

async function registerAndLogin(page: import("@playwright/test").Page, email: string, name: string) {
  await page.goto("/register");
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.selectOption("#ageRange", "AGE_19_24");
  await page.selectOption("#country", { index: 1 });
  await page.click('button[type="submit"]');
  await page.waitForURL("**/onboarding", { timeout: 15_000 });
}

async function cleanupUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) await prisma.user.delete({ where: { id: user.id } });
}

test.describe("reliability: network interruption", () => {
  const EMAIL = `e2e-network-fail-${RUN_ID}@3doors.africa`;

  test.afterAll(async () => {
    await cleanupUser(EMAIL);
    await prisma.$disconnect();
  });

  test("an aborted onboarding request shows a clear error, not a stuck or broken UI", async ({ page }) => {
    await registerAndLogin(page, EMAIL, "E2E Network Fail");

    await page.route("**/api/onboarding", (route) => route.abort("failed"));

    await page.selectOption("#level", "UNIVERSITY");
    await page.click('button:has-text("Continue")');

    await expect(page.getByText("Couldn't reach the server. Check your connection and try again.")).toBeVisible({
      timeout: 10_000,
    });

    // The form must recover, not stay stuck disabled forever — clear the
    // interception and confirm a retry succeeds.
    await page.unroute("**/api/onboarding");
    await page.click('button:has-text("Continue")');
    await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("reliability: loading state", () => {
  const EMAIL = `e2e-loading-${RUN_ID}@3doors.africa`;

  test.afterAll(async () => {
    await cleanupUser(EMAIL);
    await prisma.$disconnect();
  });

  test("the submit button shows a saving state and is disabled while the request is in flight", async ({ page }) => {
    await registerAndLogin(page, EMAIL, "E2E Loading State");

    await page.route("**/api/onboarding", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    await page.selectOption("#level", "UNIVERSITY");
    const continueButton = page.getByRole("button", { name: /Continue|Saving…/ });
    await continueButton.click();

    await expect(page.getByRole("button", { name: "Saving…" })).toBeDisabled();
    await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("reliability: server error surfaces the real message", () => {
  const EMAIL = `e2e-server-error-${RUN_ID}@3doors.africa`;

  test.afterAll(async () => {
    await cleanupUser(EMAIL);
    await prisma.$disconnect();
  });

  test("a 400 with a specific error message shows that message, not a generic fallback", async ({ page }) => {
    await page.goto("/register");
    await page.fill("#name", "E2E Server Error");
    await page.fill("#email", EMAIL);
    await page.fill("#password", PASSWORD);
    await page.selectOption("#ageRange", "AGE_19_24");
    await page.selectOption("#country", { index: 1 });

    await page.route("**/api/register", (route) =>
      route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "This is a specific server-provided error." }) })
    );

    await page.click('button[type="submit"]');
    await expect(page.getByText("This is a specific server-provided error.")).toBeVisible({ timeout: 10_000 });
  });
});
