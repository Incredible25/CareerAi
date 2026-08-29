"use client";

import { useRouter } from "next/navigation";

export function FilterSelect({
  label,
  param,
  current,
  options,
  baseHref,
  searchParams,
}: {
  label: string;
  param: string;
  current?: string;
  options: Record<string, string>;
  baseHref: string;
  searchParams: Record<string, string | undefined>;
}) {
  const router = useRouter();

  return (
    <select
      aria-label={label}
      defaultValue={current ?? ""}
      className="rounded-lg2 border border-sand-300 bg-white px-3 py-1.5 text-xs text-ink"
      onChange={(e) => {
        const next = { ...searchParams, [param]: e.currentTarget.value || undefined };
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(next)) {
          if (value) params.set(key, value);
        }
        const qs = params.toString();
        router.push(`${baseHref}${qs ? `?${qs}` : ""}`);
      }}
    >
      <option value="">{label}: All</option>
      {Object.entries(options).map(([value, optLabel]) => (
        <option key={value} value={value}>{optLabel}</option>
      ))}
    </select>
  );
}
