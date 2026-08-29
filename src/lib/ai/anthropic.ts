import Anthropic from "@anthropic-ai/sdk";

/**
 * The one place in the career engine that calls a real LLM
 * (docs/PRODUCT_STRATEGY.md §7's implementation note): open-ended
 * conversation genuinely needs it, unlike the deterministic scoring
 * engine. Gated behind ANTHROPIC_API_KEY — a deployment without a key
 * configured degrades to a clear notice (see the assistant API route),
 * never a crash or a fabricated-sounding fallback.
 */
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

let client: Anthropic | null = null;

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function generateAssistantReply(params: {
  systemPrompt: string;
  history: { role: "user" | "assistant"; content: string }[];
}): Promise<string> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
    max_tokens: 700,
    system: params.systemPrompt,
    messages: params.history,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text"
    ? textBlock.text
    : "I couldn't put together a response that time — could you try rephrasing?";
}
