import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ note: z.string().trim().max(1000).optional() });

/**
 * The only code path anywhere that can set verificationStatus = VERIFIED
 * (Phase 4 verification workflow). Requires a fresh admin check — never
 * reachable by AI-generated content, an ordinary field edit, or a
 * spoofed request body (docs/PRODUCT_STRATEGY.md, Phase 4 Module 2).
 *
 * If the opportunity is still a DRAFT, verifying it also activates it —
 * verifying something you don't intend to show yet would otherwise be a
 * confusing dead state. An ARCHIVED opportunity stays archived even once
 * verified; that's a legitimate past record, not something to resurface.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const existing = await prisma.opportunity.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const opportunity = await prisma.opportunity.update({
    where: { id: params.id },
    data: {
      verificationStatus: "VERIFIED",
      lastVerifiedAt: new Date(),
      verificationNote: parsed.data.note || null,
      opportunityStatus: existing.opportunityStatus === "DRAFT" ? "ACTIVE" : existing.opportunityStatus,
      updatedById: admin.id,
    },
  });

  return NextResponse.json(opportunity);
}
