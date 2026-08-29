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

export function RoadmapPhases({ tasks: initialTasks }: { tasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [, startTransition] = useTransition();

  const phases = Array.from(new Set(tasks.map((t) => t.phase)));

  function toggle(task: Task) {
    const nextStatus = task.status === "DONE" ? "PENDING" : "DONE";
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
                    onClick={() => toggle(task)}
                    aria-pressed={task.status === "DONE"}
                    className={
                      "mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border text-[11px] font-bold transition " +
                      (task.status === "DONE"
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-sand-300 bg-white text-transparent hover:border-green-500")
                    }
                  >
                    ✓
                  </button>
                  <div>
                    <p className={"text-sm font-medium " + (task.status === "DONE" ? "text-ink-faint line-through" : "text-ink")}>
                      {task.title}
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
