"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AGE_RANGES, AGE_RANGE_LABELS } from "@/lib/validation/auth";
import { LAUNCH_COUNTRIES } from "@/lib/countries";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      ageRange: form.get("ageRange"),
      country: form.get("country"),
      city: form.get("city"),
    };

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <p
          role="alert"
          className="rounded-lg2 border border-orange-400 bg-orange-50 px-4 py-3 text-sm text-orange-600"
        >
          {error}
        </p>
      )}

      <div>
        <label className="field-label" htmlFor="name">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="field-input"
          placeholder="Ange Nkeng"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="field-input"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field-input"
          placeholder="At least 8 characters"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="ageRange">
            Age range
          </label>
          <select id="ageRange" name="ageRange" required className="field-input" defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {AGE_RANGES.map((range) => (
              <option key={range} value={range}>
                {AGE_RANGE_LABELS[range]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="country">
            Country
          </label>
          <select id="country" name="country" required className="field-input" defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {LAUNCH_COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="city">
          City / region <span className="text-ink-faint">(optional)</span>
        </label>
        <input id="city" name="city" type="text" className="field-input" placeholder="Douala" />
      </div>

      <p className="field-hint">
        We only ask for what helps your guidance be specific to you. You can edit or delete this
        information anytime from your profile.
      </p>

      <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
        {submitting ? "Creating your account…" : "Create account"}
      </button>
    </form>
  );
}
