import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { REPORT_REASON_LABELS } from "@/lib/opportunities/constants";
import { ReportActions } from "@/components/admin/report-actions";

export const metadata: Metadata = { title: "Reports · Admin" };

export default async function AdminReportsPage() {
  const [openReports, resolvedReports] = await Promise.all([
    prisma.opportunityReport.findMany({
      where: { status: "OPEN" },
      include: { opportunity: { select: { id: true, title: true, organization: true } }, user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.opportunityReport.findMany({
      where: { status: { not: "OPEN" } },
      include: { opportunity: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Reported opportunities</h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Reports never automatically change an opportunity&apos;s status — review each one and
        decide what, if anything, needs to change.
      </p>

      <div className="mt-6 space-y-3">
        {openReports.length === 0 && <p className="text-sm text-ink-soft">No open reports.</p>}
        {openReports.map((report) => (
          <div key={report.id} className="card border-orange-400 bg-orange-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link href={`/admin/opportunities/${report.opportunity.id}`} className="font-display text-sm font-bold text-ink hover:underline">
                  {report.opportunity.title}
                </Link>
                <p className="text-xs text-ink-faint">{report.opportunity.organization}</p>
              </div>
              <span className="badge border-orange-400 text-orange-600">{REPORT_REASON_LABELS[report.reason]}</span>
            </div>
            {report.note && <p className="mt-2 text-sm text-ink-soft">&ldquo;{report.note}&rdquo;</p>}
            <p className="mt-2 text-xs text-ink-faint">
              Reported by {report.user.name} ({report.user.email}) · {report.createdAt.toLocaleDateString()}
            </p>
            <div className="mt-3">
              <ReportActions reportId={report.id} />
            </div>
          </div>
        ))}
      </div>

      {resolvedReports.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-sm font-bold text-ink">Recently resolved</h2>
          <div className="mt-3 space-y-1.5">
            {resolvedReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between text-sm text-ink-soft">
                <span>{report.opportunity.title} — {REPORT_REASON_LABELS[report.reason]}</span>
                <span className="text-xs text-ink-faint">{report.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
