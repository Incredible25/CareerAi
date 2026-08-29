import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const existing = await prisma.opportunity.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const opportunity = await prisma.opportunity.update({
    where: { id: params.id },
    data: { opportunityStatus: "ARCHIVED", updatedById: admin.id },
  });

  return NextResponse.json(opportunity);
}
