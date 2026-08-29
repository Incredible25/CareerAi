import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeTraitScores, TOTAL_QUESTIONS } from "@/lib/assessment/scoring";

const submitSchema = z.object({ assessmentId: z.string().min(1) });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = submitSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { assessmentId } = parsed.data;

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: { answers: true },
  });
  if (!assessment || assessment.userId !== session.user.id) {
    return NextResponse.json({ error: "Assessment not found." }, { status: 404 });
  }
  if (assessment.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "This assessment is already complete." }, { status: 409 });
  }
  if (assessment.answers.length < TOTAL_QUESTIONS) {
    return NextResponse.json(
      { error: `Answer all ${TOTAL_QUESTIONS} questions before submitting.` },
      { status: 400 }
    );
  }

  const traitScores = computeTraitScores(assessment.answers);

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      traitScores,
    },
  });

  return NextResponse.json({ ok: true });
}
