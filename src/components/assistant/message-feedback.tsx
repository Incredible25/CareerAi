"use client";

import { useState } from "react";

export function MessageFeedback({ messageId }: { messageId: string }) {
  const [vote, setVote] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);

  // A locally-generated placeholder id (assigned before, or in place of,
  // the real persisted id from the server) has nothing to attach
  // feedback to yet.
  if (messageId.startsWith("local-") || messageId.startsWith("reply-")) return null;

  async function submit(helpful: boolean) {
    if (sending) return;
    setSending(true);
    const previous = vote;
    setVote(helpful);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectType: "AI_MESSAGE", subjectId: messageId, helpful }),
    });
    if (!res.ok) setVote(previous);
    setSending(false);
  }

  return (
    <div className="mt-1.5 flex items-center gap-2">
      <span className="text-[11px] text-ink-faint">Helpful?</span>
      <button
        type="button"
        onClick={() => submit(true)}
        aria-pressed={vote === true}
        className={"text-xs " + (vote === true ? "text-green-500" : "text-ink-faint hover:text-green-500")}
      >
        👍
      </button>
      <button
        type="button"
        onClick={() => submit(false)}
        aria-pressed={vote === false}
        className={"text-xs " + (vote === false ? "text-orange-500" : "text-ink-faint hover:text-orange-500")}
      >
        👎
      </button>
      {vote !== null && <span className="text-[11px] text-ink-faint">Thanks for the feedback</span>}
    </div>
  );
}
