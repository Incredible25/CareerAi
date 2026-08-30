/**
 * Phase 5, Module 1 — edge-case journeys through the real UI.
 *
 * These specifically target things Module 10's engine-level evaluation
 * harness cannot see (it calls computeCareerFit() directly, bypassing the
 * UI entirely): does the product handle a near-empty profile without
 * crashing or showing a NaN/garbled page, and does step-abandonment
 * (leaving onboarding or the assessment partway through) actually resume
 * correctly rather than losing data or re-prompting from scratch.
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

test.describe("edge case: very limited information", () => {
  const EMAIL = `e2e-minimal-${RUN_ID}@3doors.africa`;

  test.afterAll(async () => {
    await cleanupUser(EMAIL);
    await prisma.$disconnect();
  });

  test("a profile with almost nothing filled in still produces a usable matches page", async ({ page }) => {
    await registerAndLogin(page, EMAIL, "E2E Minimal Info");

    // Education: only the required select, nothing else.
    await page.selectOption("#level", "SECONDARY");
    await page.click('button:has-text("Continue")');

    // Skills: select nothing, just continue.
    await page.click('button:has-text("Continue")');

    // Interests: select nothing, just continue.
    await page.click('button:has-text("Continue")');

    // Preferences: leave the goal blank, keep defaults.
    await page.click('button:has-text("Continue")');

    // Access: finish with defaults.
    await page.click('button:has-text("Finish profile")');
    await page.waitForURL("**/assessment", { timeout: 15_000 });

    // Assessment: answer everything neutral (3).
    for (let screen = 0; screen < 4; screen++) {
      const prompts = page.locator("fieldset");
      const count = await prompts.count();
      for (let i = 0; i < count; i++) {
        await prompts.nth(i).getByRole("button", { name: "3", exact: true }).click();
      }
      await page.getByRole("button", { name: /^(Next|See my results)$/ }).click();
    }
    await page.waitForURL("**/assessment/results", { timeout: 15_000 });

    await page.goto("/matches");
    await expect(page.getByText("Your career matches")).toBeVisible({ timeout: 15_000 });

    // No crash, no garbled output: every visible fit score is a real
    // percentage, not NaN/undefined/empty.
    const scoreTexts = await page.locator("p.font-mono.text-2xl.font-bold.text-green-500").allTextContents();
    expect(scoreTexts.length).toBeGreaterThan(0);
    for (const text of scoreTexts) {
      expect(text).toMatch(/^\d{1,3}%$/);
    }

    // Dashboard should also render cleanly for this sparse profile.
    await page.goto("/dashboard");
    await expect(page.getByText(/welcome/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).not.toContainText("NaN");
    await expect(page.locator("body")).not.toContainText("undefined");
  });
});

test.describe("edge case: onboarding abandonment and resume", () => {
  const EMAIL = `e2e-onb-abandon-${RUN_ID}@3doors.africa`;

  test.afterAll(async () => {
    await cleanupUser(EMAIL);
    await prisma.$disconnect();
  });

  test("leaving onboarding after step 1 redirects protected pages back, and resumes at step 2 (not step 1)", async ({ page }) => {
    await registerAndLogin(page, EMAIL, "E2E Onboarding Abandon");

    await page.selectOption("#level", "UNIVERSITY");
    await page.click('button:has-text("Continue")');
    // Now on step 2 (skills) in-memory, but the server only recorded step 1
    // as saved (onboardingStep=1) — simulate abandoning here by navigating
    // straight to a protected page instead of continuing the wizard.
    await page.goto("/dashboard");
    await page.waitForURL("**/onboarding", { timeout: 15_000 });

    // A fresh load of /onboarding should resume at the Skills step, not
    // restart at Education — confirms the server-persisted step, not just
    // client-side wizard state, drives the resume point.
    await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Step 2 of 5")).toBeVisible();
  });
});

test.describe("edge case: assessment abandonment and resume", () => {
  const EMAIL = `e2e-assess-abandon-${RUN_ID}@3doors.africa`;

  test.afterAll(async () => {
    await cleanupUser(EMAIL);
    await prisma.$disconnect();
  });

  test("leaving the assessment partway shows 'Finish your assessment' and resumes with prior answers intact", async ({ page }) => {
    await registerAndLogin(page, EMAIL, "E2E Assessment Abandon");

    // Fast, minimal onboarding.
    await page.selectOption("#level", "UNIVERSITY");
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Continue")');
    await page.click('button:has-text("Finish profile")');
    await page.waitForURL("**/assessment", { timeout: 15_000 });

    // Answer only the first category (5 questions), then abandon.
    const firstScreenPrompts = page.locator("fieldset");
    const firstScreenCount = await firstScreenPrompts.count();
    for (let i = 0; i < firstScreenCount; i++) {
      await firstScreenPrompts.nth(i).getByRole("button", { name: "5", exact: true }).click();
    }
    await page.goto("/dashboard");

    // The dashboard's next-action should reflect the in-progress state,
    // not treat it as not-started or crash.
    await expect(page.getByText("Finish your assessment")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: "Continue" }).click();
    await page.waitForURL("**/assessment", { timeout: 15_000 });

    // The first question's answer should already be selected (aria-pressed)
    // — confirms answers persisted across the abandonment, not lost.
    const resumedPrompts = page.locator("fieldset");
    await expect(resumedPrompts.first().getByRole("button", { name: "5", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(page.getByText(/5 of 18 answered/i)).toBeVisible();
  });
});
