import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { sourceSchema } from "@/lib/validation/opportunities";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const parsed = sourceSchema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const source = await prisma.source.update({
    where: { id: params.id },
    data: { ...parsed.data, lastCheckedAt: new Date() },
  });
  return NextResponse.json(source);
}
