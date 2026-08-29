"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ASSESSMENT_CATEGORIES,
  LIKERT_OPTIONS,
  questionsByCategory,
  ASSESSMENT_QUESTIONS,
} from "@/lib/assessment/questions";
import { Logo } from "@/components/logo";

export function AssessmentForm({
  assessmentId,
  initialAnswers,
}: {
  assessmentId: string;
  initialAnswers: Record<string, number>;
}) {
  const router = useRouter();
  const [screenIndex, setScreenIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const category = ASSESSMENT_CATEGORIES[screenIndex]!;
  const questions = useMemo(() => questionsByCategory(category), [category]);
  const isLastScreen = screenIndex === ASSESSMENT_CATEGORIES.length - 1;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === ASSESSMENT_QUESTIONS.length;
  const currentScreenComplete = questions.every((q) => answers[q.id] !== undefined);

  function selectAnswer(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    // Fire-and-forget autosave: the definitive completeness check happens
    // server-side on submit, so a dropped request here just means the
    // answer is re-sent if the user revisits the question.
    void fetch("/api/assessment/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId, questionId, value }),
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/assessment/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Couldn't submit. Please try again.");
      setSubmitting(false);
      return;
    }
    router.push("/assessment/results");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-sand-50">
      <header className="px-6 py-6 sm:px-10">
        <Logo />
      </header>

      <main className="mx-auto max-w-xl px-6 pb-24">
        <h1 className="text-2xl font-bold text-ink">Self-discovery assessment</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {ASSESSMENT_QUESTIONS.length} short statements, rated on how much they sound like you.
          There are no right or wrong answers.
        </p>
        <p className="field-hint mt-1">
          This is a career-guidance tool, not a professional psychological assessment.
        </p>

        <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-sand-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${(answeredCount / ASSESSMENT_QUESTIONS.length) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-faint">
          {answeredCount} of {ASSESSMENT_QUESTIONS.length} answered
        </p>

        <div className="card mt-6">
          <h2 className="font-display text-lg font-bold text-ink">{category}</h2>

          <div className="mt-5 space-y-6">
            {questions.map((q) => (
              <fieldset key={q.id}>
                <legend className="text-sm font-medium text-ink">{q.prompt}</legend>
                <div className="mt-3 grid grid-cols-5 gap-1.5">
                  {LIKERT_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => selectAnswer(q.id, opt.value)}
                      aria-pressed={answers[q.id] === opt.value}
                      title={opt.label}
                      className={
                        "rounded-lg2 border px-1 py-2.5 text-center text-[11px] font-medium leading-tight transition " +
                        (answers[q.id] === opt.value
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-sand-300 bg-white text-ink-soft hover:border-green-500")
                      }
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-ink-faint">
                  <span>Disagree</span>
                  <span>Agree</span>
                </div>
              </fieldset>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg2 border border-orange-400 bg-orange-50 px-4 py-3 text-sm text-orange-600">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={screenIndex === 0}
            onClick={() => setScreenIndex((i) => Math.max(0, i - 1))}
            className="text-sm font-medium text-ink-soft hover:text-ink disabled:opacity-0"
          >
            ← Back
          </button>

          {isLastScreen ? (
            <button
              type="button"
              disabled={!allAnswered || submitting}
              onClick={handleSubmit}
              className="btn-primary disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "See my results"}
            </button>
          ) : (
            <button
              type="button"
              disabled={!currentScreenComplete}
              onClick={() => setScreenIndex((i) => i + 1)}
              className="btn-primary disabled:opacity-60"
            >
              Next
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
