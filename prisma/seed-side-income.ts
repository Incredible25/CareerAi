/**
 * Side-income catalog seed (docs/PRODUCT_STRATEGY.md §9).
 *
 * A structured catalog of legitimate, skill-based income paths — not a
 * feed of live job listings (that system is deferred; see the August 2026
 * scope amendment). No earnings figures appear anywhere here: every path
 * is framed as a "potential income path," never a promise.
 */
import { PrismaClient, type SkillLevel } from "@prisma/client";

const prisma = new PrismaClient();

type SideIncomeSeed = {
  slug: string;
  name: string;
  description: string;
  tools: string[];
  learningNotes: string;
  starterProject: string;
  portfolioRequirements: string[];
  clientApproachTips: string[];
  remoteSuitable: boolean;
  freelanceSuitable: boolean;
  skills: { name: string; level: SkillLevel }[];
};

const SIDE_OPPORTUNITIES: SideIncomeSeed[] = [
  {
    slug: "virtual-assistance",
    name: "Virtual Assistance",
    description: "Providing remote administrative support — email, scheduling, data entry, and everyday coordination — for a business owner or team.",
    tools: ["Email", "Google Calendar", "Google Workspace / Microsoft Office", "A task management app (e.g. Trello, Notion)"],
    learningNotes: "Most of this is learnable in 1-2 weeks through free tutorials on calendar management, professional email etiquette, and common productivity tools — the core skill is organization, not software expertise.",
    starterProject: "Organize a mock inbox and calendar for a week — practice prioritizing, scheduling, and drafting professional replies.",
    portfolioRequirements: ["A short description of your organizational process", "Any real experience managing schedules/tasks, even informally"],
    clientApproachTips: [
      "Offer a small trial task (e.g. a few hours) to a local business owner you already know",
      "List the specific tools you're comfortable with, not just \"organized\"",
      "General freelance platforms are one channel, but a warm introduction through your own network converts far better when starting out",
    ],
    remoteSuitable: true,
    freelanceSuitable: true,
    skills: [
      { name: "Calendar & email management", level: "BEGINNER" },
      { name: "Microsoft/Google Workspace", level: "BEGINNER" },
      { name: "Written English", level: "INTERMEDIATE" },
    ],
  },
  {
    slug: "social-media-management",
    name: "Social Media Management",
    description: "Running the day-to-day social media presence for a small business or creator — posting, engaging, and tracking what works.",
    tools: ["Canva", "A scheduling tool (e.g. Meta Business Suite, Buffer)", "The platforms themselves (Instagram, Facebook, TikTok)"],
    learningNotes: "The basics of a content calendar and platform best-practices can be learned in a couple of weeks; the real skill grows with practice managing a real account and watching what performs.",
    starterProject: "Create a 2-week content calendar and 5 sample posts for a real or fictional local business.",
    portfolioRequirements: ["A sample content calendar", "Before/after engagement examples if you've managed a real account"],
    clientApproachTips: [
      "Approach small local businesses that have an account but post rarely — that gap is your pitch",
      "Show up with 3-5 ready-made post concepts, not just an offer",
    ],
    remoteSuitable: true,
    freelanceSuitable: true,
    skills: [
      { name: "Social media platforms", level: "INTERMEDIATE" },
      { name: "Canva / basic graphic design", level: "BEGINNER" },
      { name: "Content creation", level: "BEGINNER" },
    ],
  },
  {
    slug: "content-writing-income",
    name: "Content Writing",
    description: "Writing blog posts, website copy, newsletters, or social captions for businesses and publications.",
    tools: ["Google Docs", "A grammar checker", "Basic SEO knowledge for web content"],
    learningNotes: "Strong written English is the prerequisite; formatting for the web and basic SEO can be picked up through free guides within a week or two.",
    starterProject: "Write 3 blog articles or a sample newsletter on topics you know well.",
    portfolioRequirements: ["3-5 writing samples", "A short note on the audience and goal of each piece"],
    clientApproachTips: [
      "Offer to rewrite one page of an existing business's website as a free sample of your work",
      "Local businesses and blogs are often easier first clients than large publications",
    ],
    remoteSuitable: true,
    freelanceSuitable: true,
    skills: [
      { name: "Written English", level: "INTERMEDIATE" },
      { name: "Copywriting", level: "BEGINNER" },
      { name: "Storytelling", level: "BEGINNER" },
    ],
  },
  {
    slug: "graphic-design-income",
    name: "Graphic Design",
    description: "Designing logos, flyers, social posts, and other visual materials for clients.",
    tools: ["Canva", "A more advanced tool (e.g. Photoshop, Figma) once comfortable"],
    learningNotes: "Canva-level design is learnable within days; building real taste and speed takes ongoing practice on real projects.",
    starterProject: "Design a full mini brand kit — logo, color palette, one social template — for a fictional business.",
    portfolioRequirements: ["6-10 varied design samples", "At least one complete project shown start to finish"],
    clientApproachTips: [
      "Design a free concept flyer or logo for a local business as a demonstration piece",
      "Community groups and small event organizers are frequently underserved and a good first market",
    ],
    remoteSuitable: true,
    freelanceSuitable: true,
    skills: [
      { name: "Canva / basic graphic design", level: "INTERMEDIATE" },
      { name: "Illustration / drawing", level: "BEGINNER" },
    ],
  },
  {
    slug: "video-editing-income",
    name: "Video Editing",
    description: "Editing short-form or long-form video content for creators and small businesses.",
    tools: ["A free or low-cost editing app (e.g. CapCut, DaVinci Resolve)", "A smartphone or basic camera for source footage"],
    learningNotes: "Editing basics — cuts, captions, simple transitions — are learnable in 1-2 weeks from free tutorials; speed and style come with volume of practice.",
    starterProject: "Edit a 60-second highlight reel from footage you shoot yourself or source with permission.",
    portfolioRequirements: ["A 2-3 minute reel of your best edits"],
    clientApproachTips: [
      "Offer to edit one piece of content for free for a local creator or small business in exchange for a testimonial",
      "Short-form platforms make it easy to show finished work publicly as your own portfolio",
    ],
    remoteSuitable: true,
    freelanceSuitable: true,
    skills: [
      { name: "Video editing basics", level: "BEGINNER" },
      { name: "Storytelling", level: "BEGINNER" },
    ],
  },
  {
    slug: "tutoring",
    name: "Tutoring",
    description: "Teaching a subject you're strong in to students one-on-one or in small groups.",
    tools: ["A quiet space or a video call app for online sessions", "Practice materials/worksheets"],
    learningNotes: "If you already know the subject, the main thing to build is a simple lesson structure — explain, practice, check understanding — which is quick to learn and improves with each session.",
    starterProject: "Prepare and teach one full lesson to a friend, sibling, or classmate, and ask for honest feedback.",
    portfolioRequirements: ["A sample lesson plan", "Any results or feedback from people you've helped"],
    clientApproachTips: [
      "Start with people you already know — classmates, siblings' friends, neighbors",
      "Ask satisfied students' parents or peers for a referral to one more family",
    ],
    remoteSuitable: true,
    freelanceSuitable: true,
    skills: [
      { name: "Teaching / tutoring", level: "BEGINNER" },
      { name: "Public speaking", level: "BEGINNER" },
    ],
  },
  {
    slug: "translation-income",
    name: "Translation",
    description: "Translating documents, captions, or short content between languages you're fluent in.",
    tools: ["Google Docs", "A dictionary/terminology reference for specialized topics"],
    learningNotes: "If you're already fluent in two languages, the additional skill is precision and formatting — reviewable within a short amount of focused practice.",
    starterProject: "Translate a short article or document, then have a fluent speaker review it for accuracy.",
    portfolioRequirements: ["2-3 sample translations", "Language proficiency evidence if available (school records, certificates)"],
    clientApproachTips: [
      "Community organizations and small NGOs often need occasional translation help",
      "Be upfront about which subject areas you're comfortable translating accurately",
    ],
    remoteSuitable: true,
    freelanceSuitable: true,
    skills: [
      { name: "Translation", level: "INTERMEDIATE" },
      { name: "Written English", level: "INTERMEDIATE" },
    ],
  },
  {
    slug: "research-assistance",
    name: "Research Assistance",
    description: "Gathering, organizing, and summarizing information for a student, academic, or business project.",
    tools: ["Google Docs/Sheets", "Library or reputable online sources"],
    learningNotes: "The core skill — finding credible sources and summarizing clearly — is learnable quickly if you're already a strong reader; the discipline comes from practice staying organized across a project.",
    starterProject: "Research a topic and produce a one-page summary with cited sources.",
    portfolioRequirements: ["A sample research summary", "A note on how you verified your sources"],
    clientApproachTips: [
      "Offer help to students in higher years at your own school first",
      "Be explicit about turnaround time and how you'll cite sources",
    ],
    remoteSuitable: true,
    freelanceSuitable: true,
    skills: [
      { name: "Research skills", level: "BEGINNER" },
      { name: "Written English", level: "INTERMEDIATE" },
      { name: "Critical thinking", level: "BEGINNER" },
    ],
  },
  {
    slug: "web-development-income",
    name: "Web Development",
    description: "Building simple websites for individuals or small businesses that don't have one yet.",
    tools: ["A code editor", "A free website builder as a lower-effort starting option", "Basic hosting"],
    learningNotes: "A simple one-page site is achievable after a few weeks of focused, free web-development tutorials; more complex sites take longer and benefit from real practice projects.",
    starterProject: "Build a one-page website for a local business or organization that doesn't currently have one.",
    portfolioRequirements: ["1-2 live or locally-built websites", "Before/after if replacing an existing site"],
    clientApproachTips: [
      "Search for small local businesses with no website or an outdated one, and offer a simple, affordable first version",
      "Be clear about what's included versus what would cost more (e.g. ongoing maintenance)",
    ],
    remoteSuitable: true,
    freelanceSuitable: true,
    skills: [
      { name: "Basic HTML/CSS", level: "BEGINNER" },
      { name: "Programming fundamentals", level: "BEGINNER" },
    ],
  },
  {
    slug: "digital-marketing-income",
    name: "Digital Marketing",
    description: "Running small ad campaigns, email newsletters, or growth experiments for a business.",
    tools: ["Meta/Google Ads Manager (free to start with a small budget)", "An email tool (e.g. Mailchimp free tier)"],
    learningNotes: "Free courses cover ad-platform basics within a couple of weeks; real skill comes from running and reviewing actual small campaigns.",
    starterProject: "Design a small sample ad campaign (creative + targeting plan) for a real or fictional product, even if you don't run real ad spend yet.",
    portfolioRequirements: ["A sample campaign plan", "Real results if you've run any paid or organic campaign, however small"],
    clientApproachTips: [
      "Small businesses running no ads at all are an easier first conversation than ones already working with an agency",
      "Offer to manage a very small test budget first to prove results before asking for more",
    ],
    remoteSuitable: true,
    freelanceSuitable: true,
    skills: [
      { name: "Social media platforms", level: "INTERMEDIATE" },
      { name: "Copywriting", level: "BEGINNER" },
      { name: "Analytics & reporting", level: "BEGINNER" },
    ],
  },
];

