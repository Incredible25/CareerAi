import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ note: z.string().trim().max(1000).optional() });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const existing = await prisma.opportunity.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  // Rejecting doesn't need to also touch opportunityStatus: the public
  // feed/matching only ever reads verificationStatus = VERIFIED, so a
  // REJECTED opportunity is already excluded regardless of lifecycle
  // status.
  const opportunity = await prisma.opportunity.update({
    where: { id: params.id },
    data: {
      verificationStatus: "REJECTED",
      verificationNote: parsed.data.note || null,
      updatedById: admin.id,
    },
  });

  return NextResponse.json(opportunity);
}
