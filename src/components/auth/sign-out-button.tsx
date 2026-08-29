"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm font-medium text-ink-soft hover:text-ink"
    >
      Sign out
    </button>
  );
}