async function main() {
  for (const item of SIDE_OPPORTUNITIES) {
    const record = await prisma.sideOpportunity.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        tools: item.tools,
        learningNotes: item.learningNotes,
        starterProject: item.starterProject,
        portfolioRequirements: item.portfolioRequirements,
        clientApproachTips: item.clientApproachTips,
        remoteSuitable: item.remoteSuitable,
        freelanceSuitable: item.freelanceSuitable,
      },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        tools: item.tools,
        learningNotes: item.learningNotes,
        starterProject: item.starterProject,
        portfolioRequirements: item.portfolioRequirements,
        clientApproachTips: item.clientApproachTips,
        remoteSuitable: item.remoteSuitable,
        freelanceSuitable: item.freelanceSuitable,
      },
    });

    for (const skill of item.skills) {
      const skillRow = await prisma.skill.findUnique({ where: { name: skill.name } });
      if (!skillRow) throw new Error(`Unknown skill "${skill.name}" referenced by side-income path "${item.slug}"`);
      await prisma.sideOpportunitySkill.upsert({
        where: { sideOpportunityId_skillId: { sideOpportunityId: record.id, skillId: skillRow.id } },
        update: { level: skill.level },
        create: { sideOpportunityId: record.id, skillId: skillRow.id, level: skill.level },
      });
    }
  }

  console.log(`Seeded ${SIDE_OPPORTUNITIES.length} side-income paths.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
