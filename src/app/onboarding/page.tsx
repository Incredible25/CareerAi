import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isOnboardingComplete } from "@/lib/onboarding";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export const metadata: Metadata = { title: "Your profile" };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.profile && isOnboardingComplete(user.profile.onboardingStep)) {
    redirect("/dashboard");
  }

  const [education, userSkills, userInterests, skills, interests] = await Promise.all([
    prisma.education.findFirst({ where: { userId: user.id, isCurrent: true } }),
    prisma.userSkill.findMany({ where: { userId: user.id }, include: { skill: true } }),
    prisma.userInterest.findMany({ where: { userId: user.id }, include: { interest: true } }),
    prisma.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.interest.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <OnboardingFlow
      startStepIndex={user.profile?.onboardingStep ?? 0}
      firstName={user.name.split(" ")[0] ?? user.name}
      skillCatalog={skills}
      interestCatalog={interests}
      initialData={{
        education: education
          ? {
              level: education.level,
              institution: education.institution ?? "",
              program: education.program ?? "",
              subjects: education.subjects.join(", "),
              strengths: education.strengths.join(", "),
            }
          : null,
        skills: userSkills.map((us) => ({ skillId: us.skillId, level: us.level })),
        interestIds: userInterests.map((ui) => ui.interestId),
        preferences: {
          careerGoals: user.profile?.careerGoals ?? "",
          incomeGoal: user.profile?.incomeGoal ?? "",
          preferredEnvironment: user.profile?.preferredEnvironment ?? "NO_PREFERENCE",
          availableHoursPerWeek: user.profile?.availableHoursPerWeek ?? 5,
        },
        access: {
          hasLaptop: user.profile?.hasLaptop ?? false,
          hasSmartphone: user.profile?.hasSmartphone ?? true,
          internetAccess: user.profile?.internetAccess ?? "INTERMITTENT",
          languages: (user.profile?.languages ?? []).join(", "),
          linkedinUrl: user.profile?.linkedinUrl ?? "",
          portfolioUrl: user.profile?.portfolioUrl ?? "",
        },
      }}
    />
  );
}
