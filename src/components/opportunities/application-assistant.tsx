"use client";

import { useState } from "react";

export function ApplicationAssistant({ opportunityId }: { opportunityId: string }) {
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestHelp() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/opportunities/${opportunityId}/application-help`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error ?? "Couldn't get application help right now.");
      setLoading(false);
      return;
    }
    setReply(body.reply);
    setLoading(false);
  }

  return (
    <div className="card mt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="badge badge-ai">AI application help</span>
          <p className="mt-1 text-sm text-ink-soft">
            Talking points based only on your real profile — never a drafted claim of experience
            you haven&apos;t told us about, and never a submitted application.
          </p>
        </div>
        {!reply && (
          <button type="button" onClick={requestHelp} disabled={loading} className="btn-secondary !px-4 !py-2 text-sm disabled:opacity-60">
            {loading ? "Thinking…" : "Get help"}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg2 border border-orange-400 bg-orange-50 px-3 py-2 text-xs text-orange-600">
          {error}
        </p>
      )}

      {reply && (
        <div className="mt-3 whitespace-pre-line text-sm text-ink-soft">{reply}</div>
      )}
    </div>
  );
}
