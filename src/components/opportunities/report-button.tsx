"use client";

import { useState } from "react";
import { REPORT_REASON_LABELS } from "@/lib/opportunities/constants";

const REASONS = Object.keys(REPORT_REASON_LABELS) as (keyof typeof REPORT_REASON_LABELS)[];

export function ReportButton({
  opportunityId,
  initialReported,
}: {
  opportunityId: string;
  initialReported: boolean;
}) {
  const [reported, setReported] = useState(initialReported);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opportunityId,
        reason: form.get("reason"),
        note: form.get("note"),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't send that report.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setOpen(false);
    setReported(true);
  }

  if (reported) {
    return <p className="text-xs text-ink-faint">Reported for review — thanks for flagging it.</p>;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-ink-faint hover:text-orange-500">
        Report a problem with this listing
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg2 border border-sand-200 bg-sand-50 p-3">
      {error && (
        <p role="alert" className="mb-2 rounded-lg2 border border-orange-400 bg-orange-50 px-3 py-2 text-xs text-orange-600">
          {error}
        </p>
      )}
      <label className="field-label" htmlFor="report-reason">What&apos;s wrong?</label>
      <select id="report-reason" name="reason" required className="field-input" defaultValue="">
        <option value="" disabled>Choose a reason</option>
        {REASONS.map((reason) => (
          <option key={reason} value={reason}>{REPORT_REASON_LABELS[reason]}</option>
        ))}
      </select>
      <label className="field-label mt-2" htmlFor="report-note">
        Details <span className="text-ink-faint">(optional)</span>
      </label>
      <textarea id="report-note" name="note" rows={2} className="field-input" placeholder="Anything that would help our team review this" />
      <div className="mt-2 flex gap-2">
        <button type="submit" disabled={submitting} className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-60">
          {submitting ? "Sending…" : "Send report"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-ink-faint hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}
