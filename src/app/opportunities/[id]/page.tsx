import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { visibleOpportunityWhere } from "@/lib/opportunities/visibility";
import { formatDeadline } from "@/lib/opportunities/format";
import { scoreLabel } from "@/lib/opportunities/matching";
import {
  CATEGORY_LABELS,
  REMOTE_STATUS_LABELS,
  EXPERIENCE_LABELS,
  EDUCATION_LEVEL_LABELS,
  SOURCE_TYPE_LABELS,
  VERIFICATION_LABELS,
} from "@/lib/opportunities/constants";
import { AppHeader } from "@/components/app-header";
import { OpportunityMatchBreakdownDetails } from "@/components/opportunities/match-breakdown";
import { SaveButton } from "@/components/opportunities/save-button";
import { ReportButton } from "@/components/opportunities/report-button";
import { ApplicationAssistant } from "@/components/opportunities/application-assistant";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const opportunity = await prisma.opportunity.findUnique({ where: { id: params.id } });
  return { title: opportunity?.title ?? "Opportunity" };
}

export default async function OpportunityDetailsPage({ params }: { params: { id: string } }) {
  // Fetched without the visibility filter first: a user who saved or
  // applied to this before it expired/got unverified/got archived must
  // still be able to open their own tracked page (dev-order 10-11's
  // application tracker links here) — only *discovering* a hidden
  // opportunity is blocked, not looking back at one you already engaged
  // with. See the isVisible check below.
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: params.id },
    include: {
      source: true,
      skills: { include: { skill: true } },
      careers: { include: { career: true } },
    },
  });
  if (!opportunity) notFound();

  // Opportunity pages sit behind auth (src/middleware.ts matches
  // /opportunities/:path*, same as /matches and /side-income) — this
  // page is never reached anonymously, so it doesn't carry a public
  // branch the way /careers/[slug] does.
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [match, application, isVisible, userSkillIds, openReport] = await Promise.all([
    prisma.opportunityMatch.findUnique({
      where: { userId_opportunityId: { userId: user.id, opportunityId: opportunity.id } },
    }),
    prisma.opportunityApplication.findUnique({
      where: { userId_opportunityId: { userId: user.id, opportunityId: opportunity.id } },
    }),
    prisma.opportunity.count({ where: { id: opportunity.id, ...visibleOpportunityWhere() } }).then((n) => n > 0),
    prisma.userSkill
      .findMany({ where: { userId: user.id }, select: { skillId: true } })
      .then((rows) => new Set(rows.map((r) => r.skillId))),
    prisma.opportunityReport.findFirst({
      where: { userId: user.id, opportunityId: opportunity.id, status: "OPEN" },
    }),
  ]);

  // The same visibility gate the feed and every other public query uses
  // (Phase 4, Module 5) — but only enforced against discovery: it 404s
  // for anyone with no existing application on this opportunity,
  // regardless of who has the direct link, while a user who already
  // tracked it keeps access with a clear "no longer active" notice below.
  if (!isVisible && !application) notFound();

  return (
    <div className="min-h-dvh bg-sand-50">
      <AppHeader name={user.name} isAdmin={user.role === "ADMIN"} />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10 sm:px-10">
        <Link href="/opportunities" className="text-sm font-medium text-ink-soft hover:text-ink">
          ← All opportunities
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="badge">{CATEGORY_LABELS[opportunity.category]}</span>
          <span className={"badge " + (opportunity.verificationStatus === "VERIFIED" ? "border-green-500 text-green-500" : "")}>
            {VERIFICATION_LABELS[opportunity.verificationStatus]}
          </span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-ink">{opportunity.title}</h1>
        <p className="mt-1 text-ink-soft">{opportunity.organization}</p>

        <p className="mt-3 text-sm text-ink-faint">
          {formatDeadline(opportunity.applicationDeadline)}
          {opportunity.location && <> · {opportunity.location}</>}
          {" · "}
          {REMOTE_STATUS_LABELS[opportunity.remoteStatus]}
        </p>

        <div className="mt-4">
          <SaveButton
            opportunityId={opportunity.id}
            initialApplication={application ? { id: application.id, status: application.status } : null}
          />
        </div>

        {!isVisible && (
          <div className="card mt-4 border-orange-400 bg-orange-50">
            <p className="text-sm text-orange-700">
              This opportunity is no longer active — it may have expired or been pulled since you
              tracked it. You can still see what you saved and update your tracker below, but
              double-check before applying.
            </p>
          </div>
        )}

        {match ? (
          <div className="card mt-6 border-green-500/30 bg-green-50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="badge badge-ai">Your match score</span>
                <p className="mt-1 text-sm text-ink-soft">
                  {scoreLabel(match.matchScore)} relevance to your profile — not a probability of
                  being accepted.
                </p>
              </div>
              <p className="font-mono text-3xl font-bold text-green-500">{match.matchScore}%</p>
            </div>

            {match.eligibilityFlags.length > 0 && (
              <ul className="mt-3 space-y-1 rounded-lg2 bg-orange-50 px-3 py-2 text-xs text-orange-700">
                {match.eligibilityFlags.map((flag) => (
                  <li key={flag}>⚠ {flag}</li>
                ))}
              </ul>
            )}

            {match.reasons.length > 0 && (
              <ul className="mt-3 list-inside list-disc space-y-0.5 text-sm text-ink-soft">
                {match.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}

            <OpportunityMatchBreakdownDetails breakdown={match.breakdown} />
          </div>
        ) : (
          <div className="card mt-6">
            <p className="text-sm text-ink-soft">We haven&apos;t calculated your match score for this yet.</p>
            <Link href="/opportunities" className="btn-primary mt-3 inline-flex !px-4 !py-2 text-sm">
              See my opportunities
            </Link>
          </div>
        )}

        <ApplicationAssistant opportunityId={opportunity.id} />

        <Section title="About this opportunity">
          <p className="whitespace-pre-line text-sm text-ink-soft">{opportunity.description}</p>
        </Section>

        <Section title="Eligibility">
          <dl className="space-y-2 text-sm">
            {opportunity.minEducationLevel && (
              <Row label="Minimum education" value={EDUCATION_LEVEL_LABELS[opportunity.minEducationLevel]} />
            )}
            <Row label="Experience" value={EXPERIENCE_LABELS[opportunity.experienceRequirement]} />
            {opportunity.eligibleCountries.length > 0 && (
              <Row label="Open to applicants from" value={opportunity.eligibleCountries.join(", ")} />
            )}
            {opportunity.country && <Row label="Location" value={opportunity.country} />}
            {opportunity.eligibilityText && (
              <div className="pt-1">
                <p className="font-medium text-ink">Full eligibility details</p>
                <p className="mt-0.5 whitespace-pre-line text-ink-soft">{opportunity.eligibilityText}</p>
              </div>
            )}
          </dl>
        </Section>

        {opportunity.skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {opportunity.skills.map((s) => (
                <span
                  key={s.id}
                  className={"badge " + (userSkillIds.has(s.skillId) ? "border-green-500 text-green-500" : "")}
                >
                  {s.skill.name} {s.required ? "" : "(nice to have)"}
                </span>
              ))}
            </div>
          </Section>
        )}

        {opportunity.careers.length > 0 && (
          <Section title="Related careers">
            <div className="flex flex-wrap gap-2">
              {opportunity.careers.map((c) => (
                <Link
                  key={c.id}
                  href={`/careers/${c.career.slug}`}
                  className="badge hover:border-green-500 hover:text-green-500"
                >
                  {c.career.name}
                </Link>
              ))}
            </div>
          </Section>
        )}

        <Section title="Source">
          <p className="text-sm text-ink-soft">
            {opportunity.source.name} ({SOURCE_TYPE_LABELS[opportunity.source.type]})
          </p>
          <a
            href={opportunity.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs font-medium text-ink-faint hover:text-ink hover:underline"
          >
            View original listing ↗
          </a>
        </Section>

        <div className="mt-8 border-t border-sand-200 pt-8">
          <a
            href={opportunity.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex !px-6 !py-3"
          >
            View & apply on {opportunity.organization} ↗
          </a>
          <p className="mt-2 text-xs text-ink-faint">
            Opens the organization&apos;s own application page. 3Doors never submits applications
            on your behalf.
          </p>
        </div>

        <div className="mt-4">
          <ReportButton opportunityId={opportunity.id} initialReported={!!openReport} />
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 border-t border-sand-200 pt-8">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}
