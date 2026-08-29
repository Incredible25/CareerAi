"use client";

import { signOut } from "next-auth/react";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={className ?? "text-sm font-medium text-ink-soft hover:text-ink"}
    >
      Sign out
    </button>
  );
}
