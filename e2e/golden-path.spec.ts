/**
 * Phase 5, Module 1 — golden-path end-to-end test.
 *
 * Drives the full student journey through the real UI against a real
 * running dev server and real Postgres database: landing page -> register
 * -> onboarding (5 steps) -> assessment (18 questions) -> results ->
 * matches -> career detail -> career plan -> feedback.
 *
 * Requires `npm run dev` running on :3000 and a seeded database
 * (`npm run prisma:seed-all`). Cleans up its own fixture user afterward.
 */
import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/prisma";

const RUN_ID = Date.now();
const EMAIL = `e2e-golden-${RUN_ID}@3doors.africa`;
const PASSWORD = "TestPass123!";
const NAME = "E2E Golden Path";

test.afterAll(async () => {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (user) await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
});

test("landing -> register -> onboarding -> assessment -> matches -> career -> plan -> feedback", async ({ page }) => {
  // Landing page — purpose should be clear without signing in.
  await page.goto("/");
  await expect(page.locator("body")).toContainText(/career/i);

  // Register.
  await page.goto("/register");
  await page.fill("#name", NAME);
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.selectOption("#ageRange", "AGE_19_24");
  await page.selectOption("#country", { index: 1 }); // first real country option
  await page.click('button[type="submit"]');
  await page.waitForURL("**/onboarding", { timeout: 15_000 });

  // Onboarding step 1: education.
  await page.selectOption("#level", "UNIVERSITY");
  await page.fill("#subjects", "Mathematics, Physics, Computer Science");
  await page.fill("#strengths", "Mathematics");
  await page.click('button:has-text("Continue")');

  // Onboarding step 2: skills — select the level pill for the first two skills.
  await expect(page.locator("fieldset").first()).toBeVisible();
  const skillRows = page.locator("fieldset").first().locator("div.flex.flex-wrap.items-center");
  await skillRows.nth(0).getByRole("button", { name: "Beginner" }).click();
  await skillRows.nth(1).getByRole("button", { name: "Beginner" }).click();
  await page.click('button:has-text("Continue")');

  // Onboarding step 3: interests — pick two toggle chips.
  await expect(page.getByRole("button", { name: "Technology & software" })).toBeVisible();
  await page.getByRole("button", { name: "Technology & software" }).click();
  await page.getByRole("button", { name: "Business & entrepreneurship" }).click();
  await page.click('button:has-text("Continue")');

  // Onboarding step 4: preferences.
  await page.fill("#careerGoals", "I want to work in technology");
  await page.fill("#availableHoursPerWeek", "10");
  await page.click('button:has-text("Continue")');

  // Onboarding step 5: access — finishes onboarding, redirects to assessment.
  await page.click('button:has-text("Finish profile")');
  await page.waitForURL("**/assessment", { timeout: 15_000 });

  // Assessment — 18 questions across 4 screens. Each Likert option button's
  // visible/accessible text is the numeric value (1-5); "Agree" is only a
  // title tooltip, not the accessible name. Answer everything "4" (Agree).
  for (let screen = 0; screen < 4; screen++) {
    const prompts = page.locator("fieldset");
    const count = await prompts.count();
    for (let i = 0; i < count; i++) {
      await prompts.nth(i).getByRole("button", { name: "4", exact: true }).click();
    }
    const nextOrSubmit = page.getByRole("button", { name: /^(Next|See my results)$/ });
    await nextOrSubmit.click();
  }
  await page.waitForURL("**/assessment/results", { timeout: 15_000 });
  await expect(page.locator("body")).toContainText(/guidance/i);

  // Matches — should auto-generate since none exist yet, and render the
  // deterministic-scoring disclosure alongside at least one match card.
  await page.goto("/matches");
  await expect(page.getByText("Your career matches")).toBeVisible({ timeout: 15_000 });
  const firstMatchCard = page.locator(".card").first();
  await expect(firstMatchCard).toBeVisible();
  await expect(firstMatchCard.locator("text=/fit score/i")).toBeVisible();

  // Explanation quality — the match card must show at least one concrete
  // reason, not just a bare percentage.
  const reasonsList = firstMatchCard.locator("ul li");
  expect(await reasonsList.count()).toBeGreaterThan(0);

  // Feedback on a match — thumbs up should be clickable and register.
  await firstMatchCard.getByRole("button", { name: /Yes/i }).click();
  await expect(firstMatchCard.getByRole("button", { name: /Yes/i })).toHaveAttribute("aria-pressed", "true");

  // Career exploration — follow through to the career detail and plan pages.
  await firstMatchCard.getByRole("link", { name: "Explore this career" }).click();
  await page.waitForURL(/\/careers\/[^/]+$/, { timeout: 15_000 });
  await expect(page.locator("body")).toContainText(/based on your profile/i);

  await page.goBack();
  await firstMatchCard.getByRole("link", { name: "See my plan" }).click();
  await page.waitForURL(/\/careers\/[^/]+\/plan$/, { timeout: 15_000 });
  await expect(page.locator("body")).toContainText(/roadmap|skill/i);
});
