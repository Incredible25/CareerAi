import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-sand-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div>
          <Logo />
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink-faint">
            Access · Excellence · Opportunity
          </p>
        </div>
        <div className="flex gap-6 text-sm text-ink-soft">
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/login" className="hover:text-ink">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
