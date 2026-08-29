import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ status: z.enum(["REVIEWED", "DISMISSED"]) });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const report = await prisma.opportunityReport.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(report);
}
