import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const PATH_STEPS = [
  "Self-discovery",
  "Career direction",
  "Skill development",
  "Practical experience",
  "Portfolio",
  "Opportunities",
  "Income",
  "Long-term growth",
];

const PILLARS = [
  {
    name: "Access",
    color: "bg-green-500",
    body: "Free to start, and built to work on a modest phone and an ordinary data bundle — not just on fast wifi and a laptop.",
  },
  {
    name: "Excellence",
    color: "bg-navy-500",
    body: "A transparent, structured scoring method behind every recommendation — never a one-line verdict with no reasoning shown.",
  },
  {
    name: "Opportunity",
    color: "bg-orange-500",
    body: "Every plan ends in something you can start this week, not just a long-term goal for someday.",
  },
];

export default function LandingPage() {
  return (
    <div className="bg-sand-50">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:px-10 sm:pt-24">
        <div className="max-w-2xl">
          <span className="badge">Built for young Africans, starting in Cameroon</span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            Discover your direction. Build your skills. Find your opportunities.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            3Doors is a personal AI career navigator — not a personality quiz, not a generic
            chatbot. A structured path from &ldquo;I don&apos;t know what&apos;s next&rdquo; to a
            plan you can actually act on today.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/register" className="btn-primary">
              Start free
            </Link>
            <Link href="#how-it-works" className="btn-secondary">
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-faint">
            Free to start · No credit card · Takes about 10 minutes
          </p>
        </div>
      </section>

      {/* The path */}
      <section id="how-it-works" className="border-y border-sand-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">One continuous path, not a one-off quiz</h2>
          <p className="mt-2 max-w-xl text-ink-soft">
            Every part of 3Doors moves you along the same line — from understanding yourself to
            holding a real opportunity.
          </p>
          <ol className="mt-10 flex flex-wrap gap-x-2 gap-y-4">
            {PATH_STEPS.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className="flex items-center gap-2 rounded-full border border-sand-300 bg-sand-50 px-4 py-2 text-sm font-medium text-ink">
                  <span className="font-mono text-xs text-green-500">{String(i + 1).padStart(2, "0")}</span>
                  {step}
                </span>
                {i < PATH_STEPS.length - 1 && (
                  <span aria-hidden="true" className="text-ink-faint">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sample result */}
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              Every recommendation shows its reasoning
            </h2>
            <p className="mt-3 max-w-md text-ink-soft">
              No black-box verdicts. Every career match comes with a fit score built from your
              interests, skills, subjects, and goals — and exactly why it landed where it did.
            </p>
            <p className="mt-3 max-w-md text-sm text-ink-faint">
              This is a sample of what a result looks like. Your own matches are generated from
              your profile after you complete the free assessment — nothing here has been
              calculated for you yet.
            </p>
          </div>

          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="badge badge-ai">Sample result</span>
                <h3 className="mt-2 font-display text-xl font-bold text-ink">Digital Marketing</h3>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-bold text-green-500">87%</p>
                <p className="text-xs text-ink-faint">fit score</p>
              </div>
            </div>

            <div className="mt-4 space-y-1 text-sm text-ink-soft">
              <p className="font-medium text-ink">Why this may fit</p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>Strong interest in social media</li>
                <li>Good communication ability</li>
                <li>Comfortable with digital tools</li>
              </ul>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-ink">Current strengths</p>
                <p className="mt-0.5 text-ink-soft">Communication, creativity</p>
              </div>
              <div>
                <p className="font-medium text-ink">Skills to develop</p>
                <p className="mt-0.5 text-ink-soft">SEO, analytics, copywriting</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg2 bg-sand-50 px-4 py-3 text-sm">
              <p className="font-medium text-ink">Starter project</p>
              <p className="mt-0.5 text-ink-soft">
                Create a 30-day social media campaign for a local business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="border-t border-sand-200 bg-white py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">Three doors, one purpose</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar.name} className="card">
                <span aria-hidden="true" className={`block h-2 w-10 rounded-full ${pillar.color}`} />
                <h3 className="mt-4 font-display text-lg font-bold text-ink">{pillar.name}</h3>
                <p className="mt-2 text-sm text-ink-soft">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="mx-auto max-w-6xl px-6 py-20 sm:px-10">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Guidance you can actually trust</h2>
            <p className="mt-3 max-w-md text-ink-soft">
              Career guidance only works if you can trust it. 3Doors is built to say what it
              knows, what it&apos;s estimating, and what it doesn&apos;t know — rather than
              inventing an answer.
            </p>
          </div>
          <ul className="space-y-4 text-sm text-ink-soft">
            <li className="flex gap-3">
              <span className="badge">AI guidance</span>
              Clearly labeled everywhere it appears — a tool for career planning, not a
              psychological or clinical assessment.
            </li>
            <li className="flex gap-3">
              <span className="badge">No invented facts</span>
              Jobs, scholarships, companies, and figures are never fabricated — where we
              can&apos;t verify something, we say so.
            </li>
            <li className="flex gap-3">
              <span className="badge">Your data, your control</span>
              Edit your profile anytime, export or delete your data whenever you want.
            </li>
          </ul>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
