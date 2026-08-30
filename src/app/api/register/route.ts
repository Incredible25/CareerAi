import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema, MINOR_AGE_RANGES } from "@/lib/validation/auth";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

const BCRYPT_ROUNDS = 12;

export async function POST(request: Request) {
  // Phase 5, Module 6/7: unauthenticated route, so keyed on IP rather
  // than userId. 20 signups per 15 minutes per IP still clearly blocks a
  // scripted flood (hundreds/thousands of attempts) while comfortably
  // accommodating a legitimate shared-IP burst — a school computer lab
  // or NAT'd household with several real people signing up close
  // together, the same shape of traffic a CI/QA suite produces against
  // a staging deployment. (Module 7 caught this empirically: this
  // project's own E2E suite does ~6 real registrations per run, and an
  // earlier, tighter limit of 8 started flaking under repeated manual
  // testing against one long-lived server.)
  if (isRateLimited(`register:${getClientIp(request)}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Please try again in a few minutes." }, { status: 429 });
  }

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
