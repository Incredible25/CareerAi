/**
 * The dashboard's single "recommended next step" (Phase 2, Module 7).
 * Extracted from src/app/dashboard/page.tsx, which originally defined
 * this inline — pulled out so it's independently testable and reusable
 * (e.g. by the AI assistant's context, or a future notification) without
 * dragging the whole dashboard page along with it.
 *
 * Deliberately a plain, ordered if-chain over already-computed facts —
 * no AI involved. Order is priority order: earlier checks win, so this
 * always returns exactly one recommendation, never a list.
 */

export type NextActionContext = {
  assessmentStatus: "done" | "in_progress" | "not_started";
  roadmapCount: number;
  doneTasks: number;
  portfolioCount: number;
  // At least one opportunity match with zero eligibility flags — see
  // Phase 4's cap-and-flag matching engine. Optional so callers that
  // don't have opportunity data (e.g. a future non-dashboard caller)
  // can omit it rather than fabricate a value; treated as false.
  hasEligibleOpportunityMatch?: boolean;
};

export type NextAction = {
  label: string;
  href: string;
  body: string;
  cta: string;
};

export function getNextAction(ctx: NextActionContext): NextAction {
  if (ctx.assessmentStatus === "not_started") {
    return {
      label: "Take your self-discovery assessment",
      href: "/assessment",
      body: "About 5 minutes — your career matches are built directly from this.",
      cta: "Start assessment",
    };
  }
  if (ctx.assessmentStatus === "in_progress") {
    return {
      label: "Finish your assessment",
      href: "/assessment",
      body: "You started this — pick up right where you left off.",
      cta: "Continue",
    };
  }
  if (ctx.roadmapCount === 0) {
    return {
      label: "Pick a career to build a plan around",
      href: "/matches",
      body: "Choose any match — you can explore more than one, this isn't exclusive.",
      cta: "See my matches",
    };
  }
  if (ctx.doneTasks === 0) {
    return {
      label: "Start your first roadmap task",
      href: "/matches",
      body: "Open one of your active roadmaps and check off the first step.",
      cta: "View roadmap",
    };
  }
  if (ctx.portfolioCount === 0) {
    return {
      label: "Add your first portfolio project",
      href: "/portfolio",
      body: "Even something small counts — it's proof of what you can do.",
      cta: "Go to portfolio",
    };
  }
  if (ctx.hasEligibleOpportunityMatch) {
    return {
      label: "Check a real opportunity you're eligible for",
      href: "/opportunities",
      body: "At least one verified opportunity matched to you has no eligibility gaps — worth a look while your momentum is fresh.",
      cta: "See my opportunities",
    };
  }
  return {
    label: "Keep going, or ask the assistant what's next",
    href: "/assistant",
    body: "You've got real momentum — the assistant can help you figure out the next concrete step.",
    cta: "Open assistant",
  };
}
