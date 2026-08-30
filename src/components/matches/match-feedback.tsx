"use client";

import { useState } from "react";

export function MatchFeedback({ careerMatchId, initialHelpful }: { careerMatchId: string; initialHelpful: boolean | null }) {
  const [vote, setVote] = useState<boolean | null>(initialHelpful);
  const [sending, setSending] = useState(false);

  async function submit(helpful: boolean) {
    if (sending) return;
    setSending(true);
    const previous = vote;
    setVote(helpful);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectType: "CAREER_MATCH", subjectId: careerMatchId, helpful }),
    });
    if (!res.ok) setVote(previous);
    setSending(false);
  }

  return (
    <div className="mt-3 flex items-center gap-2 border-t border-sand-200 pt-3">
      <span className="text-xs text-ink-faint">Is this a good match for you?</span>
      <button
        type="button"
        onClick={() => submit(true)}
        aria-pressed={vote === true}
        className={
          "rounded-full px-2 py-0.5 text-xs transition " +
          (vote === true ? "bg-green-500 text-white" : "bg-sand-100 text-ink-soft hover:bg-sand-200")
        }
      >
        👍 Yes
      </button>
      <button
        type="button"
        onClick={() => submit(false)}
        aria-pressed={vote === false}
        className={
          "rounded-full px-2 py-0.5 text-xs transition " +
          (vote === false ? "bg-orange-500 text-white" : "bg-sand-100 text-ink-soft hover:bg-sand-200")
        }
      >
        👎 Not really
      </button>
    </div>
  );
}
