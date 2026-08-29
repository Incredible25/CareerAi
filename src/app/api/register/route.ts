import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, MINOR_AGE_RANGES } from "@/lib/validation/auth";

const BCRYPT_ROUNDS = 12;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }

  const { name, email, password, ageRange, country, city } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Deliberately generic message — do not confirm whether an email is
    // registered.
    return NextResponse.json(
      { error: "Could not create an account with these details." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      ageRange,
      country,
      city: city || null,
      isMinor: MINOR_AGE_RANGES.has(ageRange),
      profile: { create: {} },
    },
    select: { id: true, email: true },
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
