/**
 * Self-discovery assessment content (docs/PRODUCT_STRATEGY.md §4, §5).
 *
 * This is a career-guidance tool, not a validated psychological instrument
 * — the disclaimer in the UI says so explicitly. Each statement is rated on
 * a 1–5 agreement scale and maps to one trait; traits are grouped into four
 * categories purely for a readable results screen and a manageable
 * question flow (one screen per category), not because the categories
 * themselves are scored.
 */

export const LIKERT_OPTIONS = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
] as const;

export type TraitKey =
  | "creativity"
  | "analyticalThinking"
  | "problemSolving"
  | "communication"
  | "leadership"
  | "teamOrientation"
  | "socialOrientation"
  | "technologyInterest"
  | "businessOrientation"
  | "practicalPreference"
  | "motivation"
  | "structurePreference";

export type AssessmentCategory =
  | "How you think"
  | "How you work with others"
  | "What draws you in"
  | "How you operate";

export type AssessmentQuestion = {
  id: string;
  category: AssessmentCategory;
  trait: TraitKey;
  prompt: string;
};

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // How you think
  { id: "q1", category: "How you think", trait: "creativity", prompt: "I enjoy coming up with new ideas or ways of doing things." },
  { id: "q2", category: "How you think", trait: "creativity", prompt: "I like making things — writing, designing, building, or performing." },
  { id: "q3", category: "How you think", trait: "analyticalThinking", prompt: "I enjoy working with numbers, patterns, or data." },
  { id: "q4", category: "How you think", trait: "analyticalThinking", prompt: "I like understanding how systems or processes work, step by step." },
  { id: "q5", category: "How you think", trait: "problemSolving", prompt: "When something breaks or goes wrong, I want to be the one who figures out why." },

  // How you work with others
  { id: "q6", category: "How you work with others", trait: "communication", prompt: "I find it easy to explain an idea so other people understand it." },
  { id: "q7", category: "How you work with others", trait: "communication", prompt: "I'm comfortable writing — messages, posts, articles, or reports." },
  { id: "q8", category: "How you work with others", trait: "leadership", prompt: "I often end up organizing or guiding a group when working on something together." },
  { id: "q9", category: "How you work with others", trait: "teamOrientation", prompt: "I do my best work as part of a team, not alone." },
  { id: "q10", category: "How you work with others", trait: "socialOrientation", prompt: "Helping someone else solve a problem is genuinely satisfying to me." },
  { id: "q11", category: "How you work with others", trait: "socialOrientation", prompt: "I'm drawn to work that directly benefits my community." },

  // What draws you in
  { id: "q12", category: "What draws you in", trait: "technologyInterest", prompt: "I'm comfortable learning new apps, tools, or software on my own." },
  { id: "q13", category: "What draws you in", trait: "technologyInterest", prompt: "I'm curious about how technology or the internet actually works." },
  { id: "q14", category: "What draws you in", trait: "businessOrientation", prompt: "I like the idea of selling something or running my own venture." },
  { id: "q15", category: "What draws you in", trait: "businessOrientation", prompt: "I pay attention to how businesses or brands market themselves." },
  { id: "q16", category: "What draws you in", trait: "practicalPreference", prompt: "I'd rather work with my hands or be physically active than sit at a desk all day." },

  // How you operate
  { id: "q17", category: "How you operate", trait: "motivation", prompt: "I keep going on a task even without someone checking on my progress." },
  { id: "q18", category: "How you operate", trait: "structurePreference", prompt: "I prefer clear instructions and a defined process over figuring it out as I go." },
];

export const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
  "How you think",
  "How you work with others",
  "What draws you in",
  "How you operate",
];

export function questionsByCategory(category: AssessmentCategory) {
  return ASSESSMENT_QUESTIONS.filter((q) => q.category === category);
}
