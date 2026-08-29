"use client";

const ENVIRONMENT_LABELS: Record<string, string> = {
  REMOTE: "Remote",
  IN_PERSON: "In-person",
  HYBRID: "A mix of both",
  NO_PREFERENCE: "No strong preference",
};

export type PreferencesStepValues = {
  careerGoals: string;
  incomeGoal: string;
  preferredEnvironment: string;
  availableHoursPerWeek: number;
};

export function PreferencesStep({
  defaultValues,
  submitting,
  onSubmit,
}: {
  defaultValues: PreferencesStepValues;
  submitting: boolean;
  onSubmit: (data: PreferencesStepValues) => void;
}) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      careerGoals: String(form.get("careerGoals") ?? ""),
      incomeGoal: String(form.get("incomeGoal") ?? ""),
      preferredEnvironment: String(form.get("preferredEnvironment") ?? "NO_PREFERENCE"),
      availableHoursPerWeek: Number(form.get("availableHoursPerWeek") ?? 0),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="field-label" htmlFor="careerGoals">
          What are you hoping for, career-wise?
        </label>
        <textarea
          id="careerGoals"
          name="careerGoals"
          rows={3}
          defaultValue={defaultValues.careerGoals}
          className="field-input"
          placeholder="Not sure yet is a completely fine answer."
        />
      </div>

      <div>
        <label className="field-label" htmlFor="incomeGoal">
          Any income goal? <span className="text-ink-faint">(optional)</span>
        </label>
        <input
          id="incomeGoal"
          name="incomeGoal"
          type="text"
          defaultValue={defaultValues.incomeGoal}
          className="field-input"
          placeholder="e.g. Enough to cover my own data and transport"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="preferredEnvironment">
            Preferred way of working
          </label>
          <select
            id="preferredEnvironment"
            name="preferredEnvironment"
            defaultValue={defaultValues.preferredEnvironment}
            className="field-input"
          >
            {Object.entries(ENVIRONMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="availableHoursPerWeek">
            Hours per week you can realistically give this
          </label>
          <input
            id="availableHoursPerWeek"
            name="availableHoursPerWeek"
            type="number"
            min={0}
            max={80}
            defaultValue={defaultValues.availableHoursPerWeek}
            className="field-input"
          />
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
