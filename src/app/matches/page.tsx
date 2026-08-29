import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isOnboardingComplete } from "@/lib/onboarding";
import { generateCareerMatches, getLatestCareerMatches } from "@/lib/career-engine/generate";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { RefreshMatchesButton } from "@/components/matches/refresh-matches-button";

export const metadata: Metadata = { title: "Your career matches" };

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile || !isOnboardingComplete(user.profile.onboardingStep)) redirect("/onboarding");

  let matches = await getLatestCareerMatches(user.id);
  if (matches.length === 0) {
    const generated = await generateCareerMatches(user.id);
    if (!generated) redirect("/assessment");
    matches = await getLatestCareerMatches(user.id);
  }

  const catalogSize = await prisma.careerProfile.count();
  const lastGenerated = matches.reduce(
    (latest, m) => (m.generatedAt > latest ? m.generatedAt : latest),
    matches[0]?.generatedAt ?? new Date()
  );
  const isStaleAgainstCatalog = matches.length < catalogSize;

  const topFive = matches.slice(0, 5);
  const rest = matches.slice(5);

  return (
    <div className="min-h-dvh bg-sand-50 pb-24">
      <AppHeader name={user.name} />

      <main className="mx-auto max-w-3xl px-6 pt-10 sm:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <span className="badge badge-ai">3Doors Fit Score — AI-assisted guidance, not a guarantee</span>
          <RefreshMatchesButton />
        </div>
        <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Your career matches</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Based on your self-discovery assessment and profile, compared against all {catalogSize}{" "}
          careers in our catalog and ranked by fit — not a single verdict. Explore any of them, and
          take a closer look at the ones that feel right.
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          Last calculated {lastGenerated.toLocaleDateString()}.
          {isStaleAgainstCatalog && " Our catalog has grown since — recalculate to include everything."}
        </p>

        <div className="mt-8 space-y-4">
          {topFive.map((match, i) => (
            <MatchCard key={match.id} match={match} rank={i + 1} highlight />
          ))}
        </div>

        {rest.length > 0 && (
          <details className="mt-8">
            <summary className="cursor-pointer text-sm font-medium text-ink-soft hover:text-ink">
              See {rest.length} more careers in our catalog
            </summary>
            <div className="mt-4 space-y-3">
              {rest.map((match, i) => (
                <MatchCard key={match.id} match={match} rank={i + 6} highlight={false} />
              ))}
            </div>
          </details>
        )}
      </main>
    </div>
  );
}

function MatchCard({
  match,
  rank,
  highlight,
}: {
  match: {
    id: string;
    fitScore: number;
    reasons: string[];
    career: { slug: string; name: string; industry: string };
  };
  rank: number;
  highlight: boolean;
}) {
  return (
    <div className={"card " + (highlight ? "border-green-500/30" : "")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-ink-faint">#{rank} · {match.career.industry}</p>
          <h2 className="mt-0.5 font-display text-lg font-bold text-ink">{match.career.name}</h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-green-500">{match.fitScore}%</p>
          <p className="text-xs text-ink-faint">fit score</p>
        </div>
      </div>

      {match.reasons.length > 0 && (
        <ul className="mt-3 list-inside list-disc space-y-0.5 text-sm text-ink-soft">
          {match.reasons.slice(0, 3).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/careers/${match.career.slug}`} className="btn-secondary !px-4 !py-2 text-sm">
          Explore this career
        </Link>
        <Link href={`/careers/${match.career.slug}/plan`} className="btn-primary !px-4 !py-2 text-sm">
          See my plan
        </Link>
      </div>
    </div>
  );
}
