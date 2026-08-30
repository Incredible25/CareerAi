import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isOnboardingComplete } from "@/lib/onboarding";
import { generateOpportunityMatches, getOpportunityMatches } from "@/lib/opportunities/generate";
import { scoreLabel } from "@/lib/opportunities/matching";
import { CATEGORY_LABELS } from "@/lib/opportunities/constants";
import { formatDeadline, daysUntil } from "@/lib/opportunities/format";
import { AppHeader } from "@/components/app-header";
import { RefreshOpportunityMatchesButton } from "@/components/opportunities/refresh-opportunity-matches-button";
import { OpportunityMatchBreakdownDetails } from "@/components/opportunities/match-breakdown";

export const metadata: Metadata = { title: "Opportunities for you" };

export default async function OpportunitiesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile || !isOnboardingComplete(user.profile.onboardingStep)) redirect("/onboarding");

  // Always a fresh recompute (Phase 4, dev-order 6-7's
  // generateOpportunityMatches is a cheap full pass) rather than only
  // generating when empty like the career-matches page: opportunities
  // expire and get pulled far more often than the career catalog
  // changes, so a stale feed here risks showing something that just
  // became invisible. The manual refresh button below is for user
  // feedback, not correctness — the page is already fresh on every load.
  await generateOpportunityMatches(user.id);
  const matches = await getOpportunityMatches(user.id);

  const topFive = matches.slice(0, 5);
  const rest = matches.slice(5);

  return (
    <div className="min-h-dvh bg-sand-50 pb-24">
      <AppHeader name={user.name} isAdmin={user.role === "ADMIN"} />

      <main className="mx-auto max-w-3xl px-6 pt-10 sm:px-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <span className="badge">Match score — calculated from your profile, not a probability of being accepted</span>
          <RefreshOpportunityMatchesButton />
        </div>
        <h1 className="mt-3 text-2xl font-bold text-ink sm:text-3xl">Opportunities for you</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Verified opportunities, ranked by how closely they line up with your career matches and
          skills. Every listing keeps its original source — nothing here is scraped or invented,
          and eligibility gaps are always shown, never hidden.
        </p>

        {matches.length === 0 ? (
          <div className="card mt-8">
            <p className="text-sm text-ink-soft">
              No verified opportunities match your profile right now. Check back soon — this list
              grows as our team verifies new listings.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {topFive.map((match) => (
                <OpportunityCard key={match.id} match={match} />
              ))}
            </div>

            {rest.length > 0 && (
              <details className="mt-8">
                <summary className="cursor-pointer text-sm font-medium text-ink-soft hover:text-ink">
                  See {rest.length} more opportunities
                </summary>
                <div className="mt-4 space-y-3">
                  {rest.map((match) => (
                    <OpportunityCard key={match.id} match={match} />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </main>
    </div>
  );
}

type MatchWithOpportunity = Awaited<ReturnType<typeof getOpportunityMatches>>[number];

function OpportunityCard({ match }: { match: MatchWithOpportunity }) {
  const opp = match.opportunity;
  const remaining = daysUntil(opp.applicationDeadline);

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-ink-faint">
            {CATEGORY_LABELS[opp.category]} · {opp.organization} · via {opp.source.name}
          </p>
          <h2 className="mt-0.5 font-display text-lg font-bold text-ink">{opp.title}</h2>
        </div>
        <div className="flex-none text-right">
          <p className="font-mono text-2xl font-bold text-green-500">{match.matchScore}%</p>
          <p className="text-xs text-ink-faint">{scoreLabel(match.matchScore)} match</p>
        </div>
      </div>

      <p className="mt-2 text-xs text-ink-faint">
        {formatDeadline(opp.applicationDeadline)}
        {remaining !== null && remaining >= 0 && remaining <= 14 && (
          <span className="ml-1.5 font-medium text-orange-600">
            · {remaining === 0 ? "closes today" : `${remaining}d left`}
          </span>
        )}
      </p>

      {match.eligibilityFlags.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg2 bg-orange-50 px-3 py-2 text-xs text-orange-700">
          {match.eligibilityFlags.map((flag) => (
            <li key={flag}>⚠ {flag}</li>
          ))}
        </ul>
      )}

      {match.reasons.length > 0 && (
        <ul className="mt-3 list-inside list-disc space-y-0.5 text-sm text-ink-soft">
          {match.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}

      <OpportunityMatchBreakdownDetails breakdown={match.breakdown} />

      <div className="mt-4">
        <Link href={`/opportunities/${opp.id}`} className="btn-secondary !px-4 !py-2 text-sm">
          View details
        </Link>
      </div>
    </div>
  );
}
