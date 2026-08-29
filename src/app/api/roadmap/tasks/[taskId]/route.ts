import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({ status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]) });

export async function PATCH(request: Request, { params }: { params: { taskId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const task = await prisma.roadmapTask.findUnique({
    where: { id: params.taskId },
    include: { roadmap: true },
  });
  if (!task || task.roadmap.userId !== session.user.id) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  await prisma.roadmapTask.update({
    where: { id: params.taskId },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}
