"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORY_LABELS,
  EXPERIENCE_LABELS,
  EDUCATION_LEVEL_LABELS,
  REMOTE_STATUS_LABELS,
} from "@/lib/opportunities/constants";

type SourceOption = { id: string; name: string };
type CatalogItem = { id: string; name: string; category?: string | null };

type OpportunityValues = {
  id?: string;
  title: string;
  organization: string;
  category: string;
  description: string;
  location: string | null;
  country: string | null;
  remoteStatus: string;
  eligibleCountries: string[];
  eligibilityText: string | null;
  minEducationLevel: string | null;
  experienceRequirement: string;
  applicationDeadline: string | null; // ISO date string, yyyy-mm-dd
  applicationUrl: string;
  datePublished: string | null;
  sourceId: string;
  sourceUrl: string;
  opportunityStatus: string;
  skillIds: string[];
  careerIds: string[];
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function OpportunityForm({
  initial,
  sources,
  skillCatalog,
  careerCatalog,
}: {
  initial?: OpportunityValues;
  sources: SourceOption[];
  skillCatalog: CatalogItem[];
  careerCatalog: CatalogItem[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillIds, setSkillIds] = useState<Set<string>>(new Set(initial?.skillIds ?? []));
  const [careerIds, setCareerIds] = useState<Set<string>>(new Set(initial?.careerIds ?? []));

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    const payload = {
      title: form.get("title"),
      organization: form.get("organization"),
      category: form.get("category"),
      description: form.get("description"),
      location: form.get("location"),
      country: form.get("country"),
      remoteStatus: form.get("remoteStatus"),
      eligibleCountries: form.get("eligibleCountries"),
      eligibilityText: form.get("eligibilityText"),
      minEducationLevel: form.get("minEducationLevel"),
      experienceRequirement: form.get("experienceRequirement"),
      applicationDeadline: form.get("applicationDeadline") || undefined,
      applicationUrl: form.get("applicationUrl"),
      datePublished: form.get("datePublished") || undefined,
      sourceId: form.get("sourceId"),
      sourceUrl: form.get("sourceUrl"),
      opportunityStatus: form.get("opportunityStatus"),
      skillIds: Array.from(skillIds),
      careerIds: Array.from(careerIds),
    };

    const res = await fetch(
      initial ? `/api/admin/opportunities/${initial.id}` : "/api/admin/opportunities",
      {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't save that opportunity.");
      setSubmitting(false);
      return;
    }

    const saved = await res.json();
    setSubmitting(false);
    router.push(`/admin/opportunities/${saved.id}`);
    router.refresh();
  }

  const skillsByCategory = skillCatalog.reduce<Record<string, CatalogItem[]>>((acc, s) => {
    const key = s.category ?? "Other";
    acc[key] = acc[key] ? [...acc[key], s] : [s];
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p role="alert" className="rounded-lg2 border border-orange-400 bg-orange-50 px-3 py-2 text-sm text-orange-600">
          {error}
        </p>
      )}

      <div className="card space-y-4">
        <h2 className="font-display text-sm font-bold text-ink">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="title">Title</label>
            <input id="title" name="title" required defaultValue={initial?.title} className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="organization">Organization</label>
            <input id="organization" name="organization" required defaultValue={initial?.organization} className="field-input" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="category">Category</label>
            <select id="category" name="category" defaultValue={initial?.category ?? "JOB"} className="field-input">
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="opportunityStatus">Status</label>
            <select id="opportunityStatus" name="opportunityStatus" defaultValue={initial?.opportunityStatus ?? "DRAFT"} className="field-input">
              <option value="DRAFT">Draft (not visible to users)</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="description">Description</label>
          <textarea id="description" name="description" required rows={4} defaultValue={initial?.description} className="field-input" />
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-display text-sm font-bold text-ink">Location &amp; eligibility</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="field-label" htmlFor="location">Location</label>
            <input id="location" name="location" defaultValue={initial?.location ?? ""} className="field-input" placeholder="e.g. Douala" />
          </div>
          <div>
            <label className="field-label" htmlFor="country">Country</label>
            <input id="country" name="country" defaultValue={initial?.country ?? ""} className="field-input" placeholder="e.g. Cameroon" />
          </div>
          <div>
            <label className="field-label" htmlFor="remoteStatus">Remote status</label>
            <select id="remoteStatus" name="remoteStatus" defaultValue={initial?.remoteStatus ?? "UNSPECIFIED"} className="field-input">
              {Object.entries(REMOTE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="eligibleCountries">Eligible countries</label>
          <input
            id="eligibleCountries"
            name="eligibleCountries"
            defaultValue={initial?.eligibleCountries.join(", ") ?? ""}
            className="field-input"
            placeholder="Leave blank if open to any country. Otherwise: Cameroon, Nigeria, Ghana"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="minEducationLevel">Minimum education</label>
            <select id="minEducationLevel" name="minEducationLevel" defaultValue={initial?.minEducationLevel ?? ""} className="field-input">
              <option value="">Not specified</option>
              {Object.entries(EDUCATION_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="experienceRequirement">Experience</label>
            <select id="experienceRequirement" name="experienceRequirement" defaultValue={initial?.experienceRequirement ?? "UNSPECIFIED"} className="field-input">
              {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="eligibilityText">Eligibility details</label>
          <textarea id="eligibilityText" name="eligibilityText" rows={2} defaultValue={initial?.eligibilityText ?? ""} className="field-input" placeholder="Any eligibility notes not captured above" />
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-display text-sm font-bold text-ink">Dates &amp; source</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="applicationDeadline">Application deadline <span className="text-ink-faint">(leave blank if unknown)</span></label>
            <input id="applicationDeadline" name="applicationDeadline" type="date" defaultValue={toDateInputValue(initial?.applicationDeadline ?? null)} className="field-input" />
          </div>
          <div>
            <label className="field-label" htmlFor="datePublished">Date published <span className="text-ink-faint">(optional)</span></label>
            <input id="datePublished" name="datePublished" type="date" defaultValue={toDateInputValue(initial?.datePublished ?? null)} className="field-input" />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="applicationUrl">Official application URL</label>
          <input id="applicationUrl" name="applicationUrl" type="url" required defaultValue={initial?.applicationUrl} className="field-input" placeholder="https://..." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="sourceId">Source</label>
            <select id="sourceId" name="sourceId" required defaultValue={initial?.sourceId ?? ""} className="field-input">
              <option value="" disabled>Select a source</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <p className="field-hint">No source? Add one under Sources first.</p>
          </div>
          <div>
            <label className="field-label" htmlFor="sourceUrl">Exact page this came from</label>
            <input id="sourceUrl" name="sourceUrl" type="url" required defaultValue={initial?.sourceUrl} className="field-input" placeholder="https://..." />
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-display text-sm font-bold text-ink">Related skills</h2>
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {Object.entries(skillsByCategory).map(([category, items]) => (
            <div key={category}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">{category}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((skill) => (
                  <button
                    type="button"
                    key={skill.id}
                    onClick={() => toggle(skillIds, setSkillIds, skill.id)}
                    className={
                      "rounded-full border px-3 py-1.5 text-xs font-medium " +
                      (skillIds.has(skill.id)
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-sand-300 bg-white text-ink-soft hover:border-green-500")
                    }
                  >
                    {skill.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-display text-sm font-bold text-ink">Related careers <span className="font-normal text-ink-faint">(optional — feeds career alignment scoring)</span></h2>
        <div className="flex flex-wrap gap-1.5">
          {careerCatalog.map((career) => (
            <button
              type="button"
              key={career.id}
              onClick={() => toggle(careerIds, setCareerIds, career.id)}
              className={
                "rounded-full border px-3 py-1.5 text-xs font-medium " +
                (careerIds.has(career.id)
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-sand-300 bg-white text-ink-soft hover:border-green-500")
              }
            >
              {career.name}
            </button>
          ))}
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
        {submitting ? "Saving…" : initial ? "Save changes" : "Create opportunity (as unverified draft)"}
      </button>
    </form>
  );
}
