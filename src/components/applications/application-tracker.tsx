"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ApplicationStatus } from "@prisma/client";
import { APPLICATION_STATUS_LABELS } from "@/lib/opportunities/constants";

type TrackedApplication = {
  id: string;
  status: ApplicationStatus;
  notes: string | null;
  appliedAt: string | null;
  opportunity: {
    id: string;
    title: string;
    organization: string;
    applicationDeadline: string | null;
    isVisible: boolean;
  };
};

const STATUS_ORDER: ApplicationStatus[] = [
  "SAVED",
  "PLANNING_TO_APPLY",
  "APPLIED",
  "INTERVIEW_SELECTION",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

export function ApplicationTracker({ initialApplications }: { initialApplications: TrackedApplication[] }) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);

  async function updateStatus(id: string, status: ApplicationStatus) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, appliedAt: updated.appliedAt } : a))
      );
    }
    router.refresh();
  }

  async function saveNotes(id: string, notes: string) {
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
  }

  async function remove(id: string) {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (applications.length === 0) {
    return (
      <div className="card">
        <p className="text-sm text-ink-soft">
          Nothing saved yet. Browse{" "}
          <Link href="/opportunities" className="text-green-500 hover:text-orange-500">
            opportunities for you
          </Link>{" "}
          and save the ones worth tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((application) => (
        <div key={application.id} className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href={`/opportunities/${application.opportunity.id}`}
                className="font-display text-sm font-bold text-ink hover:text-green-500"
              >
                {application.opportunity.title}
              </Link>
              <p className="text-xs text-ink-faint">{application.opportunity.organization}</p>
              {!application.opportunity.isVisible && (
                <p className="mt-0.5 text-xs font-medium text-orange-600">No longer active</p>
              )}
              {application.appliedAt && (
                <p className="mt-0.5 text-xs text-ink-faint">
                  Applied {new Date(application.appliedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <button type="button" onClick={() => remove(application.id)} className="text-xs text-ink-faint hover:text-orange-500">
              Remove
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => updateStatus(application.id, status)}
                className={
                  "rounded-full px-2.5 py-1 text-xs font-medium transition " +
                  (application.status === status
                    ? "bg-green-500 text-white"
                    : "bg-sand-100 text-ink-soft hover:bg-sand-200")
                }
              >
                {APPLICATION_STATUS_LABELS[status]}
              </button>
            ))}
          </div>

          <textarea
            defaultValue={application.notes ?? ""}
            onBlur={(e) => saveNotes(application.id, e.currentTarget.value)}
            placeholder="Notes to yourself — interview dates, contacts, anything worth remembering"
            rows={2}
            className="field-input mt-3 text-sm"
          />
        </div>
      ))}
    </div>
  );
}
