"use client";

import { useState } from "react";

const INTERNET_LABELS: Record<string, string> = {
  RELIABLE_DAILY: "Reliable, most days",
  INTERMITTENT: "On and off — depends on data bundles",
  LIMITED: "Limited — I get online occasionally",
};

export type AccessStepValues = {
  hasLaptop: boolean;
  hasSmartphone: boolean;
  internetAccess: string;
  languages: string;
  linkedinUrl: string;
  portfolioUrl: string;
};

export function AccessStep({
  defaultValues,
  submitting,
  isMinor,
  onSubmit,
}: {
  defaultValues: AccessStepValues;
  submitting: boolean;
  // Phase 6, minor-safeguarding (docs/PRODUCT_STRATEGY.md §13 — "profile
  // fields default to the minimum necessary"): a secondary-school-age
  // user isn't asked for professional-networking links at all. The API
  // route enforces this regardless of what's submitted
  // (applyMinorFieldRestrictions) — hiding the fields here is about
  // giving an honest form, not the actual enforcement.
  isMinor: boolean;
  onSubmit: (data: AccessStepValues) => void;
}) {
  const [hasLaptop, setHasLaptop] = useState(defaultValues.hasLaptop);
  const [hasSmartphone, setHasSmartphone] = useState(defaultValues.hasSmartphone);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      hasLaptop,
      hasSmartphone,
      internetAccess: String(form.get("internetAccess") ?? "INTERMITTENT"),
      languages: String(form.get("languages") ?? ""),
      linkedinUrl: isMinor ? "" : String(form.get("linkedinUrl") ?? ""),
      portfolioUrl: isMinor ? "" : String(form.get("portfolioUrl") ?? ""),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-ink-soft">
        This helps us keep your plan realistic — every roadmap adapts to what you actually have
        available, not what would be nice to have.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2.5 rounded-lg2 border border-sand-200 px-3.5 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={hasLaptop}
            onChange={(e) => setHasLaptop(e.target.checked)}
            className="h-4 w-4 accent-green-500"
          />
          I have access to a laptop or computer
        </label>
        <label className="flex items-center gap-2.5 rounded-lg2 border border-sand-200 px-3.5 py-2.5 text-sm">
          <input
            type="checkbox"
            checked={hasSmartphone}
            onChange={(e) => setHasSmartphone(e.target.checked)}
            className="h-4 w-4 accent-green-500"
          />
          I have access to a smartphone
        </label>
      </div>

      <div>
        <label className="field-label" htmlFor="internetAccess">
          Internet access
        </label>
        <select
          id="internetAccess"
          name="internetAccess"
          defaultValue={defaultValues.internetAccess}
          className="field-input"
        >
          {Object.entries(INTERNET_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor="languages">
          Languages you&apos;re comfortable working in
        </label>
        <input
          id="languages"
          name="languages"
          type="text"
          defaultValue={defaultValues.languages}
          className="field-input"
          placeholder="English, French"
        />
      </div>

      {!isMinor && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="linkedinUrl">
              LinkedIn <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="linkedinUrl"
              name="linkedinUrl"
              type="url"
              defaultValue={defaultValues.linkedinUrl}
              className="field-input"
              placeholder="https://linkedin.com/in/you"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="portfolioUrl">
              Portfolio / website <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="portfolioUrl"
              name="portfolioUrl"
              type="url"
              defaultValue={defaultValues.portfolioUrl}
              className="field-input"
              placeholder="https://..."
            />
          </div>
        </div>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Saving…" : "Finish profile"}
      </button>
    </form>
  );
}
