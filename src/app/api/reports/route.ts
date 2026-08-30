import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reportOpportunitySchema } from "@/lib/validation/reports";
import { isRateLimited } from "@/lib/rate-limit";

/**
 * User-facing "Report a problem" (Phase 4, dev-order 12) — feeds
 * directly into the existing admin reports queue
 * (src/app/admin/reports/page.tsx), which already renders whatever
 * lands here. This never changes the opportunity itself: no
 * verificationStatus or opportunityStatus write happens as a side
 * effect of a report, automatically or otherwise — an admin reviews
 * every one and decides (docs/PRODUCT_STRATEGY.md: never accuse an
 * organization of fraud automatically, neutral "reported for review"
 * language only).
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  if (isRateLimited(`report:${userId}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "You've sent a few reports already — try again in a few minutes." },
      { status: 429 }
    );
  }

  const parsed = reportOpportunitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { opportunityId, reason, note } = parsed.data;

  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { id: true } });
  if (!opportunity) {
    return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
  }

  // One open report per user per opportunity — a repeat submission
  // while the first is still unreviewed just surfaces the existing one
  // rather than piling up duplicates. A user can report again once a
  // prior report has actually been resolved (something may have
  // changed since).
  const existingOpen = await prisma.opportunityReport.findFirst({
    where: { userId, opportunityId, status: "OPEN" },
  });
  if (existingOpen) {
    return NextResponse.json(existingOpen, { status: 200 });
  }

  const report = await prisma.opportunityReport.create({
    data: { userId, opportunityId, reason, note: note || null },
  });

  return NextResponse.json(report, { status: 201 });
}
