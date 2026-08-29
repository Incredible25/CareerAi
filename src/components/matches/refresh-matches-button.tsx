"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RefreshMatchesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/matches/refresh", { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't refresh right now.");
      setLoading(false);
      return;
    }
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={refresh}
        disabled={loading}
        className="text-xs font-medium text-green-500 hover:text-orange-500 disabled:opacity-60"
      >
        {loading ? "Recalculating…" : "Recalculate my matches"}
      </button>
      {error && <p className="text-xs text-orange-600">{error}</p>}
    </div>
  );
}
