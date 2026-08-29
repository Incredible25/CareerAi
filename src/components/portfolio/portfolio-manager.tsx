"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  title: string;
  description: string;
  link: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  career: { name: string } | null;
};

type CareerOption = { id: string; name: string };

const STATUS_LABELS: Record<Project["status"], string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export function PortfolioManager({
  initialProjects,
  careerOptions,
}: {
  initialProjects: Project[];
  careerOptions: CareerOption[];
}) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [showForm, setShowForm] = useState(initialProjects.length === 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description"),
        link: form.get("link"),
        careerId: form.get("careerId"),
        status: "PLANNED",
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't add that project.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setShowForm(false);
    router.refresh();
  }

  async function updateStatus(id: string, status: Project["status"]) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    await fetch(`/api/portfolio/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-soft">{projects.length} project{projects.length === 1 ? "" : "s"}</p>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-secondary !px-3 !py-1.5 text-xs">
          {showForm ? "Cancel" : "Add project"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card mt-4 space-y-4">
          {error && (
            <p role="alert" className="rounded-lg2 border border-orange-400 bg-orange-50 px-3 py-2 text-xs text-orange-600">
              {error}
            </p>
          )}
          <div>
            <label className="field-label" htmlFor="title">Title</label>
            <input id="title" name="title" required className="field-input" placeholder="30-day social media campaign for a local bakery" />
          </div>
          <div>
            <label className="field-label" htmlFor="description">What did you do?</label>
            <textarea id="description" name="description" required rows={3} className="field-input" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="link">Link <span className="text-ink-faint">(optional)</span></label>
              <input id="link" name="link" type="url" className="field-input" placeholder="https://..." />
            </div>
            {careerOptions.length > 0 && (
              <div>
                <label className="field-label" htmlFor="careerId">Related career <span className="text-ink-faint">(optional)</span></label>
                <select id="careerId" name="careerId" className="field-input" defaultValue="">
                  <option value="">None</option>
                  {careerOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
            {submitting ? "Adding…" : "Add project"}
          </button>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {projects.map((project) => (
          <div key={project.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-sm font-bold text-ink">{project.title}</h3>
                {project.career && <p className="text-xs text-ink-faint">{project.career.name}</p>}
              </div>
              <button type="button" onClick={() => remove(project.id)} className="text-xs text-ink-faint hover:text-orange-500">
                Remove
              </button>
            </div>
            <p className="mt-1.5 text-sm text-ink-soft">{project.description}</p>
            {project.link && (
              <a href={project.link} target="_blank" rel="noreferrer" className="mt-1.5 inline-block text-sm text-green-500 hover:text-orange-500">
                {project.link}
              </a>
            )}
            <div className="mt-3 flex gap-1.5">
              {(Object.keys(STATUS_LABELS) as Project["status"][]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateStatus(project.id, status)}
                  className={
                    "rounded-full px-2.5 py-1 text-xs font-medium transition " +
                    (project.status === status
                      ? "bg-green-500 text-white"
                      : "bg-sand-100 text-ink-soft hover:bg-sand-200")
                  }
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
