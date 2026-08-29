"use client";

import { useMemo, useState } from "react";

type SkillCatalogItem = { id: string; name: string; category: string | null };

export type SkillsStepValues = {
  skills: { skillId: string; level: string }[];
  otherSkills: string;
};

const LEVELS = [
  { value: "", label: "Not yet" },
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export function SkillsStep({
  catalog,
  defaultSelected,
  submitting,
  onSubmit,
}: {
  catalog: SkillCatalogItem[];
  defaultSelected: { skillId: string; level: string }[];
  submitting: boolean;
  onSubmit: (data: SkillsStepValues) => void;
}) {
  const initial = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of defaultSelected) map[s.skillId] = s.level;
    return map;
  }, [defaultSelected]);

  const [levels, setLevels] = useState<Record<string, string>>(initial);
  const [otherSkills, setOtherSkills] = useState("");

  const grouped = useMemo(() => {
    const groups: Record<string, SkillCatalogItem[]> = {};
    for (const skill of catalog) {
      const key = skill.category ?? "Other";
      groups[key] = groups[key] ? [...groups[key], skill] : [skill];
    }
    return groups;
  }, [catalog]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const skills = Object.entries(levels)
      .filter(([, level]) => level)
      .map(([skillId, level]) => ({ skillId, level }));
    onSubmit({ skills, otherSkills });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-ink-soft">
        Rate yourself honestly — this is what tells us where to start, not a test to pass.
      </p>

      {Object.entries(grouped).map(([category, items]) => (
        <fieldset key={category}>
          <legend className="mb-2 text-sm font-semibold text-ink">{category}</legend>
          <div className="space-y-2">
            {items.map((skill) => (
              <div
                key={skill.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg2 border border-sand-200 px-3.5 py-2.5"
              >
                <span className="text-sm text-ink">{skill.name}</span>
                <div className="flex gap-1">
                  {LEVELS.map((lvl) => (
                    <button
                      type="button"
                      key={lvl.value || "none"}
                      onClick={() =>
                        setLevels((prev) => ({ ...prev, [skill.id]: lvl.value }))
                      }
                      className={
                        "rounded-full px-2.5 py-1 text-xs font-medium transition " +
                        ((levels[skill.id] ?? "") === lvl.value
                          ? "bg-green-500 text-white"
                          : "bg-sand-100 text-ink-soft hover:bg-sand-200")
                      }
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div>
        <label className="field-label" htmlFor="otherSkills">
          Anything else you can do that isn&apos;t listed?
        </label>
        <input
          id="otherSkills"
          type="text"
          value={otherSkills}
          onChange={(e) => setOtherSkills(e.target.value)}
          className="field-input"
          placeholder="e.g. Sign language, motorcycle repair"
        />
        <p className="field-hint">Separate with commas.</p>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
