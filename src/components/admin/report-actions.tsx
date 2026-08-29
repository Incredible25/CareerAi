"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function resolve(status: "REVIEWED" | "DISMISSED") {
    setBusy(true);
    await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => resolve("REVIEWED")}
        className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-60"
      >
        Mark reviewed
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => resolve("DISMISSED")}
        className="text-xs font-medium text-ink-faint hover:text-ink disabled:opacity-60"
      >
        Dismiss
      </button>
    </div>
  );
}
