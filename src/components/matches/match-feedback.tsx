"use client";

import { useState } from "react";
import type { FeedbackReason } from "@prisma/client";
import { FEEDBACK_REASON_LABELS, FEEDBACK_REASON_ORDER } from "@/lib/feedback/constants";

export function MatchFeedback({
  careerMatchId,
  initialHelpful,
  initialReason,
  initialComment,
}: {
  careerMatchId: string;
  initialHelpful: boolean | null;
  initialReason: FeedbackReason | null;
  initialComment: string | null;
}) {
  const [vote, setVote] = useState<boolean | null>(initialHelpful);
  const [reason, setReason] = useState<FeedbackReason | null>(initialReason);
  const [otherText, setOtherText] = useState(initialReason === "OTHER" ? initialComment ?? "" : "");
  const [showReasons, setShowReasons] = useState(initialReason !== null);
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(next: { helpful: boolean; reason?: FeedbackReason | null; comment?: string }) {
    if (sending) return;
    setSending(true);
    const previous = { vote, reason };
    setVote(next.helpful);
    if (next.reason !== undefined) setReason(next.reason);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectType: "CAREER_MATCH",
        subjectId: careerMatchId,
        helpful: next.helpful,
        reason: next.reason !== undefined ? next.reason : reason,
        comment: next.comment ?? (next.reason === "OTHER" || reason === "OTHER" ? otherText : undefined),
      }),
    });
    if (!res.ok) {
      setVote(previous.vote);
      setReason(previous.reason);
    } else {
      setSaved(true);
    }
    setSending(false);
  }

  function castVote(helpful: boolean) {
    void submit({ helpful });
    setShowReasons(true);
  }

  function pickReason(nextReason: FeedbackReason) {
    if (vote === null) return; // shouldn't happen — reasons only show after a vote
    setSaved(false);
    void submit({ helpful: vote, reason: nextReason });
  }

  function submitOtherText() {
    if (vote === null) return;
    void submit({ helpful: vote, reason: "OTHER", comment: otherText });
  }

  return (
    <div className="mt-3 border-t border-sand-200 pt-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-ink-faint">Is this a good match for you?</span>
        <button
          type="button"
          onClick={() => castVote(true)}
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
          onClick={() => castVote(false)}
          aria-pressed={vote === false}
          className={
            "rounded-full px-2 py-0.5 text-xs transition " +
            (vote === false ? "bg-orange-500 text-white" : "bg-sand-100 text-ink-soft hover:bg-sand-200")
          }
        >
          👎 Not really
        </button>
      </div>

      {vote !== null && (
        <div className="mt-2">
          {!showReasons ? (
            <button
              type="button"
              onClick={() => setShowReasons(true)}
              className="text-[11px] font-medium text-ink-faint hover:text-ink"
            >
              Tell us more (optional)
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {FEEDBACK_REASON_ORDER.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => pickReason(key)}
                  aria-pressed={reason === key}
                  className={
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition " +
                    (reason === key
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-sand-300 bg-white text-ink-soft hover:border-green-500 hover:text-green-500")
                  }
                >
                  {FEEDBACK_REASON_LABELS[key]}
                </button>
              ))}
            </div>
          )}

          {reason === "OTHER" && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                onBlur={submitOtherText}
                placeholder="What's on your mind? (optional)"
                maxLength={500}
                className="field-input !py-1.5 text-xs"
              />
            </div>
          )}

          {saved && <p className="mt-1.5 text-[11px] text-ink-faint">Thanks — this helps us improve your matches.</p>}
        </div>
      )}
    </div>
  );
}
