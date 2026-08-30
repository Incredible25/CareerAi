"use client";

import { useRef, useState } from "react";
import { MessageFeedback } from "@/components/assistant/message-feedback";

type Message = { id: string; role: "USER" | "ASSISTANT"; content: string };

const STARTER_PROMPTS = [
  "What careers fit my skills and interests?",
  "I don't have experience. Where should I start?",
  "Create a 90-day plan for me.",
  "What side income can I start while studying?",
];

export function AssistantChat({
  conversationId: initialConversationId,
  initialMessages,
  aiConfigured,
  firstName,
}: {
  conversationId: string | null;
  initialMessages: Message[];
  aiConfigured: boolean;
  firstName: string;
}) {
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const optimisticUser: Message = { id: `local-${Date.now()}`, role: "USER", content: trimmed };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");
    setSending(true);
    setError(null);
    scrollToBottom();

    try {
      const res = await fetch("/api/assistant/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, conversationId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Something went wrong. Please try again.");
        setSending(false);
        return;
      }
      setConversationId(body.conversationId);
      setMessages((prev) => [
        ...prev,
        { id: body.replyId ?? `reply-${Date.now()}`, role: "ASSISTANT", content: body.reply },
      ]);
      scrollToBottom();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden px-6 sm:px-10">
      {!aiConfigured && (
        <div className="mt-4 rounded-lg2 border border-orange-400 bg-orange-50 px-4 py-3 text-sm text-orange-600">
          The AI assistant isn&apos;t configured on this deployment yet. You can still send
          messages, but replies will be a placeholder notice until an operator adds an API key.
        </div>
      )}

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto py-6">
        {messages.length === 0 && (
          <div>
            <h1 className="text-xl font-bold text-ink">Hey {firstName}, what&apos;s on your mind?</h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              Ask about career direction, skills to learn, side income, or your roadmap. This is
              guidance grounded in your own profile — not professional advice.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => send(prompt)}
                  className="rounded-full border border-sand-300 bg-white px-3.5 py-2 text-xs font-medium text-ink-soft hover:border-green-500 hover:text-green-500"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={"flex flex-col " + (m.role === "USER" ? "items-end" : "items-start")}>
            <div
              className={
                "max-w-[85%] whitespace-pre-wrap rounded-lg2 px-4 py-2.5 text-sm " +
                (m.role === "USER" ? "bg-green-500 text-white" : "border border-sand-200 bg-white text-ink")
              }
            >
              {m.content}
            </div>
            {m.role === "ASSISTANT" && <MessageFeedback messageId={m.id} />}
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-lg2 border border-sand-200 bg-white px-4 py-2.5 text-sm text-ink-faint">
              Thinking…
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mb-2 rounded-lg2 border border-orange-400 bg-orange-50 px-3 py-2 text-xs text-orange-600">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-sand-200 py-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about careers, skills, or your plan…"
          className="field-input"
          disabled={sending}
        />
        <button type="submit" disabled={sending || !input.trim()} className="btn-primary !px-5 disabled:opacity-60">
          Send
        </button>
      </form>
    </div>
  );
}
