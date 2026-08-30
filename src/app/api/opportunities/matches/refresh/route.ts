import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateOpportunityMatches } from "@/lib/opportunities/generate";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * Manual recompute (Phase 4, dev-order 6-7) — same shape as
 * POST /api/matches/refresh for careers. Unlike career matches, this
 * never requires a completed assessment: eligibility and skill alignment
 * both work from onboarding data alone, and career alignment degrades to
 * a neutral score with no assessment rather than blocking the whole
 * feature.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  if (isRateLimited(`opportunity-matches-refresh:${userId}`, 5, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: "You've refreshed recently — try again in a few minutes." },
      { status: 429 }
    );
  }

  await generateOpportunityMatches(userId);

  return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() });
}
