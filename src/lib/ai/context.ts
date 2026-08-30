import { prisma } from "@/lib/prisma";

export const ASSISTANT_SYSTEM_PROMPT = `You are the 3Doors AI Career Assistant — a career guidance tool for students, graduates, and young professionals in Africa, starting in Cameroon. You are not a general-purpose chatbot.

Stay scoped to: career discovery, skill development, career planning, side-income guidance, portfolio development, and learning roadmaps. If asked something clearly outside that (general trivia, coding help unrelated to a career path, anything else), briefly redirect back to what 3Doors can help with.

Rules you must follow:
- This is career guidance, not a professional psychological, medical, legal, or financial assessment. Never present it as one.
- Never invent specific job openings, companies, scholarships, grants, or deadlines yourself. 3Doors does have a verified opportunity board with personalized matches — if asked where to find live openings, point them to their opportunities feed rather than naming any yourself. Only opportunities 3Doors has actually verified and shown them are real; you have no visibility into openings beyond that.
- Never state or imply guaranteed income or employment outcomes.
- Avoid absolute claims like "you should become X." Prefer "X could be a strong fit because..." and mention at least one alternative when recommending a direction.
- Ground answers in the user's own profile below when relevant, but don't just repeat it back — actually help.
- Keep answers concise, concrete, and actionable. Prefer a short list of next steps over a long essay.
- The career/side-income fit scores, opportunity match scores, and eligibility notes below are all calculated by deterministic rules, not by you — reference them, don't recompute them, and never restate any of them as a probability of being hired or accepted. They measure relevance, nothing more.
- You may reference the user's own real saved/applied opportunities and portfolio projects listed below. Never invent a new one, and never imply an application was submitted unless it's explicitly listed as such.`;

