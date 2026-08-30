"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApplicationStatus } from "@prisma/client";
import { APPLICATION_STATUS_LABELS } from "@/lib/opportunities/constants";

type SavedState = { id: string; status: ApplicationStatus } | null;

export function SaveButton({
  opportunityId,
  initialApplication,
}: {
  opportunityId: string;
  initialApplication: SavedState;
}) {
  const router = useRouter();
  const [application, setApplication] = useState<SavedState>(initialApplication);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId }),
    });
    if (res.ok) {
      const created = await res.json();
      setApplication({ id: created.id, status: created.status });
      router.refresh();
    }
    setBusy(false);
  }

  async function unsave() {
    if (!application) return;
    setBusy(true);
    const res = await fetch(`/api/applications/${application.id}`, { method: "DELETE" });
    if (res.ok) {
      setApplication(null);
      router.refresh();
    }
    setBusy(false);
  }

  if (!application) {
    return (
      <button type="button" onClick={save} disabled={busy} className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-60">
        {busy ? "Saving…" : "Save"}
      </button>
    );
  }

  // Once the user has moved past a plain save (applied, interviewing,
  // etc.), this compact button no longer un-saves with a single click —
  // that would silently discard real tracked progress. It becomes a
  // status readout that points to the full tracker for any change.
  if (application.status !== "SAVED") {
    return (
      <Link href="/applications" className="badge hover:border-green-500 hover:text-green-500">
        {APPLICATION_STATUS_LABELS[application.status]}
      </Link>
    );
  }

  return (
    <button type="button" onClick={unsave} disabled={busy} className="btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-60">
      {busy ? "Removing…" : "Saved ✓"}
    </button>
  );
}
