import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { feedbackSchema } from "@/lib/validation/feedback";

/**
 * Feedback is polymorphic (subjectType + subjectId, Phase 2 Module 10) —
 * there's no DB-level foreign key tying subjectId to the right table, so
 * this route is the one place that must check the subject actually
 * belongs to the submitting user before accepting a vote. Never trust
 * subjectId alone: without this check any signed-in user could leave
 * "feedback" against another user's private AI conversation or career
 * match by guessing an id.
 */
async function subjectBelongsToUser(subjectType: "AI_MESSAGE" | "CAREER_MATCH", subjectId: string, userId: string): Promise<boolean> {
  if (subjectType === "AI_MESSAGE") {
    const message = await prisma.aiMessage.findUnique({
      where: { id: subjectId },
      include: { conversation: { select: { userId: true } } },
    });
    return message?.conversation.userId === userId;
  }
  const match = await prisma.careerMatch.findUnique({ where: { id: subjectId }, select: { userId: true } });
  return match?.userId === userId;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  const parsed = feedbackSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { subjectType, subjectId, helpful, comment } = parsed.data;
  // The structured reason taxonomy ("doesn't match my subjects", etc.) only
  // makes sense for a career match — an AI chat reply has no subjects or
  // accessibility to not-match. Drop it silently for any other subject type
  // rather than rejecting the request, so a client bug can't turn into a 400.
  const reason = subjectType === "CAREER_MATCH" ? parsed.data.reason ?? null : null;

  if (!(await subjectBelongsToUser(subjectType, subjectId, userId))) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const feedback = await prisma.feedback.upsert({
    where: { userId_subjectType_subjectId: { userId, subjectType, subjectId } },
    create: { userId, subjectType, subjectId, helpful, reason, comment: comment || null },
    update: { helpful, reason, comment: comment || null },
  });

  return NextResponse.json(feedback);
}
