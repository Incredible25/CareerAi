"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SweepExpiredButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sweep() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/opportunities/sweep-expired", { method: "POST" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(body.error ?? "Sweep failed.");
      setBusy(false);
      return;
    }
    setMessage(
      body.swept === 0
        ? "Nothing to sweep — no active opportunities are past their deadline."
        : `Marked ${body.swept} opportunit${body.swept === 1 ? "y" : "ies"} as expired.`
    );
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={sweep} disabled={busy} className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-60">
        {busy ? "Sweeping…" : "Sweep expired"}
      </button>
      {message && <p className="text-xs text-ink-faint">{message}</p>}
    </div>
  );
}
