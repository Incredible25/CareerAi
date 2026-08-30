import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { opportunitySchema } from "@/lib/validation/opportunities";
import type { Prisma } from "@prisma/client";

/**
 * INGESTION POLICY (docs/PRODUCT_STRATEGY.md §10, Phase 4 Module 4):
 * this POST handler is, deliberately, the *only* way an Opportunity row
 * can ever be created — one fully-validated object per request, entered
 * by an authenticated admin. There is no scraper, crawler, CSV/bulk
 * importer, or feed poller anywhere in this codebase, and none should be
 * added that bypasses this endpoint. If automated ingestion (an approved
 * API/feed) is ever built, it must call this same path with the same
 * validation and the same forced-UNVERIFIED default below — not a
 * second, lower-friction endpoint next to it.
 */

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const where: Prisma.OpportunityWhereInput = {};

  const category = searchParams.get("category");
  if (category) where.category = category as never;

  const verificationStatus = searchParams.get("verificationStatus");
  if (verificationStatus) where.verificationStatus = verificationStatus as never;

  const opportunityStatus = searchParams.get("opportunityStatus");
  if (opportunityStatus) where.opportunityStatus = opportunityStatus as never;

  const sourceId = searchParams.get("sourceId");
  if (sourceId) where.sourceId = sourceId;

  const opportunities = await prisma.opportunity.findMany({
    where,
    include: { source: true, _count: { select: { reports: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(opportunities);
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const parsed = opportunitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const data = parsed.data;

  const opportunity = await prisma.opportunity.create({
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
      // Never settable at creation — see requireAdmin()/verify workflow.
      verificationStatus: "UNVERIFIED",
      createdById: admin.id,
      skills: {
        create: data.skillIds.map((skillId) => ({ skillId, required: true })),
      },
      careers: {
        create: data.careerIds.map((careerId) => ({ careerId })),
      },
    },
  });

  return NextResponse.json(opportunity, { status: 201 });
}
