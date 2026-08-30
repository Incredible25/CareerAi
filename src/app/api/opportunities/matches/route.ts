import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOpportunityMatches } from "@/lib/opportunities/generate";
import { scoreLabel } from "@/lib/opportunities/matching";

/**
 * Read-only listing of the calling user's current opportunity matches.
 * The personalized feed page (dev-order 8-9) will read matches this same
 * way; this endpoint exists now so the engine is testable end-to-end
 * ahead of that page existing, not as a stand-in for the feed UI itself.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const matches = await getOpportunityMatches(session.user.id);

  return NextResponse.json({
    matches: matches.map((m) => ({
      opportunityId: m.opportunityId,
      title: m.opportunity.title,
      organization: m.opportunity.organization,
      matchScore: m.matchScore,
      matchLabel: scoreLabel(m.matchScore),
      breakdown: m.breakdown,
      reasons: m.reasons,
      eligibilityFlags: m.eligibilityFlags,
      rank: m.rank,
    })),
  });
}
