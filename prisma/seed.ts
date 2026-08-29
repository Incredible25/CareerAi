/**
 * Seeds the shared, admin-curated skills and interests catalogs that the
 * onboarding flow and assessment scoring read from. These are deliberately
 * generic (not tied to any one career) — the Phase 2 career knowledge base
 * will layer career-specific requirements on top of this same `skills`
 * table (docs/PRODUCT_STRATEGY.md §6, career_skills).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SKILLS: { name: string; category: string }[] = [
  // Digital & tech
  { name: "Basic computer literacy", category: "Digital & Tech" },
  { name: "Microsoft/Google Workspace", category: "Digital & Tech" },
  { name: "Canva / basic graphic design", category: "Digital & Tech" },
  { name: "Social media platforms", category: "Digital & Tech" },
  { name: "Basic HTML/CSS", category: "Digital & Tech" },
  { name: "Spreadsheets & data entry", category: "Digital & Tech" },
  { name: "Video editing basics", category: "Digital & Tech" },
  { name: "Typing speed & accuracy", category: "Digital & Tech" },
  // Communication & language
  { name: "Written English", category: "Communication & Language" },
  { name: "Written French", category: "Communication & Language" },
  { name: "Public speaking", category: "Communication & Language" },
  { name: "Copywriting", category: "Communication & Language" },
  { name: "Translation", category: "Communication & Language" },
  { name: "Customer communication", category: "Communication & Language" },
  // Business & admin
  { name: "Calendar & email management", category: "Business & Admin" },
  { name: "Basic bookkeeping", category: "Business & Admin" },
  { name: "Sales & negotiation", category: "Business & Admin" },
  { name: "Project coordination", category: "Business & Admin" },
  { name: "Research skills", category: "Business & Admin" },
  // Creative
  { name: "Photography", category: "Creative" },
  { name: "Illustration / drawing", category: "Creative" },
  { name: "Content creation", category: "Creative" },
  { name: "Storytelling", category: "Creative" },
  // Analytical
  { name: "Problem solving", category: "Analytical" },
  { name: "Data analysis basics", category: "Analytical" },
  { name: "Critical thinking", category: "Analytical" },
  // Interpersonal & leadership
  { name: "Teamwork", category: "Interpersonal & Leadership" },
  { name: "Leadership / organizing groups", category: "Interpersonal & Leadership" },
  { name: "Teaching / tutoring", category: "Interpersonal & Leadership" },
  { name: "Event planning", category: "Interpersonal & Leadership" },
];

const INTERESTS: { name: string; category: string }[] = [
  { name: "Technology & software", category: "Technology" },
  { name: "Business & entrepreneurship", category: "Business" },
  { name: "Marketing & branding", category: "Business" },
  { name: "Finance & investing", category: "Business" },
  { name: "Design & visual arts", category: "Creative" },
  { name: "Writing & storytelling", category: "Creative" },
  { name: "Music & performance", category: "Creative" },
  { name: "Health & medicine", category: "Science & Helping" },
  { name: "Teaching & mentoring", category: "Science & Helping" },
  { name: "Community & social impact", category: "Science & Helping" },
  { name: "Science & research", category: "Science & Analysis" },
  { name: "Engineering & how things work", category: "Science & Analysis" },
  { name: "Environment & agriculture", category: "Science & Analysis" },
  { name: "Law & policy", category: "Society" },
  { name: "Media & journalism", category: "Society" },
  { name: "Sports & fitness", category: "Hands-on" },
  { name: "Building & fixing things", category: "Hands-on" },
  { name: "Travel & culture", category: "Society" },
];

async function main() {
  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: { category: skill.category },
      create: skill,
    });
  }

  for (const interest of INTERESTS) {
    await prisma.interest.upsert({
      where: { name: interest.name },
      update: { category: interest.category },
      create: interest,
    });
  }

  console.log(`Seeded ${SKILLS.length} skills and ${INTERESTS.length} interests.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
