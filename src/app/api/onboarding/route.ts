import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ONBOARDING_STEPS, stepIndex, type OnboardingStep } from "@/lib/onboarding";
import {
  accessStepSchema,
  educationStepSchema,
  interestsStepSchema,
  preferencesStepSchema,
  skillsStepSchema,
} from "@/lib/validation/onboarding";

function isOnboardingStep(value: unknown): value is OnboardingStep {
  return (
    typeof value === "string" &&
    (ONBOARDING_STEPS as readonly string[]).includes(value)
  );
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  const rawStep = body?.step;
  if (!isOnboardingStep(rawStep)) {
    return badRequest("Unknown onboarding step.");
  }
  const step = rawStep;

  switch (step) {
    case "education": {
      const parsed = educationStepSchema.safeParse(body.data);
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input.");
      const data = parsed.data;

      const existing = await prisma.education.findFirst({
        where: { userId, isCurrent: true },
      });
      const record = {
        level: data.level,
        institution: data.institution || null,
        program: data.program || null,
        subjects: data.subjects,
        strengths: data.strengths,
      };
      if (existing) {
        await prisma.education.update({ where: { id: existing.id }, data: record });
      } else {
        await prisma.education.create({ data: { userId, isCurrent: true, ...record } });
      }
      break;
    }

    case "skills": {
      const parsed = skillsStepSchema.safeParse(body.data);
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input.");
      const data = parsed.data;

      for (const item of data.skills) {
        await prisma.userSkill.upsert({
          where: { userId_skillId: { userId, skillId: item.skillId } },
          update: { level: item.level },
          create: { userId, skillId: item.skillId, level: item.level },
        });
      }

      for (const name of data.otherSkills) {
        const skill = await prisma.skill.upsert({
          where: { name },
          update: {},
          create: { name, category: "Other" },
        });
        await prisma.userSkill.upsert({
          where: { userId_skillId: { userId, skillId: skill.id } },
          update: {},
          create: { userId, skillId: skill.id, level: "BEGINNER" },
        });
      }
      break;
    }

    case "interests": {
      const parsed = interestsStepSchema.safeParse(body.data);
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input.");
      const data = parsed.data;

      for (const interestId of data.interestIds) {
        await prisma.userInterest.upsert({
          where: { userId_interestId: { userId, interestId } },
          update: {},
          create: { userId, interestId },
        });
      }
      break;
    }

    case "preferences": {
      const parsed = preferencesStepSchema.safeParse(body.data);
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input.");
      const data = parsed.data;

      await prisma.profile.update({
        where: { userId },
        data: {
          careerGoals: data.careerGoals || null,
          incomeGoal: data.incomeGoal || null,
          preferredEnvironment: data.preferredEnvironment,
          availableHoursPerWeek: data.availableHoursPerWeek,
        },
      });
      break;
    }

    case "access": {
      const parsed = accessStepSchema.safeParse(body.data);
      if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input.");
      const data = parsed.data;

      await prisma.profile.update({
        where: { userId },
        data: {
          hasLaptop: data.hasLaptop,
          hasSmartphone: data.hasSmartphone,
          internetAccess: data.internetAccess,
          languages: data.languages,
          linkedinUrl: data.linkedinUrl || null,
          portfolioUrl: data.portfolioUrl || null,
        },
      });
      break;
    }
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });
  const newStep = Math.max(profile?.onboardingStep ?? 0, stepIndex(step) + 1);
  const isLastStep = stepIndex(step) === ONBOARDING_STEPS.length - 1;

  await prisma.profile.update({
    where: { userId },
    data: {
      onboardingStep: newStep,
      ...(isLastStep ? { onboardingCompletedAt: new Date() } : {}),
    },
  });

  return NextResponse.json({ onboardingStep: newStep });
}
