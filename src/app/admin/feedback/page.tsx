import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { computeFeedbackDashboard } from "@/lib/feedback/aggregate";
import type { CareerFeedbackStat, CareerCount, ReasonCount } from "@/lib/feedback/aggregate";
import { computeBetaFeedbackPatterns } from "@/lib/feedback/beta-patterns";
import type { LabeledCount } from "@/lib/feedback/beta-patterns";

export const metadata: Metadata = { title: "Feedback · Admin" };

export default async function AdminFeedbackPage() {
  const [totalRecommendationsGenerated, feedbackRows, topRankedMatches] = await Promise.all([
    prisma.careerMatch.count(),
    prisma.feedback.findMany({
      where: { subjectType: "CAREER_MATCH" },
      select: { subjectId: true, helpful: true, reason: true, createdAt: true },
    }),
    prisma.careerMatch.findMany({
      where: { rank: { lte: 5 } },
      select: { career: { select: { name: true } } },
    }),
  ]);

  const matchRows = await prisma.careerMatch.findMany({
    where: { id: { in: feedbackRows.map((f) => f.subjectId) } },
    select: { id: true, career: { select: { name: true } } },
  });
  const matchCareerNames = new Map(matchRows.map((m) => [m.id, m.career.name]));
  const topRankedCareerNames = topRankedMatches.map((m) => m.career.name);

  const summary = computeFeedbackDashboard({
    totalRecommendationsGenerated,
    careerMatchFeedback: feedbackRows,
    matchCareerNames,
    topRankedCareerNames,
  });

  // Phase 7 Step 10 — beta-cohort-only patterns, layered on the summary
  // above rather than replacing it. One extra query, scoped to
  // isBetaUser, joined just far enough to answer the four questions
  // computeFeedbackDashboard() doesn't: profile-type, age-group, and
  // device/connectivity patterns, and which negative reports are
  // critical (INAPPROPRIATE) versus quality.
  const betaFeedbackRows = await prisma.feedback.findMany({
    where: { subjectType: "CAREER_MATCH", user: { isBetaUser: true } },
    select: {
      helpful: true,
      reason: true,
      subjectId: true,
      user: {
        select: {
          ageRange: true,
          education: { where: { isCurrent: true }, select: { level: true }, take: 1 },
          profile: { select: { hasLaptop: true, hasSmartphone: true, internetAccess: true } },
        },
      },
    },
  });
  const betaPatterns = computeBetaFeedbackPatterns({
    rows: betaFeedbackRows.map((f) => ({
      helpful: f.helpful,
      reason: f.reason,
      careerName: matchCareerNames.get(f.subjectId) ?? null,
      ageRange: f.user.ageRange,
      educationLevel: f.user.education[0]?.level ?? null,
      hasLaptop: f.user.profile?.hasLaptop ?? null,
      hasSmartphone: f.user.profile?.hasSmartphone ?? null,
      internetAccess: f.user.profile?.internetAccess ?? null,
    })),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Feedback</h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        How users are responding to career recommendations, in aggregate. Nothing here identifies
        an individual user — this is about how the recommendation engine is landing overall, not
        about any one student.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Recommendations generated" value={summary.totalRecommendationsGenerated} />
        <StatTile label="Feedback submitted" value={summary.totalFeedback} />
        <StatTile label="Feedback rate" value={`${summary.feedbackRatePercent}%`} />
        <StatTile label="Positive rate" value={`${summary.positiveRatePercent}%`} accent="green" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <RankedCareerCard
          title="Most positively rated careers"
          caption={`Based on at least ${summary.minFeedbackThresholdForRankedCareers} pieces of feedback.`}
          stats={summary.topRatedCareers}
          emptyText="Not enough feedback yet to rank careers."
          barColorClass="bg-green-500"
        />
        <RankedCareerCard
          title="Most negatively rated careers"
          caption={`Based on at least ${summary.minFeedbackThresholdForRankedCareers} pieces of feedback.`}
          stats={summary.bottomRatedCareers}
          emptyText="Not enough feedback yet to rank careers."
          barColorClass="bg-orange-500"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="font-display text-sm font-bold text-ink">Common reasons for negative feedback</h2>
          <p className="mt-1 text-xs text-ink-faint">Only counted when the user picked a reason.</p>
          <div className="mt-4 space-y-2.5">
            {summary.negativeReasonCounts.length === 0 && <p className="text-sm text-ink-soft">No negative feedback with a reason yet.</p>}
            {summary.negativeReasonCounts.map((r) => (
              <ReasonBar key={r.reason} reason={r} max={summary.negativeReasonCounts[0]?.count ?? 1} />
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-display text-sm font-bold text-ink">Careers flagged as an interest/subject mismatch</h2>
          <p className="mt-1 text-xs text-ink-faint">
            Users who said a match &ldquo;doesn&apos;t match my interests&rdquo; or &ldquo;doesn&apos;t
            match my subjects&rdquo; — a signal the explanation (or the underlying match) didn&apos;t
            land, not just that the career wasn&apos;t wanted.
          </p>
          <div className="mt-4 space-y-2.5">
            {summary.mismatchFlaggedCareers.length === 0 && <p className="text-sm text-ink-soft">No mismatches flagged yet.</p>}
            {summary.mismatchFlaggedCareers.map((c) => (
              <CareerCountBar key={c.careerName} item={c} max={summary.mismatchFlaggedCareers[0]?.count ?? 1} barColorClass="bg-orange-500" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 card">
        <h2 className="font-display text-sm font-bold text-ink">Careers appearing most often in a user&apos;s top 5 matches</h2>
        <p className="mt-1 text-xs text-ink-faint">
          There&apos;s no &ldquo;request a career&rdquo; feature yet, so this is the closest honest
          signal for which careers 3Doors ends up recommending most — how often each one lands in
          someone&apos;s top 5, across all users.
        </p>
        <div className="mt-4 space-y-2.5">
          {summary.mostTopMatchedCareers.length === 0 && <p className="text-sm text-ink-soft">No matches generated yet.</p>}
          {summary.mostTopMatchedCareers.map((c) => (
            <CareerCountBar key={c.careerName} item={c} max={summary.mostTopMatchedCareers[0]?.count ?? 1} barColorClass="bg-green-500" />
          ))}
        </div>
      </div>

      <div className="mt-8 card">
        <h2 className="font-display text-sm font-bold text-ink">Recent trend</h2>
        <p className="mt-1 text-xs text-ink-faint">Feedback submitted per day, most recent first.</p>
        {summary.dailyTrend.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">No feedback yet — trends will appear once users start responding.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-xs uppercase tracking-wide text-ink-faint">
                  <th className="pb-2 pr-4 font-medium">Date</th>
                  <th className="pb-2 pr-4 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" /> Positive
                    </span>
                  </th>
                  <th className="pb-2 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-orange-500" /> Negative
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...summary.dailyTrend].reverse().map((point) => (
                  <tr key={point.date} className="border-b border-sand-100 text-ink-soft last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-ink-faint">{point.date}</td>
                    <td className="py-2 pr-4">{point.positive}</td>
                    <td className="py-2">{point.negative}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-bold text-ink">Beta cohort</h2>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          Same aggregate-only guarantee as above, scoped to accounts marked as beta
          (<code className="text-xs">isBetaUser</code>) — nothing here identifies which beta
          participant said what, only which profile types and reasons the negative feedback
          clusters around.
        </p>

        {betaPatterns.criticalReportCount > 0 && (
          <div className="mt-4 card border-orange-400 bg-orange-50">
            <h3 className="font-display text-sm font-bold text-orange-700">
              {betaPatterns.criticalReportCount} report{betaPatterns.criticalReportCount === 1 ? "" : "s"} flagged as inappropriate
            </h3>
            <p className="mt-1 text-xs text-ink-soft">
              Treated as critical by default (docs/PHASE_7_FAILURE_LEVELS.md) — escalate and
              review the underlying career page directly, not routine quality triage.
            </p>
            <div className="mt-3 space-y-2.5">
              {betaPatterns.criticalReportsByCareer.map((c) => (
                <LabeledCountBar key={c.label} item={c} max={betaPatterns.criticalReportsByCareer[0]?.count ?? 1} barColorClass="bg-orange-500" />
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="font-display text-sm font-bold text-ink">Negative feedback by education level</h3>
            <p className="mt-1 text-xs text-ink-faint">Which student-type mix is finding matches least useful.</p>
            <div className="mt-4 space-y-2.5">
              {betaPatterns.negativeFeedbackByEducationLevel.length === 0 && <p className="text-sm text-ink-soft">No beta feedback yet.</p>}
              {betaPatterns.negativeFeedbackByEducationLevel.map((b) => (
                <LabeledCountBar key={b.label} item={b} max={betaPatterns.negativeFeedbackByEducationLevel[0]?.count ?? 1} barColorClass="bg-orange-400" />
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-sm font-bold text-ink">Negative feedback by age range</h3>
            <p className="mt-1 text-xs text-ink-faint">Whether one age group is disproportionately unhappy with its matches.</p>
            <div className="mt-4 space-y-2.5">
              {betaPatterns.negativeFeedbackByAgeRange.length === 0 && <p className="text-sm text-ink-soft">No beta feedback yet.</p>}
              {betaPatterns.negativeFeedbackByAgeRange.map((b) => (
                <LabeledCountBar key={b.label} item={b} max={betaPatterns.negativeFeedbackByAgeRange[0]?.count ?? 1} barColorClass="bg-orange-400" />
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-sm font-bold text-ink">Negative feedback by internet access</h3>
            <p className="mt-1 text-xs text-ink-faint">A proxy for connectivity-related friction, not a direct technical-error count.</p>
            <div className="mt-4 space-y-2.5">
              {betaPatterns.negativeFeedbackByInternetAccess.length === 0 && <p className="text-sm text-ink-soft">No beta feedback yet.</p>}
              {betaPatterns.negativeFeedbackByInternetAccess.map((b) => (
                <LabeledCountBar key={b.label} item={b} max={betaPatterns.negativeFeedbackByInternetAccess[0]?.count ?? 1} barColorClass="bg-orange-400" />
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-display text-sm font-bold text-ink">Negative feedback by device access</h3>
            <p className="mt-1 text-xs text-ink-faint">A proxy for device-related friction, not a direct technical-error count.</p>
            <div className="mt-4 space-y-2.5">
              {betaPatterns.negativeFeedbackByDeviceAccess.length === 0 && <p className="text-sm text-ink-soft">No beta feedback yet.</p>}
              {betaPatterns.negativeFeedbackByDeviceAccess.map((b) => (
                <LabeledCountBar key={b.label} item={b} max={betaPatterns.negativeFeedbackByDeviceAccess[0]?.count ?? 1} barColorClass="bg-orange-400" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabeledCountBar({ item, max, barColorClass }: { item: LabeledCount; max: number; barColorClass: string }) {
  const widthPercent = max > 0 ? Math.round((item.count / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink">{item.label}</span>
        <span className="font-mono text-ink-faint">{item.count}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-sand-200">
        <div className={"h-full rounded-full " + barColorClass} style={{ width: `${widthPercent}%` }} />
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: "green" }) {
  return (
    <div className="card">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className={"mt-1.5 font-mono text-2xl font-bold " + (accent === "green" ? "text-green-500" : "text-ink")}>{value}</p>
    </div>
  );
}

function RankedCareerCard({
  title,
  caption,
  stats,
  emptyText,
  barColorClass,
}: {
  title: string;
  caption: string;
  stats: CareerFeedbackStat[];
  emptyText: string;
  barColorClass: string;
}) {
  return (
    <div className="card">
      <h2 className="font-display text-sm font-bold text-ink">{title}</h2>
      <p className="mt-1 text-xs text-ink-faint">{caption}</p>
      <div className="mt-4 space-y-3">
        {stats.length === 0 && <p className="text-sm text-ink-soft">{emptyText}</p>}
        {stats.map((s) => (
          <div key={s.careerName}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink">{s.careerName}</span>
              <span className="font-mono text-ink-faint">
                {s.positiveRatePercent}% positive ({s.positive}/{s.total})
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-sand-200">
              <div className={"h-full rounded-full " + barColorClass} style={{ width: `${s.positiveRatePercent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReasonBar({ reason, max }: { reason: ReasonCount; max: number }) {
  const widthPercent = max > 0 ? Math.round((reason.count / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink">{reason.label}</span>
        <span className="font-mono text-ink-faint">{reason.count}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-sand-200">
        <div className="h-full rounded-full bg-orange-500" style={{ width: `${widthPercent}%` }} />
      </div>
    </div>
  );
}

function CareerCountBar({ item, max, barColorClass }: { item: CareerCount; max: number; barColorClass: string }) {
  const widthPercent = max > 0 ? Math.round((item.count / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink">{item.careerName}</span>
        <span className="font-mono text-ink-faint">{item.count}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-sand-200">
        <div className={"h-full rounded-full " + barColorClass} style={{ width: `${widthPercent}%` }} />
      </div>
    </div>
  );
}
