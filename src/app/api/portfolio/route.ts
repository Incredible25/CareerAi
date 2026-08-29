import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { portfolioProjectSchema } from "@/lib/validation/portfolio";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = portfolioProjectSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }
  const { title, description, link, careerId, status } = parsed.data;

  const project = await prisma.portfolioProject.create({
    data: {
      userId: session.user.id,
      title,
      description,
      link: link || null,
      careerId: careerId || null,
      status,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
