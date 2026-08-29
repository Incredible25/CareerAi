import type { Metadata } from "next";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="min-h-dvh bg-sand-50">
      <header className="px-6 py-6 sm:px-10">
        <Logo />
      </header>
      <main className="mx-auto max-w-2xl px-6 pb-24">
        <h1 className="text-3xl font-bold text-ink">Terms</h1>
        <p className="mt-2 text-sm text-ink-faint">Last updated August 2026</p>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-ink-soft">
          <section>
            <h2 className="font-display text-lg font-semibold text-ink">What 3Doors is</h2>
            <p className="mt-2">
              3Doors is a career guidance tool. It helps you explore possible directions, identify
              skills to build, and plan next steps using your profile and a curated career
              knowledge base, combined with an AI reasoning layer.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">What it is not</h2>
            <p className="mt-2">
              3Doors is not a professional psychological, medical, legal, or financial advisory
              service, and it does not guarantee employment, income, or admission to any program.
              Career matches and roadmaps are guidance to inform your own decisions, not
              instructions to follow blindly — always use your own judgment, and where a decision
              is significant, seek advice from a qualified professional.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Your account</h2>
            <p className="mt-2">
              You&apos;re responsible for keeping your login details secure. Provide accurate
              information — the quality of your guidance depends on it. You may delete your
              account at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-ink">Acceptable use</h2>
            <p className="mt-2">
              Don&apos;t use 3Doors to submit false information on someone else&apos;s behalf,
              attempt to disrupt the service, or misuse the AI assistant to generate content
              unrelated to career guidance.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
