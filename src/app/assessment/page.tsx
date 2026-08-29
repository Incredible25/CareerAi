import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isOnboardingComplete } from "@/lib/onboarding";
import { AssessmentForm } from "@/components/assessment/assessment-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Self-discovery assessment" };

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: { retake?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile || !isOnboardingComplete(user.profile.onboardingStep)) {
    redirect("/onboarding");
  }

  const inProgress = await prisma.assessment.findFirst({
    where: { userId: user.id, status: "IN_PROGRESS" },
    orderBy: { startedAt: "desc" },
  });

  if (!inProgress) {
    const completed = await prisma.assessment.findFirst({
      where: { userId: user.id, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
    });

    if (completed && searchParams.retake !== "1") {
      return (
        <div className="min-h-dvh bg-sand-50">
          <header className="px-6 py-6 sm:px-10">
            <Logo />
          </header>
          <main className="mx-auto max-w-lg px-6 pb-24 text-center">
            <span className="badge">Already completed</span>
            <h1 className="mt-4 text-2xl font-bold text-ink">
              You&apos;ve already done this assessment
            </h1>
            <p className="mt-2 text-ink-soft">
              You can review your results, or retake it if a lot has changed since last time.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link href="/assessment/results" className="btn-primary">
                View my results
              </Link>
              <Link href="/assessment?retake=1" className="btn-secondary">
                Retake assessment
              </Link>
            </div>
          </main>
        </div>
      );
    }
  }

  const assessment =
    inProgress ?? (await prisma.assessment.create({ data: { userId: user.id } }));

  const existingAnswers = await prisma.assessmentAnswer.findMany({
    where: { assessmentId: assessment.id },
    select: { questionId: true, value: true },
  });

  return (
    <AssessmentForm
      assessmentId={assessment.id}
      initialAnswers={Object.fromEntries(existingAnswers.map((a) => [a.questionId, a.value]))}
    />
  );
}
