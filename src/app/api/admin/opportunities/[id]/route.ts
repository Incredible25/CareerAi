import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { opportunitySchema } from "@/lib/validation/opportunities";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const opportunity = await prisma.opportunity.findUnique({
    where: { id: params.id },
    include: {
      source: true,
      skills: { include: { skill: true } },
      careers: { include: { career: true } },
      reports: { include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!opportunity) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json(opportunity);
}

// Deliberately cannot touch verificationStatus — that only ever changes
// through the dedicated verify/reject actions (Phase 4, verification
// workflow module), never through a generic field edit.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const existing = await prisma.opportunity.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = opportunitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const data = parsed.data;

  const opportunity = await prisma.$transaction(async (tx) => {
    await tx.opportunitySkill.deleteMany({ where: { opportunityId: params.id } });
    await tx.opportunityCareer.deleteMany({ where: { opportunityId: params.id } });

    return tx.opportunity.update({
      where: { id: params.id },
      data: {
        title: data.title,
        organization: data.organization,
        category: data.category,
        description: data.description,
        location: data.location || null,
        country: data.country || null,
        remoteStatus: data.remoteStatus,
        eligibleCountries: data.eligibleCountries,
        eligibilityText: data.eligibilityText || null,
        minEducationLevel: data.minEducationLevel || null,
        experienceRequirement: data.experienceRequirement,
        applicationDeadline: data.applicationDeadline,
        applicationUrl: data.applicationUrl,
        datePublished: data.datePublished,
        sourceId: data.sourceId,
        sourceUrl: data.sourceUrl,
        opportunityStatus: data.opportunityStatus,
        updatedById: admin.id,
        skills: { create: data.skillIds.map((skillId) => ({ skillId, required: true })) },
        careers: { create: data.careerIds.map((careerId) => ({ careerId })) },
      },
    });
  });

  return NextResponse.json(opportunity);
}
