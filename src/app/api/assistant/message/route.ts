import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAssistantReply, isAiConfigured } from "@/lib/ai/anthropic";
import { ASSISTANT_SYSTEM_PROMPT, buildAssistantContext } from "@/lib/ai/context";
import { isRateLimited } from "@/lib/rate-limit";

const NOT_CONFIGURED_MESSAGE =
  "The AI assistant isn't configured on this deployment yet — an operator needs to add an ANTHROPIC_API_KEY. In the meantime, your career matches, skill gaps, and roadmap are all ready on your dashboard.";

const messageSchema = z.object({
  message: z.string().trim().min(1, "Type a message first.").max(2000),
  conversationId: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  if (isRateLimited(`assistant:${userId}`, 20, 5 * 60 * 1000)) {
    return NextResponse.json({ error: "You're sending messages a bit fast — try again in a minute." }, { status: 429 });
  }

  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid message." }, { status: 400 });
  }

  let conversation = parsed.data.conversationId
    ? await prisma.aiConversation.findUnique({ where: { id: parsed.data.conversationId } })
    : null;
  if (!conversation || conversation.userId !== userId) {
    conversation = await prisma.aiConversation.create({ data: { userId } });
  }

  await prisma.aiMessage.create({
    data: { conversationId: conversation.id, role: "USER", content: parsed.data.message },
  });

  const configured = isAiConfigured();
  let replyText: string;

  if (!configured) {
    replyText = NOT_CONFIGURED_MESSAGE;
  } else {
    try {
      const [contextSummary, recentMessages] = await Promise.all([
        buildAssistantContext(userId),
        prisma.aiMessage.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: "asc" },
          take: 20,
        }),
      ]);
      const systemPrompt = `${ASSISTANT_SYSTEM_PROMPT}\n\nUSER PROFILE:\n${contextSummary}`;
      replyText = await generateAssistantReply({
        systemPrompt,
        history: recentMessages.map((m) => ({
          role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        })),
      });
    } catch (err) {
      console.error("AI assistant call failed", err);
      replyText = "Something went wrong reaching the assistant just now — please try again in a moment.";
    }
  }

  await prisma.aiMessage.create({
    data: { conversationId: conversation.id, role: "ASSISTANT", content: replyText },
  });
  await prisma.aiConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ conversationId: conversation.id, reply: replyText, configured });
}
