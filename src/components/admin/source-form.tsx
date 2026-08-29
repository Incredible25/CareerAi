"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SOURCE_TYPE_LABELS, TRUST_LEVEL_LABELS } from "@/lib/opportunities/constants";

type SourceValues = {
  id?: string;
  name: string;
  type: string;
  url: string;
  trustLevel: string;
  active: boolean;
};

export function SourceForm({ initial }: { initial?: SourceValues }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      type: form.get("type"),
      url: form.get("url"),
      trustLevel: form.get("trustLevel"),
      active: form.get("active") === "on",
    };

    const res = await fetch(initial ? `/api/admin/sources/${initial.id}` : "/api/admin/sources", {
      method: initial ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't save that source.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.push("/admin/sources");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && (
        <p role="alert" className="rounded-lg2 border border-orange-400 bg-orange-50 px-3 py-2 text-xs text-orange-600">
          {error}
        </p>
      )}
      <div>
        <label className="field-label" htmlFor="name">Source name</label>
        <input id="name" name="name" required defaultValue={initial?.name} className="field-input" placeholder="e.g. Mastercard Foundation" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="type">Source type</label>
          <select id="type" name="type" defaultValue={initial?.type ?? "OTHER"} className="field-input">
            {Object.entries(SOURCE_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="trustLevel">Trust level</label>
          <select id="trustLevel" name="trustLevel" defaultValue={initial?.trustLevel ?? "UNRATED"} className="field-input">
            {Object.entries(TRUST_LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="url">Organization URL</label>
        <input id="url" name="url" type="url" required defaultValue={initial?.url} className="field-input" placeholder="https://..." />
      </div>
      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input type="checkbox" name="active" defaultChecked={initial?.active ?? true} className="h-4 w-4 accent-green-500" />
        Active — eligible to be picked as a source for new opportunities
      </label>
      <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
        {submitting ? "Saving…" : initial ? "Save changes" : "Add source"}
      </button>
    </form>
  );
}
