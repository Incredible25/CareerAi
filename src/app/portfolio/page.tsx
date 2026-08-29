import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isOnboardingComplete } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { PortfolioManager } from "@/components/portfolio/portfolio-manager";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile || !isOnboardingComplete(user.profile.onboardingStep)) redirect("/onboarding");

  const [projects, roadmaps] = await Promise.all([
    prisma.portfolioProject.findMany({
      where: { userId: user.id },
      include: { career: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.roadmap.findMany({ where: { userId: user.id }, include: { career: { select: { id: true, name: true } } } }),
  ]);

  const careerOptions = Array.from(new Map(roadmaps.map((r) => [r.career.id, r.career])).values());

  return (
    <div className="min-h-dvh bg-sand-50 pb-24">
      <AppHeader name={user.name} />

      <main className="mx-auto max-w-2xl px-6 pt-10 sm:px-10">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Your portfolio</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Track the real things you build — starter projects from your roadmap, side-income work,
          or anything else worth showing someone.
        </p>

        <div className="mt-8">
          <PortfolioManager
            initialProjects={projects.map((p) => ({
              id: p.id,
              title: p.title,
              description: p.description,
              link: p.link,
              status: p.status,
              career: p.career,
            }))}
            careerOptions={careerOptions}
          />
        </div>
      </main>
    </div>
  );
}
