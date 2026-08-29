import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isOnboardingComplete } from "@/lib/onboarding";
import { getLatestCareerMatches, getSideIncomeMatches } from "@/lib/career-engine/generate";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = { title: "Dashboard" };

const BADGES: { key: string; label: string; earned: (ctx: BadgeContext) => boolean }[] = [
  { key: "explorer", label: "Career Explorer", earned: (ctx) => ctx.assessmentDone },
  { key: "skill-builder", label: "Skill Builder", earned: (ctx) => ctx.tasksDone > 0 },
  { key: "portfolio-starter", label: "Portfolio Starter", earned: (ctx) => ctx.portfolioCount > 0 },
  { key: "first-project", label: "First Project", earned: (ctx) => ctx.portfolioCompleted > 0 },
];

type BadgeContext = {
  assessmentDone: boolean;
  tasksDone: number;
  portfolioCount: number;
  portfolioCompleted: number;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const onboardingStep = user.profile?.onboardingStep ?? 0;
  if (!isOnboardingComplete(onboardingStep)) redirect("/onboarding");

  const [
    completedAssessment,
    inProgressAssessment,
    topMatches,
    sideIncomeMatches,
    roadmaps,
    portfolioProjects,
  ] = await Promise.all([
    prisma.assessment.findFirst({ where: { userId: user.id, status: "COMPLETED" }, orderBy: { completedAt: "desc" } }),
    prisma.assessment.findFirst({ where: { userId: user.id, status: "IN_PROGRESS" }, orderBy: { startedAt: "desc" } }),
    getLatestCareerMatches(user.id).then((m) => m.slice(0, 3)),
    getSideIncomeMatches(user.id).then((m) => m.slice(0, 2)),
    prisma.roadmap.findMany({ where: { userId: user.id }, include: { career: true, tasks: true } }),
    prisma.portfolioProject.findMany({ where: { userId: user.id } }),
  ]);

  const firstName = user.name.split(" ")[0] ?? user.name;
  const assessmentStatus = completedAssessment ? "done" : inProgressAssessment ? "in_progress" : "not_started";

  const totalTasks = roadmaps.reduce((sum, r) => sum + r.tasks.length, 0);
  const doneTasks = roadmaps.reduce((sum, r) => sum + r.tasks.filter((t) => t.status === "DONE").length, 0);
  const skillDevelopmentPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const completedProjects = portfolioProjects.filter((p) => p.status === "COMPLETED").length;
  const portfolioPercent = Math.min(100, Math.round((completedProjects / 3) * 100));

  const careerDiscoveryPercent = assessmentStatus === "done" ? 100 : assessmentStatus === "in_progress" ? 50 : 0;

  const badgeContext: BadgeContext = {
    assessmentDone: assessmentStatus === "done",
    tasksDone: doneTasks,
    portfolioCount: portfolioProjects.length,
    portfolioCompleted: completedProjects,
  };
  const earnedBadges = BADGES.filter((b) => b.earned(badgeContext));

  const nextAction = getNextAction({ assessmentStatus, matchCount: topMatches.length, roadmapCount: roadmaps.length, doneTasks, portfolioCount: portfolioProjects.length });

  return (
    <div className="min-h-dvh bg-sand-50 pb-24">
      <AppHeader name={user.name} />

      <main className="mx-auto max-w-5xl px-6 pt-10 sm:px-10">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Welcome, {firstName}</h1>
        <p className="mt-1 text-sm uppercase tracking-[0.14em] text-ink-faint">Access · Excellence · Opportunity</p>

        <div className="card mt-8 border-green-500/30 bg-green-50">
          <span className="badge">Recommended next step</span>
          <h2 className="mt-2 font-display text-xl font-bold text-ink">{nextAction.label}</h2>
          <p className="mt-1.5 max-w-xl text-sm text-ink-soft">{nextAction.body}</p>
          <Link href={nextAction.href} className="btn-primary mt-4 inline-flex">
            {nextAction.cta}
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-1">
            <h2 className="font-display text-base font-bold text-ink">Your progress</h2>
            <div className="mt-4 space-y-4">
              <ProgressRow label="Career discovery" percent={careerDiscoveryPercent} />
              <ProgressRow label="Skill development" percent={skillDevelopmentPercent} note={totalTasks === 0 ? "Pick a career to start a roadmap" : `${doneTasks} of ${totalTasks} tasks done`} />
              <ProgressRow label="Portfolio" percent={portfolioPercent} note={`${completedProjects} completed project${completedProjects === 1 ? "" : "s"}`} />
              <ProgressRow label="Opportunity readiness" percent={0} note="Coming soon" muted />
            </div>

            {earnedBadges.length > 0 && (
              <div className="mt-5 border-t border-sand-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Badges</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {earnedBadges.map((b) => (
                    <span key={b.key} className="badge badge-ai">{b.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-ink">Your career direction</h2>
              <Link href="/matches" className="text-xs font-medium text-green-500 hover:text-orange-500">
                See all matches
              </Link>
            </div>
            {topMatches.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Complete your assessment to see your top career matches.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {topMatches.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg2 border border-sand-200 px-3.5 py-2.5">
                    <div>
                      <p className="text-sm font-medium text-ink">{m.career.name}</p>
                      <p className="text-xs text-ink-faint">{m.career.industry}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-mono text-sm font-bold text-green-500">{m.fitScore}%</p>
                      <Link href={`/careers/${m.career.slug}/plan`} className="text-xs font-medium text-ink-soft hover:text-ink">
                        Plan →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {roadmaps.length > 0 && (
              <div className="mt-4 border-t border-sand-200 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Active roadmaps</p>
                <div className="mt-2 space-y-1.5">
                  {roadmaps.map((r) => {
                    const pct = r.tasks.length > 0 ? Math.round((r.tasks.filter((t) => t.status === "DONE").length / r.tasks.length) * 100) : 0;
                    return (
                      <Link key={r.id} href={`/careers/${r.career.slug}/plan`} className="flex items-center justify-between text-sm text-ink-soft hover:text-ink">
                        <span>{r.career.name}</span>
                        <span className="font-mono text-xs">{pct}%</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card">
            <h2 className="font-display text-sm font-bold text-ink">Side income</h2>
            {sideIncomeMatches.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Complete onboarding to see your top matches.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                {sideIncomeMatches.map((m) => (
                  <li key={m.id} className="flex justify-between">
                    <span>{m.sideOpportunity.name}</span>
                    <span className="font-mono text-xs text-ink-faint">{m.fitScore}%</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/side-income" className="mt-3 inline-block text-xs font-medium text-green-500 hover:text-orange-500">
              See all options →
            </Link>
          </div>

          <div className="card">
            <h2 className="font-display text-sm font-bold text-ink">Portfolio</h2>
            <p className="mt-2 text-sm text-ink-soft">
              {portfolioProjects.length === 0
                ? "Nothing tracked yet."
                : `${portfolioProjects.length} project${portfolioProjects.length === 1 ? "" : "s"}, ${completedProjects} completed.`}
            </p>
            <Link href="/portfolio" className="mt-3 inline-block text-xs font-medium text-green-500 hover:text-orange-500">
              Manage portfolio →
            </Link>
          </div>

          <div className="card">
            <h2 className="font-display text-sm font-bold text-ink">AI career assistant</h2>
            <p className="mt-2 text-sm text-ink-soft">Ask anything about your direction, skills, or plan.</p>
            <Link href="/assistant" className="mt-3 inline-block text-xs font-medium text-green-500 hover:text-orange-500">
              Open assistant →
            </Link>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink">Coming soon</h2>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            3Doors is deliberately not showing job, internship, scholarship, or opportunity listings
            yet — that system requires a verification process we haven&apos;t built, and won&apos;t
            ship until it can guarantee nothing here is invented or unverified.
          </p>
          <div className="card mt-4 opacity-80 sm:max-w-sm">
            <span className="badge">Coming soon — pending approval</span>
            <h3 className="mt-2 font-display text-sm font-bold text-ink">Opportunity matching</h3>
            <p className="mt-1 text-xs text-ink-soft">
              Verified jobs, internships, scholarships, and grants matched to your profile, once built.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function getNextAction(ctx: {
  assessmentStatus: "done" | "in_progress" | "not_started";
  matchCount: number;
  roadmapCount: number;
  doneTasks: number;
  portfolioCount: number;
}) {
  if (ctx.assessmentStatus === "not_started") {
    return { label: "Take your self-discovery assessment", href: "/assessment", body: "About 5 minutes — your career matches are built directly from this.", cta: "Start assessment" };
  }
  if (ctx.assessmentStatus === "in_progress") {
    return { label: "Finish your assessment", href: "/assessment", body: "You started this — pick up right where you left off.", cta: "Continue" };
  }
  if (ctx.roadmapCount === 0) {
    return { label: "Pick a career to build a plan around", href: "/matches", body: "Choose any match — you can explore more than one, this isn't exclusive.", cta: "See my matches" };
  }
  if (ctx.doneTasks === 0) {
    return { label: "Start your first roadmap task", href: "/matches", body: "Open one of your active roadmaps and check off the first step.", cta: "View roadmap" };
  }
  if (ctx.portfolioCount === 0) {
    return { label: "Add your first portfolio project", href: "/portfolio", body: "Even something small counts — it's proof of what you can do.", cta: "Go to portfolio" };
  }
  return { label: "Keep going, or ask the assistant what's next", href: "/assistant", body: "You've got real momentum — the assistant can help you figure out the next concrete step.", cta: "Open assistant" };
}

function ProgressRow({
  label,
  percent,
  note,
  muted,
}: {
  label: string;
  percent: number;
  note?: string;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className={muted ? "text-ink-faint" : "text-ink"}>{label}</span>
        <span className="font-mono text-ink-faint">{muted ? "—" : `${percent}%`}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sand-200">
        <div className={"h-full rounded-full " + (muted ? "bg-sand-300" : "bg-green-500")} style={{ width: muted ? "100%" : `${percent}%` }} />
      </div>
      {note && <p className="mt-1 text-xs text-ink-faint">{note}</p>}
    </div>
  );
}
