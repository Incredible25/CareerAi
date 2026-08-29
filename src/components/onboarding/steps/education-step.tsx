"use client";

const LEVEL_LABELS: Record<string, string> = {
  SECONDARY: "Secondary school",
  UNIVERSITY: "University",
  GRADUATE: "Graduate / postgraduate",
  OTHER: "Other / self-directed learning",
};

export type EducationStepValues = {
  level: string;
  institution: string;
  program: string;
  subjects: string;
  strengths: string;
};

export function EducationStep({
  defaultValues,
  submitting,
  onSubmit,
}: {
  defaultValues: EducationStepValues | null;
  submitting: boolean;
  onSubmit: (data: EducationStepValues) => void;
}) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      level: String(form.get("level") ?? ""),
      institution: String(form.get("institution") ?? ""),
      program: String(form.get("program") ?? ""),
      subjects: String(form.get("subjects") ?? ""),
      strengths: String(form.get("strengths") ?? ""),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="field-label" htmlFor="level">
          Where are you in your education?
        </label>
        <select
          id="level"
          name="level"
          required
          defaultValue={defaultValues?.level ?? ""}
          className="field-input"
        >
          <option value="" disabled>
            Select
          </option>
          {Object.entries(LEVEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="institution">
            School / university <span className="text-ink-faint">(optional)</span>
          </label>
          <input
            id="institution"
            name="institution"
            type="text"
            defaultValue={defaultValues?.institution}
            className="field-input"
            placeholder="Lycée Bilingue de..."
          />
        </div>
        <div>
          <label className="field-label" htmlFor="program">
            Course / program <span className="text-ink-faint">(optional)</span>
          </label>
          <input
            id="program"
            name="program"
            type="text"
            defaultValue={defaultValues?.program}
            className="field-input"
            placeholder="Economics"
          />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="subjects">
          Subjects you study or studied
        </label>
        <input
          id="subjects"
          name="subjects"
          type="text"
          defaultValue={defaultValues?.subjects}
          className="field-input"
          placeholder="Biology, Mathematics, English"
        />
        <p className="field-hint">Separate with commas.</p>
      </div>

      <div>
        <label className="field-label" htmlFor="strengths">
          Which of those are you strongest in?
        </label>
        <input
          id="strengths"
          name="strengths"
          type="text"
          defaultValue={defaultValues?.strengths}
          className="field-input"
          placeholder="Biology, English"
        />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
