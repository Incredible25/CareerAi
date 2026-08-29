import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ASSESSMENT_QUESTIONS } from "@/lib/assessment/questions";

const answerSchema = z.object({
  assessmentId: z.string().min(1),
  questionId: z.string().min(1),
  value: z.number().int().min(1).max(5),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = answerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid answer." },
      { status: 400 }
    );
  }
  const { assessmentId, questionId, value } = parsed.data;

  // Trait comes from our own question catalog, never from the client —
  // the same guardrail principle as the AI pipeline: derived facts are
  // computed server-side from a trusted source, not accepted as input.
  const question = ASSESSMENT_QUESTIONS.find((q) => q.id === questionId);
  if (!question) {
    return NextResponse.json({ error: "Unknown question." }, { status: 400 });
  }

  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment || assessment.userId !== session.user.id) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  }
  if (assessment.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "This assessment is already complete." }, { status: 409 });
  }

  await prisma.assessmentAnswer.upsert({
    where: { assessmentId_questionId: { assessmentId, questionId } },
    update: { value, trait: question.trait },
    create: { assessmentId, questionId, value, trait: question.trait },
  });

  return NextResponse.json({ ok: true });
}
