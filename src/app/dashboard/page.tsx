import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isOnboardingComplete, onboardingCompletenessPercent } from "@/lib/onboarding";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = { title: "Dashboard" };

const COMING_SOON = [
  { title: "Career matches", phase: "Phase 2", body: "Your ranked, scored career paths, generated from your profile and assessment." },
  { title: "Skill development", phase: "Phase 2", body: "A skill-gap breakdown and a 90-day roadmap for the direction you choose." },
  { title: "Side income", phase: "Phase 3", body: "What you could realistically start earning from with the skills you have right now." },
  { title: "Opportunities", phase: "Phase 5", body: "Verified jobs, internships, and scholarships matched to your profile." },
  { title: "Portfolio", phase: "Phase 6", body: "A place to track and showcase the projects you complete along the way." },
  { title: "AI career assistant", phase: "Phase 4", body: "Ask open questions about your path anytime, answered using your own profile." },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const onboardingStep = user.profile?.onboardingStep ?? 0;
  const onboardingDone = isOnboardingComplete(onboardingStep);
  if (!onboardingDone) redirect("/onboarding");

  const [education, userSkills, userInterests, completedAssessment, inProgressAssessment] =
    await Promise.all([
      prisma.education.findFirst({ where: { userId: user.id, isCurrent: true } }),
      prisma.userSkill.findMany({ where: { userId: user.id }, include: { skill: true } }),
      prisma.userInterest.findMany({ where: { userId: user.id }, include: { interest: true } }),
      prisma.assessment.findFirst({
        where: { userId: user.id, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
      }),
      prisma.assessment.findFirst({
        where: { userId: user.id, status: "IN_PROGRESS" },
        orderBy: { startedAt: "desc" },
      }),
    ]);

  const firstName = user.name.split(" ")[0] ?? user.name;
  const profileCompleteness = onboardingCompletenessPercent(onboardingStep);

  const assessmentStatus = completedAssessment
    ? "done"
    : inProgressAssessment
      ? "in_progress"
      : "not_started";

  const nextAction =
    assessmentStatus === "not_started"
      ? { label: "Take your self-discovery assessment", href: "/assessment", body: "About 5 minutes — this is what your future career matches will be built from." }
      : assessmentStatus === "in_progress"
        ? { label: "Finish your assessment", href: "/assessment", body: "You started this — pick up right where you left off." }
        : { label: "Review your self-discovery profile", href: "/assessment/results", body: "Career matches built from this will appear here as soon as the recommendation engine ships." };

  return (
    <div className="min-h-dvh bg-sand-50 pb-24">
      <AppHeader name={user.name} />

      <main className="mx-auto max-w-5xl px-6 pt-10 sm:px-10">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Welcome, {firstName}</h1>
        <p className="mt-1 text-sm uppercase tracking-[0.14em] text-ink-faint">
          Access · Excellence · Opportunity
        </p>

        {/* Recommended next action */}
        <div className="card mt-8 border-green-500/30 bg-green-50">
          <span className="badge">Recommended next step</span>
          <h2 className="mt-2 font-display text-xl font-bold text-ink">{nextAction.label}</h2>
          <p className="mt-1.5 max-w-xl text-sm text-ink-soft">{nextAction.body}</p>
          <Link href={nextAction.href} className="btn-primary mt-4 inline-flex">
            {assessmentStatus === "done" ? "View results" : "Continue"}
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Progress */}
          <div className="card lg:col-span-1">
            <h2 className="font-display text-base font-bold text-ink">Your progress</h2>
            <div className="mt-4 space-y-4">
              <ProgressRow label="Career discovery" percent={profileCompleteness} />
              <ProgressRow
                label="Self-discovery assessment"
                percent={assessmentStatus === "done" ? 100 : assessmentStatus === "in_progress" ? 40 : 0}
              />
              <ProgressRow label="Skill development" percent={0} note="Starts in Phase 2" />
              <ProgressRow label="Opportunity readiness" percent={0} note="Starts in Phase 3" />
            </div>
          </div>

          {/* Snapshot */}
          <div className="card lg:col-span-2">
            <h2 className="font-display text-base font-bold text-ink">Your snapshot</h2>
            {!education && userSkills.length === 0 && userInterests.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Nothing here yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {education && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      Education
                    </p>
                    <p className="mt-1 text-sm text-ink">
                      {education.program ? `${education.program} · ` : ""}
                      {education.level.charAt(0) + education.level.slice(1).toLowerCase()}
                    </p>
                  </div>
                )}
                {userSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      Skills
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {userSkills.map((us) => (
                        <span key={us.id} className="badge">
                          {us.skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {userInterests.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      Interests
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {userInterests.map((ui) => (
                        <span key={ui.id} className="badge">
                          {ui.interest.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Coming soon */}
        <div className="mt-10">
          <h2 className="font-display text-lg font-bold text-ink">The rest of your path</h2>
          <p className="mt-1 text-sm text-ink-soft">
            These unlock as the next phases ship — nothing below is fabricated data, it&apos;s
            simply not built yet.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMING_SOON.map((item) => (
              <div key={item.title} className="card opacity-80">
                <span className="badge">{item.phase}</span>
                <h3 className="mt-2 font-display text-sm font-bold text-ink">{item.title}</h3>
                <p className="mt-1 text-xs text-ink-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProgressRow({
  label,
  percent,
  note,
}: {
  label: string;
  percent: number;
  note?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink">{label}</span>
        <span className="font-mono text-ink-faint">{percent}%</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sand-200">
        <div className="h-full rounded-full bg-green-500" style={{ width: `${percent}%` }} />
      </div>
      {note && <p className="mt-1 text-xs text-ink-faint">{note}</p>}
    </div>
  );
}
