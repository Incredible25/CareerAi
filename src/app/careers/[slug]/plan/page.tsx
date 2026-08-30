import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isOnboardingComplete } from "@/lib/onboarding";
import { buildUserProfileInput, generateCareerMatches } from "@/lib/career-engine/generate";
import { getCareerPlan } from "@/lib/career-engine/plan";
import { meetsLevel } from "@/lib/career-engine/skill-level";
import { computeSideIncomeFit } from "@/lib/career-engine/scoring";
import { AppHeader } from "@/components/app-header";
import { RoadmapPhases } from "@/components/plan/roadmap-phases";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const career = await prisma.careerProfile.findUnique({ where: { slug: params.slug } });
  return { title: career ? `Your plan · ${career.name}` : "Your plan" };
}

const LEVEL_LABELS = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" } as const;

export default async function CareerPlanPage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile || !isOnboardingComplete(user.profile.onboardingStep)) redirect("/onboarding");

  const career = await prisma.careerProfile.findUnique({
    where: { slug: params.slug },
    include: { careerSkills: { include: { skill: true } } },
  });
  if (!career) notFound();

  let match = await prisma.careerMatch.findFirst({
    where: { userId: user.id, careerId: career.id },
    orderBy: { generatedAt: "desc" },
  });
  if (!match) {
    const generated = await generateCareerMatches(user.id);
    if (!generated) redirect("/assessment");
    match = await prisma.careerMatch.findFirst({
      where: { userId: user.id, careerId: career.id },
      orderBy: { generatedAt: "desc" },
    });
  }

  const [{ gaps, roadmap }, userSkills, linkedSideOpportunities] = await Promise.all([
    getCareerPlan(user.id, career.id),
    prisma.userSkill.findMany({ where: { userId: user.id }, include: { skill: true } }),
    prisma.careerSideOpportunity.findMany({
      where: { careerId: career.id },
      include: { sideOpportunity: { include: { skills: { include: { skill: true } } } } },
    }),
  ]);

  // Curated (editorial) links, not a generated match — see
  // prisma/seed-career-links.ts. The fit score alongside each one *is*
  // generated, using the same deterministic scoring the full
  // /side-income catalog uses, just scoped to this career's linked
  // subset rather than recomputing (and persisting) the whole catalog
  // on every plan-page view.
  const linkedSideIncome =
    linkedSideOpportunities.length > 0
      ? await (async () => {
          const profileInput = await buildUserProfileInput(user.id);
          return linkedSideOpportunities
            .map((link) => {
              const opp = link.sideOpportunity;
              const result = computeSideIncomeFit(profileInput, {
                id: opp.id,
                skills: opp.skills.map((s) => ({ skillId: s.skillId, name: s.skill.name, level: s.level })),
              });
              return { opportunity: opp, result };
            })
            .sort((a, b) => b.result.fitScore - a.result.fitScore);
        })()
      : [];

  const strengths = career.careerSkills.filter((cs) => {
    const owned = userSkills.find((us) => us.skillId === cs.skillId);
    return owned && meetsLevel(owned.level, cs.level);
  });

  const doneCount = roadmap.tasks.filter((t) => t.status === "DONE").length;
  const roadmapProgress = roadmap.tasks.length > 0 ? Math.round((doneCount / roadmap.tasks.length) * 100) : 0;

  return (
    <div className="min-h-dvh bg-sand-50 pb-24">
      <AppHeader name={user.name} isAdmin={user.role === "ADMIN"} />

      <main className="mx-auto max-w-3xl px-6 pt-10 sm:px-10">
        <Link href="/matches" className="text-sm font-medium text-ink-soft hover:text-ink">
          ← All matches
        </Link>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <span className="badge">{career.industry}</span>
            <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">Your plan for {career.name}</h1>
          </div>
          {match && (
            <div className="text-right">
              <p className="font-mono text-2xl font-bold text-green-500">{match.fitScore}%</p>
              <p className="text-xs text-ink-faint">fit score</p>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="card">
            <h2 className="font-display text-sm font-bold text-ink">Current strengths</h2>
            {strengths.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">
                Nothing yet at the level this career expects — that&apos;s exactly what the roadmap below is for.
              </p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {strengths.map((s) => (
                  <span key={s.id} className="badge">{s.skill.name}</span>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <h2 className="font-display text-sm font-bold text-ink">Skills to develop</h2>
            {gaps.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">You already meet every core skill listed for this career.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                {gaps.map((g) => (
                  <li key={g.skillId} className="flex items-center gap-1.5">
                    <span>
                      {g.skillName}
                      <span className="text-ink-faint"> — aim for {LEVEL_LABELS[g.requiredLevel]}</span>
                    </span>
                    {g.isQuickWin && (
                      <span className="badge whitespace-nowrap border-green-500 text-green-500">Quick win</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card mt-6">
          <div className="flex items-center justify-between text-sm">
            <h2 className="font-display text-sm font-bold text-ink">Roadmap progress</h2>
            <span className="font-mono text-ink-faint">{roadmapProgress}% · {roadmap.totalWeeks}-week plan</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-sand-200">
            <div className="h-full rounded-full bg-green-500" style={{ width: `${roadmapProgress}%` }} />
          </div>
        </div>

        <div className="mt-6">
          <RoadmapPhases tasks={roadmap.tasks} />
        </div>

        <div className="card mt-8 border-navy-500/20 bg-navy-50">
          <h2 className="font-display text-sm font-bold text-ink">While you&apos;re building these skills</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            See what you could realistically start earning from with the skills you already have —
            it doesn&apos;t need to wait until this roadmap is finished.
          </p>

          {linkedSideIncome.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                Linked to {career.name}
              </p>
              {linkedSideIncome.map(({ opportunity, result }) => (
                <div key={opportunity.id} className="flex items-center justify-between rounded-lg2 border border-navy-500/15 bg-white px-3.5 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink">{opportunity.name}</p>
                    <p className="text-xs text-ink-faint">{opportunity.description}</p>
                  </div>
                  <p className="flex-none font-mono text-sm font-bold text-green-500">{result.fitScore}%</p>
                </div>
              ))}
            </div>
          )}

          <Link href="/side-income" className="btn-secondary mt-4 inline-flex !px-4 !py-2 text-sm">
            {linkedSideIncome.length > 0 ? "See all side-income options" : "See side-income options"}
          </Link>
        </div>
      </main>
    </div>
  );
}
