/**
 * Marks or unmarks an existing user as part of the beta cohort. Mirrors
 * prisma/promote-admin.ts's convention: deliberately not a UI flow or an
 * API route — there is no self-serve path onto the beta cohort. Run
 * directly by someone with database/deploy access:
 *
 *   npx tsx prisma/mark-beta-user.ts someone@example.com on
 *   npx tsx prisma/mark-beta-user.ts someone@example.com off
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const action = process.argv[3]?.trim().toLowerCase();
  if (!email || (action !== "on" && action !== "off")) {
    console.error("Usage: npx tsx prisma/mark-beta-user.ts <email> <on|off>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  await prisma.user.update({ where: { email }, data: { isBetaUser: action === "on" } });
  console.log(`${email} beta status: ${action === "on" ? "ON" : "OFF"}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
