import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  CATEGORY_LABELS,
  OPPORTUNITY_STATUS_LABELS,
  VERIFICATION_LABELS,
} from "@/lib/opportunities/constants";
import type { Prisma } from "@prisma/client";
import { FilterSelect } from "@/components/admin/filter-select";

export const metadata: Metadata = { title: "Opportunities · Admin" };

type SearchParams = { category?: string; verificationStatus?: string; opportunityStatus?: string; sourceId?: string };

export default async function AdminOpportunitiesPage({ searchParams }: { searchParams: SearchParams }) {
  const where: Prisma.OpportunityWhereInput = {};
  if (searchParams.category) where.category = searchParams.category as never;
  if (searchParams.verificationStatus) where.verificationStatus = searchParams.verificationStatus as never;
  if (searchParams.opportunityStatus) where.opportunityStatus = searchParams.opportunityStatus as never;
  if (searchParams.sourceId) where.sourceId = searchParams.sourceId;

  const [opportunities, sources] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      include: { source: true, _count: { select: { reports: { where: { status: "OPEN" } } } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.source.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Opportunities</h1>
          <p className="mt-1 text-sm text-ink-soft">{opportunities.length} matching current filters</p>
        </div>
        <Link href="/admin/opportunities/new" className="btn-primary !px-4 !py-2 text-sm">
          Add opportunity
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <FilterSelect label="Category" param="category" current={searchParams.category} options={CATEGORY_LABELS} baseHref="/admin/opportunities" searchParams={searchParams} />
        <FilterSelect label="Verification" param="verificationStatus" current={searchParams.verificationStatus} options={VERIFICATION_LABELS} baseHref="/admin/opportunities" searchParams={searchParams} />
        <FilterSelect label="Status" param="opportunityStatus" current={searchParams.opportunityStatus} options={OPPORTUNITY_STATUS_LABELS} baseHref="/admin/opportunities" searchParams={searchParams} />
        <FilterSelect
          label="Source"
          param="sourceId"
          current={searchParams.sourceId}
          options={Object.fromEntries(sources.map((s) => [s.id, s.name]))}
          baseHref="/admin/opportunities"
          searchParams={searchParams}
        />
        {(searchParams.category || searchParams.verificationStatus || searchParams.opportunityStatus || searchParams.sourceId) && (
          <Link href="/admin/opportunities" className="text-xs font-medium text-ink-faint hover:text-ink">Clear filters</Link>
        )}
      </div>

      <div className="mt-6 space-y-2">
        {opportunities.length === 0 && <p className="text-sm text-ink-soft">No opportunities match these filters.</p>}
        {opportunities.map((opp) => (
          <Link key={opp.id} href={`/admin/opportunities/${opp.id}`} className="card flex items-center justify-between gap-4 hover:border-green-500/50">
            <div>
              <p className="font-display text-sm font-bold text-ink">{opp.title}</p>
              <p className="text-xs text-ink-faint">{opp.organization} · {CATEGORY_LABELS[opp.category]} · via {opp.source.name}</p>
            </div>
            <div className="flex flex-none items-center gap-2">
              {opp._count.reports > 0 && (
                <span className="badge border-orange-400 text-orange-600">{opp._count.reports} report{opp._count.reports === 1 ? "" : "s"}</span>
              )}
              <span className="badge">{OPPORTUNITY_STATUS_LABELS[opp.opportunityStatus]}</span>
              <span className={"badge " + (opp.verificationStatus === "VERIFIED" ? "border-green-500 text-green-500" : "")}>
                {VERIFICATION_LABELS[opp.verificationStatus]}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
