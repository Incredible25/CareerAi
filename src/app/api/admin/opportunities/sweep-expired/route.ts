import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Admin bookkeeping convenience only (Phase 4, Module 5) — flips
 * opportunityStatus to EXPIRED for anything still marked ACTIVE whose
 * deadline has passed, so admin views/counts read cleanly. This is
 * never what actually protects users: visibleOpportunityWhere()
 * (src/lib/opportunities/visibility.ts) already excludes these at query
 * time regardless of whether this has ever run.
 */
export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const result = await prisma.opportunity.updateMany({
    where: { opportunityStatus: "ACTIVE", applicationDeadline: { lt: new Date() } },
    data: { opportunityStatus: "EXPIRED", updatedById: admin.id },
  });

  return NextResponse.json({ swept: result.count });
}
