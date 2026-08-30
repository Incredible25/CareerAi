import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/logo";
import { TRAIT_LABELS, type TraitScores } from "@/lib/assessment/scoring";
import { ASSESSMENT_CATEGORIES, ASSESSMENT_QUESTIONS, type TraitKey } from "@/lib/assessment/questions";

export const metadata: Metadata = { title: "Your assessment results" };

const TRAIT_CATEGORY = new Map(
  ASSESSMENT_QUESTIONS.map((q) => [q.trait, q.category] as const)
);

export default async function AssessmentResultsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const assessment = await prisma.assessment.findFirst({
    where: { userId: user.id, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });
  if (!assessment) redirect("/assessment");

  const traitScores = (assessment.traitScores as TraitScores | null) ?? {};

  return (
    <div className="min-h-dvh bg-sand-50">
      <header className="px-6 py-6 sm:px-10">
        <Logo />
      </header>

      <main className="mx-auto max-w-xl px-6 pb-24">
        <span className="badge badge-ai">Self-discovery guidance tool</span>
        <h1 className="mt-4 text-2xl font-bold text-ink">Your self-discovery profile</h1>
        <p className="mt-2 text-sm text-ink-soft">
          This reflects how you described yourself just now — not a fixed label. It&apos;s a
          starting point for career guidance, not a psychological or clinical assessment.
        </p>

        <div className="mt-8 space-y-8">
          {ASSESSMENT_CATEGORIES.map((category) => {
            const traitsInCategory = (Object.keys(traitScores) as TraitKey[]).filter(
              (trait) => TRAIT_CATEGORY.get(trait) === category
            );
            if (traitsInCategory.length === 0) return null;

            return (
              <div key={category} className="card">
                <h2 className="font-display text-base font-bold text-ink">{category}</h2>
                <div className="mt-4 space-y-4">
                  {traitsInCategory.map((trait) => {
                    const score = traitScores[trait] ?? 0;
                    return (
                      <div key={trait}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink">{TRAIT_LABELS[trait]}</span>
                          <span className="font-mono text-ink-faint">{score}%</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sand-200">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="card mt-8 border-navy-500/20 bg-navy-50">
          <h2 className="font-display text-base font-bold text-ink">What happens next</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            Your ranked career matches, with a transparent fit score and reasoning for each one,
            are generated from this profile in the next part of 3Doors — coming shortly as the
            career recommendation engine ships.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Link href="/assessment?retake=1" className="text-sm font-medium text-ink-soft hover:text-ink">
            Retake the assessment
          </Link>
          <Link href="/dashboard" className="btn-primary">
            Go to my dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
