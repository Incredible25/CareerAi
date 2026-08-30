/**
 * Phase 5, Module 8 — mobile UX regression coverage.
 *
 * Runs against a narrow 320px viewport — the original iPhone SE's width,
 * genuinely the most cramped common device width and a reasonable stand-
 * in for a budget Android phone too — the same width the Module 8 visual
 * walkthrough used to find the bug this file guards against. Deliberately
 * a plain narrow viewport rather than a full mobile-emulation device
 * preset (touch/isMobile flags): the thing under test is a pure CSS
 * layout overflow, which a narrow viewport reproduces faithfully without
 * depending on this sandbox's headless Chromium's flakier mobile-
 * emulation code path (D-Bus/touch-emulation launch failures observed
 * here, unrelated to the product).
 */
import { test, expect } from "@playwright/test";
import { prisma } from "@/lib/prisma";

test.use({ viewport: { width: 320, height: 568 } });

const RUN_ID = Date.now();
const PASSWORD = "TestPass123!";

test.describe("mobile: no horizontal overflow on a 320px device", () => {
  const EMAIL = `e2e-mobile-overflow-${RUN_ID}@3doors.africa`;

  test.afterAll(async () => {
    const user = await prisma.user.findUnique({ where: { email: EMAIL } });
    if (user) await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  });

  test("the skills step (74 items, 4 tap-target buttons each) doesn't overflow the viewport", async ({ page }) => {
    await page.goto("/register");
    await page.fill("#name", "E2E Mobile Overflow");
    await page.fill("#email", EMAIL);
    await page.fill("#password", PASSWORD);
    await page.selectOption("#ageRange", "AGE_16_18");
    await page.selectOption("#country", { index: 1 });
    await page.click('button[type="submit"]');
    await page.waitForURL("**/onboarding", { timeout: 15_000 });

    await page.selectOption("#level", "SECONDARY");
    await page.click('button:has-text("Continue")');
    await page.waitForSelector("text=Skills", { timeout: 10_000 });

    // Regression check for the Phase 5 Module 8 finding: 4 pill buttons
    // ("Not yet" / "Beginner" / "Intermediate" / "Advanced") per skill row
    // overflowed a 320px-wide device before skills-step.tsx added
    // flex-wrap — "Advanced" was cut off and unreachable without
    // discovering horizontal scroll, across all 74 seeded skills.
    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflows).toBe(false);

    // Every level button for the first skill row must be fully clickable
    // within the viewport, not just present in the DOM.
    const viewportWidth = page.viewportSize()!.width;
    const advancedButton = page.locator("fieldset").first().locator("button", { hasText: "Advanced" }).first();
    const box = await advancedButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth);
  });
});
