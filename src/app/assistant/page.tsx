import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { isOnboardingComplete } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { isAiConfigured } from "@/lib/ai/anthropic";
import { AppHeader } from "@/components/app-header";
import { AssistantChat } from "@/components/assistant/assistant-chat";

export const metadata: Metadata = { title: "AI career assistant" };

export default async function AssistantPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile || !isOnboardingComplete(user.profile.onboardingStep)) redirect("/onboarding");

  const conversation = await prisma.aiConversation.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  return (
    <div className="flex h-dvh flex-col bg-sand-50">
      <AppHeader name={user.name} isAdmin={user.role === "ADMIN"} />
      <AssistantChat
        conversationId={conversation?.id ?? null}
        initialMessages={
          conversation?.messages.map((m) => ({ id: m.id, role: m.role, content: m.content })) ?? []
        }
        aiConfigured={isAiConfigured()}
        firstName={user.name.split(" ")[0] ?? user.name}
      />
    </div>
  );
}