export async function buildAssistantContext(userId: string): Promise<string> {
  const [
    profile,
    education,
    userSkills,
    userInterests,
    careerMatches,
    roadmaps,
    sideIncomeMatches,
    portfolioProjects,
    opportunityMatches,
    opportunityApplications,
  ] = await Promise.all([
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
      include: { career: true, tasks: { orderBy: { order: "asc" } } },
    }),
    prisma.sideIncomeMatch.findMany({
      where: { userId },
      include: { sideOpportunity: true },
      orderBy: { rank: "asc" },
      take: 3,
    }),
    prisma.portfolioProject.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.opportunityMatch.findMany({
      where: { userId },
      include: { opportunity: true },
      orderBy: { rank: "asc" },
      take: 3,
    }),
    prisma.opportunityApplication.findMany({
      where: { userId },
      include: { opportunity: { select: { title: true, organization: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
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
    const done = roadmap.tasks.filter((t) => t.status === "DONE");
    const inProgress = roadmap.tasks.filter((t) => t.status === "IN_PROGRESS");
    const pending = roadmap.tasks.filter((t) => t.status === "PENDING");
    lines.push(
      `${roadmap.career.name} roadmap: ${done.length} of ${roadmap.tasks.length} tasks done.` +
        (inProgress.length > 0 ? ` Currently working on: ${inProgress.map((t) => t.title).join("; ")}.` : "") +
        (pending.length > 0 ? ` Not started yet: ${pending.slice(0, 3).map((t) => t.title).join("; ")}.` : "")
    );
  }
  if (sideIncomeMatches.length > 0) {
    lines.push(
      `Top side-income matches: ${sideIncomeMatches.map((m) => `${m.sideOpportunity.name} (${m.fitScore}% fit)`).join(", ")}.`
    );
  }
  if (portfolioProjects.length > 0) {
    lines.push(
      `Portfolio projects: ${portfolioProjects
        .map((p) => `${p.title} (${p.status.toLowerCase().replace("_", " ")})`)
        .join(", ")}.`
    );
  }
  if (opportunityMatches.length > 0) {
    lines.push(
      `Top verified opportunity matches: ${opportunityMatches
        .map((m) => {
          const flagNote = m.eligibilityFlags.length > 0 ? `, ${m.eligibilityFlags.length} eligibility gap${m.eligibilityFlags.length === 1 ? "" : "s"}` : "";
          return `"${m.opportunity.title}" at ${m.opportunity.organization} (${m.matchScore}% relevance${flagNote})`;
        })
        .join("; ")}.`
    );
  }
  if (opportunityApplications.length > 0) {
    lines.push(
      `Opportunities they've saved or applied to: ${opportunityApplications
        .map((a) => `"${a.opportunity.title}" at ${a.opportunity.organization} — ${a.status.toLowerCase().replace(/_/g, " ")}`)
        .join("; ")}.`
    );
  }

  return lines.length > 0 ? lines.join("\n") : "This user hasn't completed their profile or assessment yet.";
}

/**
 * Phase 4, dev-order 13 — the one-shot application assistant. Deliberately
 * a separate, narrower prompt from ASSISTANT_SYSTEM_PROMPT above: this one
 * is scoped to a single real opportunity and grounded only in facts pulled
 * fresh from the database below (the opportunity's own requirements, the
 * user's own skills/education/portfolio, and the already-computed
 * deterministic OpportunityMatch reasons/eligibilityFlags — never
 * re-derived or guessed at by the model). The standing rule this exists to
 * enforce: the AI may explain and suggest, but must never invent or imply
 * work experience, job titles, employment dates, certifications, or
 * achievements the user hasn't actually told 3Doors about.
 */
export const APPLICATION_ASSISTANT_SYSTEM_PROMPT = `You are the 3Doors Application Assistant. You help a user think through how to present themselves for ONE specific opportunity, using only the verified facts listed below under OPPORTUNITY and USER PROFILE.

Hard rules:
- Never invent or imply work experience, job titles, employment dates, certifications, degrees, or specific achievements that are not explicitly listed below. If it isn't in the facts below, you don't know it.
- Do not draft first-person claims as if you were the user (e.g. never write "I have 5 years of experience in..." unless that exact fact is listed). Give the user talking points and structure in the third person or as suggestions ("You could mention...", "Worth highlighting:...") — they write their own application in their own words.
- If the user's real background is missing something this opportunity wants, say so plainly rather than papering over it or suggesting they imply they have it.
- This is guidance only. 3Doors never submits applications and this is not a completed application — make that boundary clear if it's ever ambiguous.
- The match score and eligibility notes below are already calculated by deterministic rules, not by you — reference them, don't recompute or contradict them, and never restate the score as a probability of being accepted.

Keep the response short and concrete: three brief sections — "Strengths to lead with", "What to be upfront about", and "A tip for getting started" — a few lines each, no filler.`;

export async function buildApplicationAssistantContext(userId: string, opportunityId: string): Promise<string> {
  const [opportunity, education, userSkills, portfolioProjects, match] = await Promise.all([
    prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { skills: { include: { skill: true } } },
    }),
    prisma.education.findFirst({ where: { userId, isCurrent: true } }),
    prisma.userSkill.findMany({ where: { userId }, include: { skill: true } }),
    prisma.portfolioProject.findMany({ where: { userId, status: { not: "PLANNED" } }, take: 10 }),
    prisma.opportunityMatch.findUnique({ where: { userId_opportunityId: { userId, opportunityId } } }),
  ]);

  if (!opportunity) return "OPPORTUNITY: not found.";

  const lines: string[] = [];

  lines.push(
    `OPPORTUNITY: "${opportunity.title}" at ${opportunity.organization} (${opportunity.category}). ${opportunity.description}`
  );
  if (opportunity.eligibilityText) lines.push(`Stated eligibility: ${opportunity.eligibilityText}`);
  if (opportunity.skills.length > 0) {
    lines.push(
      `Skills the opportunity lists: ${opportunity.skills
        .map((s) => `${s.skill.name}${s.required ? "" : " (nice to have)"}`)
        .join(", ")}.`
    );
  }

  lines.push("");
  lines.push("USER PROFILE:");
  if (education) {
    lines.push(`Education: ${education.level}${education.program ? `, ${education.program}` : ""}.`);
  }
  if (userSkills.length > 0) {
    lines.push(`Skills the user actually has: ${userSkills.map((s) => `${s.skill.name} (${s.level.toLowerCase()})`).join(", ")}.`);
  } else {
    lines.push("Skills the user actually has: none listed yet.");
  }
  if (portfolioProjects.length > 0) {
    lines.push(
      `Real work the user can point to: ${portfolioProjects
        .map((p) => `${p.title} (${p.status.toLowerCase().replace("_", " ")})`)
        .join("; ")}.`
    );
  } else {
    lines.push("Real work the user can point to: nothing logged in their portfolio yet.");
  }

  if (match) {
    lines.push("");
    lines.push(`ALREADY-CALCULATED MATCH (deterministic, not generated by you): ${match.matchScore}% relevance.`);
    if (match.reasons.length > 0) lines.push(`Why it matched: ${match.reasons.join("; ")}.`);
    if (match.eligibilityFlags.length > 0) lines.push(`Eligibility gaps already flagged: ${match.eligibilityFlags.join("; ")}.`);
  } else {
    lines.push("");
    lines.push("No match score has been calculated for this opportunity yet.");
  }

  return lines.join("\n");
}
