/**
 * Curated career <-> side-income cross-links (Phase 2, Module 1/6).
 *
 * Distinct from the generated SideIncomeMatch table: this is editorial
 * judgment ("these two are related"), not a computed score, and it's
 * intentionally sparse — only careers with a genuine skill overlap with
 * one of the 10 side-income paths get a link. Run after both
 * prisma/seed-careers.ts and prisma/seed-side-income.ts, since it only
 * connects rows that must already exist.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LINKS: [string, string[]][] = [
  ["digital-marketing", ["digital-marketing-income", "social-media-management"]],
  ["software-development", ["web-development-income"]],
  ["web-development", ["web-development-income"]],
  ["data-analysis", ["research-assistance"]],
  ["ux-ui-design", ["graphic-design-income"]],
  ["content-writing", ["content-writing-income"]],
  ["graphic-design", ["graphic-design-income"]],
  ["video-editing-production", ["video-editing-income"]],
  ["public-relations", ["content-writing-income"]],
  ["translation-localization", ["translation-income"]],
  ["sales-business-development", ["digital-marketing-income"]],
  ["teaching-tutoring", ["tutoring"]],
  ["entrepreneurship", ["digital-marketing-income", "virtual-assistance"]],
  ["customer-support", ["virtual-assistance"]],
  ["human-resources", ["virtual-assistance"]],
  ["legal-support-paralegal", ["research-assistance"]],
  ["sports-coaching-fitness", ["tutoring"]],
];

async function main() {
  let count = 0;
  for (const [careerSlug, sideSlugs] of LINKS) {
    const career = await prisma.careerProfile.findUnique({ where: { slug: careerSlug } });
    if (!career) throw new Error(`Unknown career slug "${careerSlug}" in seed-career-links.ts`);

    for (const sideSlug of sideSlugs) {
      const side = await prisma.sideOpportunity.findUnique({ where: { slug: sideSlug } });
      if (!side) throw new Error(`Unknown side-opportunity slug "${sideSlug}" in seed-career-links.ts`);

      await prisma.careerSideOpportunity.upsert({
        where: { careerId_sideOpportunityId: { careerId: career.id, sideOpportunityId: side.id } },
        update: {},
        create: { careerId: career.id, sideOpportunityId: side.id },
      });
      count++;
    }
  }
  console.log(`Seeded ${count} career <-> side-income links across ${LINKS.length} careers.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
