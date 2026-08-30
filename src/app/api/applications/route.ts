import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveOpportunitySchema } from "@/lib/validation/applications";

/**
 * "Save" (Phase 4, dev-order 10-11) is just creating an
 * OpportunityApplication with status=SAVED, per the schema's own
 * comment. Idempotent by design — upsert with an empty update — so a
 * double-click or the button firing on an opportunity the user already
 * progressed past SAVED (e.g. already APPLIED) never regresses their
 * real status back down. This never touches the opportunity itself,
 * and never auto-applies on the user's behalf: it only ever records
 * that a signed-in user, by their own action, wants to track this one.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  const parsed = saveOpportunitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { opportunityId } = parsed.data;

  const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId }, select: { id: true } });
  if (!opportunity) {
    return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
  }

  const application = await prisma.opportunityApplication.upsert({
    where: { userId_opportunityId: { userId, opportunityId } },
    create: { userId, opportunityId, status: "SAVED" },
    update: {},
  });

  return NextResponse.json(application, { status: 201 });
}
