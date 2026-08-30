"use client";

import { useState, useTransition } from "react";

type Task = {
  id: string;
  phase: string;
  weekStart: number;
  weekEnd: number;
  title: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  order: number;
};

// PENDING -> IN_PROGRESS -> DONE -> back to PENDING. A single click always
// advances to the next state, same gesture as the old binary checkbox —
// it just no longer skips over "started but not finished," which the
// schema (TaskStatus) already supported but the old toggle collapsed
// straight from DONE to PENDING and back, ignoring IN_PROGRESS entirely.
const NEXT_STATUS: Record<Task["status"], Task["status"]> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "PENDING",
};

const STATUS_LABELS: Record<Task["status"], string> = {
  PENDING: "Not started",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export function RoadmapPhases({ tasks: initialTasks }: { tasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [, startTransition] = useTransition();

  const phases = Array.from(new Set(tasks.map((t) => t.phase)));

  function advance(task: Task) {
    const nextStatus = NEXT_STATUS[task.status];
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));
    startTransition(() => {
      void fetch(`/api/roadmap/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
    });
  }

  return (
    <div className="space-y-6">
      {phases.map((phase) => {
        const phaseTasks = tasks.filter((t) => t.phase === phase).sort((a, b) => a.order - b.order);
        const weekRange = `Week ${phaseTasks[0]?.weekStart}${
          phaseTasks[0]?.weekEnd !== phaseTasks[0]?.weekStart ? `–${phaseTasks[0]?.weekEnd}` : ""
        }`;

        return (
          <div key={phase} className="card">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-base font-bold text-ink">{phase}</h3>
              <span className="font-mono text-xs text-ink-faint">{weekRange}</span>
            </div>
            <ul className="mt-3 space-y-2.5">
              {phaseTasks.map((task) => (
                <li key={task.id} className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => advance(task)}
                    aria-label={
                      task.status === "PENDING"
                        ? "Not started — click to mark in progress"
                        : task.status === "IN_PROGRESS"
                          ? "In progress — click to mark done"
                          : "Done — click to reset to not started"
                    }
                    title={`${STATUS_LABELS[task.status]} · click to advance`}
                    className={
                      "mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border text-[11px] font-bold transition " +
                      (task.status === "DONE"
                        ? "border-green-500 bg-green-500 text-white"
                        : task.status === "IN_PROGRESS"
                          ? "border-orange-400 bg-orange-50 text-orange-500"
                          : "border-sand-300 bg-white text-transparent hover:border-green-500")
                    }
                  >
                    {task.status === "DONE" ? "✓" : task.status === "IN_PROGRESS" ? "•" : "✓"}
                  </button>
                  <div>
                    <p className={"flex items-center gap-1.5 text-sm font-medium " + (task.status === "DONE" ? "text-ink-faint line-through" : "text-ink")}>
                      {task.title}
                      {task.status === "IN_PROGRESS" && (
                        <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-500">
                          In progress
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-soft">{task.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
