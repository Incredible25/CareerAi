import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateCareerMatches, generateSideIncomeMatches } from "@/lib/career-engine/generate";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * Manual recompute (Phase 2, Module 2). generateCareerMatches() is always
 * a full fresh scoring pass — what was missing was a way for the user to
 * *trigger* one outside of assessment submission, e.g. after the career
 * catalog itself grows (as it just did in Module 1) or, once profile
 * editing ships, after they update their skills.
 *
 * Refreshes side-income matches in the same call — both are derived from
 * the same profile snapshot, and refreshing one but not the other would
 * leave the two views inconsistent with each other.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  if (isRateLimited(`matches-refresh:${userId}`, 5, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: "You've refreshed recently — try again in a few minutes." },
      { status: 429 }
    );
  }

  const [assessmentId] = await Promise.all([
    generateCareerMatches(userId),
    generateSideIncomeMatches(userId),
  ]);

  if (!assessmentId) {
    return NextResponse.json(
      { error: "Complete your self-discovery assessment before generating matches." },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, refreshedAt: new Date().toISOString() });
}
