import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { portfolioStatusSchema } from "@/lib/validation/portfolio";

async function assertOwnership(id: string, userId: string) {
  const project = await prisma.portfolioProject.findUnique({ where: { id } });
  return project && project.userId === userId ? project : null;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const owned = await assertOwnership(params.id, session.user.id);
  if (!owned) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const parsed = portfolioStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const project = await prisma.portfolioProject.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });
  return NextResponse.json(project);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const owned = await assertOwnership(params.id, session.user.id);
  if (!owned) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.portfolioProject.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
