"use client";

import { useMemo, useState } from "react";

type InterestCatalogItem = { id: string; name: string; category: string | null };

export type InterestsStepValues = { interestIds: string[] };

export function InterestsStep({
  catalog,
  defaultSelected,
  submitting,
  onSubmit,
}: {
  catalog: InterestCatalogItem[];
  defaultSelected: string[];
  submitting: boolean;
  onSubmit: (data: InterestsStepValues) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected));

  const grouped = useMemo(() => {
    const groups: Record<string, InterestCatalogItem[]> = {};
    for (const interest of catalog) {
      const key = interest.category ?? "Other";
      groups[key] = groups[key] ? [...groups[key], interest] : [interest];
    }
    return groups;
  }, [catalog]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ interestIds: Array.from(selected) });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-ink-soft">Pick whatever genuinely interests you — as many as apply.</p>

      {Object.entries(grouped).map(([category, items]) => (
        <fieldset key={category}>
          <legend className="mb-2 text-sm font-semibold text-ink">{category}</legend>
          <div className="flex flex-wrap gap-2">
            {items.map((interest) => {
              const active = selected.has(interest.id);
              return (
                <button
                  type="button"
                  key={interest.id}
                  onClick={() => toggle(interest.id)}
                  aria-pressed={active}
                  className={
                    "rounded-full border px-3.5 py-2 text-sm font-medium transition " +
                    (active
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-sand-300 bg-white text-ink-soft hover:border-green-500 hover:text-green-500")
                  }
                >
                  {interest.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
