import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });
}

/**
 * Fresh, database-backed admin check (Phase 4) — deliberately does not
 * trust the session/JWT's role claim, which only reflects role at sign-in
 * time. A role revoked mid-session must take effect immediately on the
 * next admin action, not after the token happens to refresh. Returns
 * null for anyone who isn't currently an admin.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || user.role !== "ADMIN") return null;

  return user;
}
