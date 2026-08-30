import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applicationUpdateSchema } from "@/lib/validation/applications";

async function assertOwnership(id: string, userId: string) {
  const application = await prisma.opportunityApplication.findUnique({ where: { id } });
  return application && application.userId === userId ? application : null;
}

// Every status from here on implies the user actually submitted an
// application somewhere — SAVED and PLANNING_TO_APPLY don't.
const STATUSES_IMPLYING_APPLIED = new Set([
  "APPLIED",
  "INTERVIEW_SELECTION",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
]);

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const owned = await assertOwnership(params.id, session.user.id);
  if (!owned) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = applicationUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { status, notes } = parsed.data;

  const application = await prisma.opportunityApplication.update({
    where: { id: params.id },
    data: {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
      // Set once, on the transition into a status that implies an
      // application was actually submitted — recorded as "now" because
      // that's genuinely when the user told us, never backdated or
      // guessed. Once set it's a historical fact and is never cleared
      // by a later status change, including moving back to an earlier
      // stage (docs/PRODUCT_STRATEGY.md — "3Doors never claims an
      // application happened" cuts both ways: never invent it, and
      // never erase a real one either).
      ...(status && STATUSES_IMPLYING_APPLIED.has(status) && !owned.appliedAt ? { appliedAt: new Date() } : {}),
    },
  });

  return NextResponse.json(application);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const owned = await assertOwnership(params.id, session.user.id);
  if (!owned) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.opportunityApplication.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
