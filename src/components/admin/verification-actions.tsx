"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Action = "verify" | "reject" | "expire" | "archive";

const CONFIRM_TEXT: Record<Action, string> = {
  verify: "Mark this VERIFIED? This is the only action that makes an opportunity visible to users.",
  reject: "Reject this opportunity? It will never be shown to users while rejected.",
  expire: "Mark this EXPIRED? It will stop being shown as active.",
  archive: "Archive this opportunity? It will be removed from all active views.",
};

const NEEDS_NOTE: Action[] = ["verify", "reject"];

export function VerificationActions({
  opportunityId,
  verificationStatus,
  opportunityStatus,
}: {
  opportunityId: string;
  verificationStatus: string;
  opportunityStatus: string;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: Action) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/opportunities/${opportunityId}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note || undefined }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "That action failed.");
      setBusy(false);
      return;
    }
    setBusy(false);
    setPendingAction(null);
    setNote("");
    router.refresh();
  }

  return (
    <div className="card">
      <h2 className="font-display text-sm font-bold text-ink">Verification &amp; status actions</h2>
      <p className="mt-1 text-xs text-ink-soft">
        These are the only actions that change verification or lifecycle status — never a side
        effect of editing content.
      </p>

      {error && (
        <p role="alert" className="mt-2 rounded-lg2 border border-orange-400 bg-orange-50 px-3 py-2 text-xs text-orange-600">
          {error}
        </p>
      )}

      {pendingAction ? (
        <div className="mt-3 rounded-lg2 border border-sand-300 bg-sand-50 p-4">
          <p className="text-sm text-ink">{CONFIRM_TEXT[pendingAction]}</p>
          {NEEDS_NOTE.includes(pendingAction) && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note (internal only, never shown to users)"
              rows={2}
              className="field-input mt-2"
            />
          )}
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy} onClick={() => run(pendingAction)} className="btn-primary !px-3 !py-1.5 text-xs disabled:opacity-60">
              {busy ? "Working…" : "Confirm"}
            </button>
            <button type="button" onClick={() => setPendingAction(null)} className="text-xs font-medium text-ink-faint hover:text-ink">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={verificationStatus === "VERIFIED"}
            onClick={() => setPendingAction("verify")}
            className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-40"
          >
            Verify
          </button>
          <button
            type="button"
            disabled={verificationStatus === "REJECTED"}
            onClick={() => setPendingAction("reject")}
            className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-40"
          >
            Reject
          </button>
          <button
            type="button"
            disabled={opportunityStatus === "EXPIRED"}
            onClick={() => setPendingAction("expire")}
            className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-40"
          >
            Mark expired
          </button>
          <button
            type="button"
            disabled={opportunityStatus === "ARCHIVED"}
            onClick={() => setPendingAction("archive")}
            className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-40"
          >
            Archive
          </button>
        </div>
      )}
    </div>
  );
}
