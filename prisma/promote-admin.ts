/**
 * Grants ADMIN role to an existing user by email. Deliberately not a UI
 * flow or an API route — there is no self-serve path to admin access
 * (docs/PRODUCT_STRATEGY.md, Phase 4). Run directly by someone with
 * database/deploy access:
 *
 *   npx tsx prisma/promote-admin.ts someone@example.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npx tsx prisma/promote-admin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
  console.log(`${email} is now an ADMIN.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
