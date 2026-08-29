import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FitBreakdownDetails } from "@/components/matches/fit-breakdown";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const career = await prisma.careerProfile.findUnique({ where: { slug: params.slug } });
  return { title: career?.name ?? "Career" };
}

const LEVEL_LABELS = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" } as const;
const ENV_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  IN_PERSON: "In-person",
  HYBRID: "Hybrid",
  NO_PREFERENCE: "Flexible",
};

export default async function CareerProfilePage({ params }: { params: { slug: string } }) {
  const career = await prisma.careerProfile.findUnique({
    where: { slug: params.slug },
    include: {
      careerSkills: { include: { skill: true } },
      relatedCareers: true,
    },
  });
  if (!career) notFound();

  const user = await getCurrentUser();
  const match = user
    ? await prisma.careerMatch.findFirst({
        where: { userId: user.id, careerId: career.id },
        orderBy: { generatedAt: "desc" },
      })
    : null;

  const skillsByLevel = {
    BEGINNER: career.careerSkills.filter((cs) => cs.level === "BEGINNER"),
    INTERMEDIATE: career.careerSkills.filter((cs) => cs.level === "INTERMEDIATE"),
    ADVANCED: career.careerSkills.filter((cs) => cs.level === "ADVANCED"),
  };

  return (
    <div className="min-h-dvh bg-sand-50">
      {user ? <AppHeader name={user.name} isAdmin={user.role === "ADMIN"} /> : <SiteHeader />}

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-10 sm:px-10">
        <span className="badge">{career.industry}</span>
        <h1 className="mt-3 text-3xl font-bold text-ink">{career.name}</h1>
        <p className="mt-3 max-w-xl text-ink-soft">{career.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {career.remoteSuitable && <span className="badge">Remote-suitable</span>}
          {career.freelanceSuitable && <span className="badge">Freelance-suitable</span>}
          {career.environments.map((env) => (
            <span key={env} className="badge">{ENV_LABELS[env]}</span>
          ))}
        </div>

        {match && (
          <div className="card mt-6 border-green-500/30 bg-green-50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="badge badge-ai">Your fit score</span>
                <p className="mt-1 text-sm text-ink-soft">Based on your profile and assessment.</p>
              </div>
              <p className="font-mono text-3xl font-bold text-green-500">{match.fitScore}%</p>
            </div>
            {match.reasons.length > 0 && (
              <ul className="mt-3 list-inside list-disc space-y-0.5 text-sm text-ink-soft">
                {match.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
            <FitBreakdownDetails breakdown={match.breakdown} />
            <Link href={`/careers/${career.slug}/plan`} className="btn-primary mt-4 inline-flex !px-4 !py-2 text-sm">
              See my skill gap and roadmap
            </Link>
          </div>
        )}

        {!match && (
          <div className="card mt-6">
            <p className="text-sm text-ink-soft">
              {user
                ? "Complete your self-discovery assessment to see your personal fit score for this career."
                : "Create a free account to see your personal fit score and a skill-gap roadmap for this career."}
            </p>
            <Link
              href={user ? "/assessment" : "/register"}
              className="btn-primary mt-3 inline-flex !px-4 !py-2 text-sm"
            >
              {user ? "Take the assessment" : "Start free"}
            </Link>
          </div>
        )}

        <Section title="What people in this career typically do">
          <ul className="list-inside list-disc space-y-1 text-sm text-ink-soft">
            {career.responsibilities.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Section>

        <Section title="Skills involved">
          <div className="space-y-4">
            {(["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) =>
              skillsByLevel[level].length > 0 ? (
                <div key={level}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    {LEVEL_LABELS[level]}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {skillsByLevel[level].map((cs) => (
                      <span key={cs.id} className="badge">{cs.skill.name}</span>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </Section>

        <Section title="How people get here">
          <p className="text-sm font-medium text-ink">Typical pathway</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-soft">
            {career.educationPathways.map((p) => <li key={p}>{p}</li>)}
          </ul>
          <p className="mt-3 text-sm font-medium text-ink">Alternative pathways</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-soft">
            {career.alternativePathways.map((p) => <li key={p}>{p}</li>)}
          </ul>
          {career.certifications.length > 0 && (
            <>
              <p className="mt-3 text-sm font-medium text-ink">Certifications worth knowing about</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-soft">
                {career.certifications.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </>
          )}
        </Section>

        <Section title="How to start building proof of skill">
          <p className="text-sm font-medium text-ink">A project to try</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-soft">
            {career.beginnerProjects.map((p) => <li key={p}>{p}</li>)}
          </ul>
          <p className="mt-3 text-sm font-medium text-ink">What a portfolio should include</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-soft">
            {career.portfolioRequirements.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </Section>

        {career.relatedCareers.length > 0 && (
          <Section title="Related careers">
            <div className="flex flex-wrap gap-2">
              {career.relatedCareers.map((rc) => (
                <Link key={rc.id} href={`/careers/${rc.slug}`} className="badge hover:border-green-500 hover:text-green-500">
                  {rc.name}
                </Link>
              ))}
            </div>
          </Section>
        )}
      </main>

      {!user && <SiteFooter />}
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
