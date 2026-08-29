import Link from "next/link";
import { Logo } from "@/components/logo";

const NAV_LINKS = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#trust", label: "Trust" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-sand-200/80 bg-sand-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-soft hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-ink-soft hover:text-ink">
            Sign in
          </Link>
          <Link href="/register" className="btn-primary !px-4 !py-2 text-sm">
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
