import { prisma } from "@/lib/prisma";

export const ASSISTANT_SYSTEM_PROMPT = `You are the 3Doors AI Career Assistant — a career guidance tool for students, graduates, and young professionals in Africa, starting in Cameroon. You are not a general-purpose chatbot.

Stay scoped to: career discovery, skill development, career planning, side-income guidance, portfolio development, and learning roadmaps. If asked something clearly outside that (general trivia, coding help unrelated to a career path, anything else), briefly redirect back to what 3Doors can help with.

Rules you must follow:
- This is career guidance, not a professional psychological, medical, legal, or financial assessment. Never present it as one.
- Never invent specific job openings, companies, scholarships, grants, or deadlines. 3Doors does not have an opportunity listing system yet. If asked where to find live openings, say so plainly and suggest searching directly, asking their network, or checking organizations they're interested in — do not name specific "current" openings.
- Never state or imply guaranteed income or employment outcomes.
- Avoid absolute claims like "you should become X." Prefer "X could be a strong fit because..." and mention at least one alternative when recommending a direction.
- Ground answers in the user's own profile below when relevant, but don't just repeat it back — actually help.
- Keep answers concise, concrete, and actionable. Prefer a short list of next steps over a long essay.`;

export async function buildAssistantContext(userId: string): Promise<string> {
  const [profile, education, userSkills, userInterests, careerMatches, roadmaps, sideIncomeMatches] =
    await Promise.all([
      prisma.profile.findUnique({ where: { userId } }),
      prisma.education.findFirst({ where: { userId, isCurrent: true } }),
      prisma.userSkill.findMany({ where: { userId }, include: { skill: true }, take: 15 }),
      prisma.userInterest.findMany({ where: { userId }, include: { interest: true } }),
      prisma.careerMatch.findMany({
        where: { userId },
        include: { career: true },
        orderBy: [{ generatedAt: "desc" }, { rank: "asc" }],
        take: 5,
      }),
      prisma.roadmap.findMany({
        where: { userId },
        include: { career: true, tasks: { where: { status: { not: "DONE" } }, orderBy: { order: "asc" }, take: 3 } },
      }),
      prisma.sideIncomeMatch.findMany({
        where: { userId },
        include: { sideOpportunity: true },
        orderBy: { rank: "asc" },
        take: 3,
      }),
    ]);

  const lines: string[] = [];

  if (education) {
    lines.push(`Education: ${education.level}${education.program ? `, ${education.program}` : ""}. Subjects: ${education.subjects.join(", ") || "none listed"}.`);
  }
  if (userSkills.length > 0) {
    lines.push(`Skills: ${userSkills.map((s) => `${s.skill.name} (${s.level.toLowerCase()})`).join(", ")}.`);
  }
  if (userInterests.length > 0) {
    lines.push(`Interests: ${userInterests.map((i) => i.interest.name).join(", ")}.`);
  }
  if (profile?.careerGoals) lines.push(`Stated career goals: ${profile.careerGoals}`);
  if (profile?.availableHoursPerWeek != null) lines.push(`Available time: ~${profile.availableHoursPerWeek} hours/week.`);
  if (profile?.internetAccess) lines.push(`Internet access: ${profile.internetAccess.toLowerCase().replace("_", " ")}.`);

  if (careerMatches.length > 0) {
    lines.push(
      `Top career matches: ${careerMatches.map((m) => `${m.career.name} (${m.fitScore}% fit)`).join(", ")}.`
    );
  }
  for (const roadmap of roadmaps) {
    if (roadmap.tasks.length > 0) {
      lines.push(
        `Next steps on their ${roadmap.career.name} roadmap: ${roadmap.tasks.map((t) => t.title).join("; ")}.`
      );
    }
  }
  if (sideIncomeMatches.length > 0) {
    lines.push(
      `Top side-income matches: ${sideIncomeMatches.map((m) => `${m.sideOpportunity.name} (${m.fitScore}% fit)`).join(", ")}.`
    );
  }

  return lines.length > 0 ? lines.join("\n") : "This user hasn't completed their profile or assessment yet.";
}
