import Link from "next/link";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/matches", label: "Matches" },
  { href: "/opportunities", label: "Opportunities" },
  { href: "/applications", label: "Applications" },
  { href: "/side-income", label: "Side income" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/assistant", label: "Assistant" },
];

export function AppHeader({ name, isAdmin }: { name: string; isAdmin?: boolean }) {
  return (
    <header className="border-b border-sand-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-5 md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-ink-soft hover:text-ink">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link href="/admin/opportunities" className="badge border-orange-400 text-orange-600 hover:bg-orange-50">
              Admin
            </Link>
          )}
          <span className="hidden text-sm text-ink-soft sm:inline">{name}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
