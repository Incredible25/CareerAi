import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OpportunityForm } from "@/components/admin/opportunity-form";
import { VerificationActions } from "@/components/admin/verification-actions";
import { VERIFICATION_LABELS, OPPORTUNITY_STATUS_LABELS, REPORT_REASON_LABELS } from "@/lib/opportunities/constants";

export const metadata: Metadata = { title: "Edit opportunity · Admin" };

export default async function EditOpportunityPage({ params }: { params: { id: string } }) {
  const [opportunity, sources, skills, careers] = await Promise.all([
    prisma.opportunity.findUnique({
      where: { id: params.id },
      include: {
        skills: true,
        careers: true,
        reports: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.source.findMany({ orderBy: { name: "asc" } }),
    prisma.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.careerProfile.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!opportunity) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/opportunities" className="text-sm font-medium text-ink-soft hover:text-ink">← All opportunities</Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">{opportunity.title}</h1>
        <div className="flex gap-2">
          <span className={"badge " + (opportunity.verificationStatus === "VERIFIED" ? "border-green-500 text-green-500" : "")}>
            {VERIFICATION_LABELS[opportunity.verificationStatus]}
          </span>
          <span className="badge">{OPPORTUNITY_STATUS_LABELS[opportunity.opportunityStatus]}</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink-faint">
        Verification status changes only through the dedicated actions below. The form further
        down edits content only and can never touch it.
      </p>

      <div className="mt-6">
        <VerificationActions
          opportunityId={opportunity.id}
          verificationStatus={opportunity.verificationStatus}
          opportunityStatus={opportunity.opportunityStatus}
        />
      </div>

      {opportunity.verificationNote && (
        <p className="mt-2 text-xs text-ink-faint">Last review note: &ldquo;{opportunity.verificationNote}&rdquo;</p>
      )}

      {opportunity.reports.length > 0 && (
        <div className="card mt-6 border-orange-400 bg-orange-50">
          <h2 className="font-display text-sm font-bold text-ink">
            {opportunity.reports.length} report{opportunity.reports.length === 1 ? "" : "s"}
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
            {opportunity.reports.map((r) => (
              <li key={r.id}>
                <span className="font-medium text-ink">{REPORT_REASON_LABELS[r.reason]}</span>
                {r.note && <> — {r.note}</>}
                <span className="text-ink-faint"> · {r.user.name}, {r.createdAt.toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
          <Link href="/admin/reports" className="mt-2 inline-block text-xs font-medium text-orange-600 hover:underline">
            Review in the reports queue →
          </Link>
        </div>
      )}

      <div className="mt-6">
        <OpportunityForm
          sources={sources}
          skillCatalog={skills}
          careerCatalog={careers}
          initial={{
            id: opportunity.id,
            title: opportunity.title,
            organization: opportunity.organization,
            category: opportunity.category,
            description: opportunity.description,
            location: opportunity.location,
            country: opportunity.country,
            remoteStatus: opportunity.remoteStatus,
            eligibleCountries: opportunity.eligibleCountries,
            eligibilityText: opportunity.eligibilityText,
            minEducationLevel: opportunity.minEducationLevel,
            experienceRequirement: opportunity.experienceRequirement,
            applicationDeadline: opportunity.applicationDeadline?.toISOString() ?? null,
            applicationUrl: opportunity.applicationUrl,
            datePublished: opportunity.datePublished?.toISOString() ?? null,
            sourceId: opportunity.sourceId,
            sourceUrl: opportunity.sourceUrl,
            opportunityStatus: opportunity.opportunityStatus,
            skillIds: opportunity.skills.map((s) => s.skillId),
            careerIds: opportunity.careers.map((c) => c.careerId),
          }}
        />
      </div>
    </div>
  );
}
