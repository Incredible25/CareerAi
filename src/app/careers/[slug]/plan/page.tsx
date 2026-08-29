import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isOnboardingComplete } from "@/lib/onboarding";
import { generateCareerMatches } from "@/lib/career-engine/generate";
import { getCareerPlan } from "@/lib/career-engine/plan";
import { meetsLevel } from "@/lib/career-engine/skill-level";
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

  const [{ gaps, roadmap }, userSkills] = await Promise.all([
    getCareerPlan(user.id, career.id),
    prisma.userSkill.findMany({ where: { userId: user.id }, include: { skill: true } }),
  ]);

  const strengths = career.careerSkills.filter((cs) => {
    const owned = userSkills.find((us) => us.skillId === cs.skillId);
    return owned && meetsLevel(owned.level, cs.level);
  });

  const doneCount = roadmap.tasks.filter((t) => t.status === "DONE").length;
  const roadmapProgress = roadmap.tasks.length > 0 ? Math.round((doneCount / roadmap.tasks.length) * 100) : 0;

  return (
    <div className="min-h-dvh bg-sand-50 pb-24">
      <AppHeader name={user.name} />

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
                  <li key={g.skillId}>
                    {g.skillName}
                    <span className="text-ink-faint"> — aim for {LEVEL_LABELS[g.requiredLevel]}</span>
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
          <Link href="/side-income" className="btn-secondary mt-3 inline-flex !px-4 !py-2 text-sm">
            See side-income options
          </Link>
        </div>
      </main>
    </div>
  );
}
