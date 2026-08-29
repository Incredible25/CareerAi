import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isOnboardingComplete } from "@/lib/onboarding";
import { generateSideIncomeMatches, getSideIncomeMatches } from "@/lib/career-engine/generate";
import { AppHeader } from "@/components/app-header";

export const metadata: Metadata = { title: "Side-income options" };

export default async function SideIncomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile || !isOnboardingComplete(user.profile.onboardingStep)) redirect("/onboarding");

  await generateSideIncomeMatches(user.id);
  const matches = await getSideIncomeMatches(user.id);

  return (
    <div className="min-h-dvh bg-sand-50 pb-24">
      <AppHeader name={user.name} />

      <main className="mx-auto max-w-3xl px-6 pt-10 sm:px-10">
        <span className="badge badge-ai">Potential income paths — not guaranteed earnings</span>
        <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">
          What you could start doing now
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Scored against the skills you already have — not tied to your long-term career choice.
          This is about momentum, not a job listing.
        </p>

        <div className="mt-8 space-y-4">
          {matches.map((match, i) => (
            <SideIncomeCard key={match.id} match={match} rank={i + 1} />
          ))}
        </div>
      </main>
    </div>
  );
}

type MatchWithOpportunity = Awaited<ReturnType<typeof getSideIncomeMatches>>[number];

function SideIncomeCard({ match, rank }: { match: MatchWithOpportunity; rank: number }) {
  const opp = match.sideOpportunity;
  return (
    <details className="card group" open={rank <= 3}>
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-ink-faint">#{rank}</p>
          <h2 className="mt-0.5 font-display text-lg font-bold text-ink">{opp.name}</h2>
          <p className="mt-1 text-sm text-ink-soft">{opp.description}</p>
        </div>
        <p className="flex-none font-mono text-2xl font-bold text-green-500">{match.fitScore}%</p>
      </summary>

      <div className="mt-4 space-y-4 border-t border-sand-200 pt-4">
        {match.reasons.length > 0 && (
          <div>
            <p className="text-sm font-medium text-ink">Why this fits</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-ink-soft">
              {match.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          </div>
        )}

        {match.missingSkillNames.length > 0 && (
          <div>
            <p className="text-sm font-medium text-ink">Skills to pick up</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {match.missingSkillNames.map((s) => <span key={s} className="badge">{s}</span>)}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-ink">How long to learn the basics</p>
          <p className="mt-1 text-sm text-ink-soft">{opp.learningNotes}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Tools you&apos;d use</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {opp.tools.map((t) => <span key={t} className="badge">{t}</span>)}
          </div>
        </div>

        <div className="rounded-lg2 bg-sand-50 px-4 py-3">
          <p className="text-sm font-medium text-ink">Starter project</p>
          <p className="mt-0.5 text-sm text-ink-soft">{opp.starterProject}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">What to have ready before you pitch anyone</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-ink-soft">
            {opp.portfolioRequirements.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Finding a first client</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-ink-soft">
            {opp.clientApproachTips.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      </div>
    </details>
  );
}
