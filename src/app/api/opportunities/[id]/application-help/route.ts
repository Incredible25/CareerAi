import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAssistantReply, isAiConfigured } from "@/lib/ai/anthropic";
import { APPLICATION_ASSISTANT_SYSTEM_PROMPT, buildApplicationAssistantContext } from "@/lib/ai/context";
import { isRateLimited } from "@/lib/rate-limit";

const NOT_CONFIGURED_MESSAGE =
  "The AI application assistant isn't configured on this deployment yet — an operator needs to add an ANTHROPIC_API_KEY. In the meantime, your match score and eligibility notes above are the real, deterministic facts to work from.";

/**
 * Phase 4, dev-order 13. One-shot by design — nothing here is persisted
 * or turned into a conversation (unlike /api/assistant/message's
 * AiConversation history): each call is a fresh, independent request
 * grounded only in what buildApplicationAssistantContext() pulls from
 * the database at that moment, never carried state that could drift
 * from the user's real current profile.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  if (isRateLimited(`application-help:${userId}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "You've requested a few of these already — try again in a few minutes." },
      { status: 429 }
    );
  }

  const opportunity = await prisma.opportunity.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!opportunity) {
    return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
  }

  if (!isAiConfigured()) {
    return NextResponse.json({ reply: NOT_CONFIGURED_MESSAGE, configured: false });
  }

  try {
    const contextSummary = await buildApplicationAssistantContext(userId, opportunity.id);
    const reply = await generateAssistantReply({
      systemPrompt: `${APPLICATION_ASSISTANT_SYSTEM_PROMPT}\n\n${contextSummary}`,
      history: [{ role: "user", content: "Help me prepare to apply for this opportunity." }],
    });
    return NextResponse.json({ reply, configured: true });
  } catch (err) {
    console.error("AI application assistant call failed", err);
    return NextResponse.json(
      { error: "Something went wrong reaching the assistant just now — please try again in a moment." },
      { status: 502 }
    );
  }
}
