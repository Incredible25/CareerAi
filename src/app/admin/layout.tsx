import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";

const ADMIN_NAV = [
  { href: "/admin/opportunities", label: "Opportunities" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/reports", label: "Reports" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-sand-50">
      <header className="border-b border-navy-500 bg-navy-500">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10">
          <div className="flex items-center gap-8">
            <Logo />
            <span className="badge border-orange-400 bg-orange-50 text-orange-600">Admin</span>
            <nav className="hidden items-center gap-5 md:flex">
              {ADMIN_NAV.map((link) => (
                <Link key={link.href} href={link.href} className="text-sm font-medium text-white/80 hover:text-white">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-white/80 hover:text-white">
              Exit admin
            </Link>
            <SignOutButton className="text-sm font-medium text-white/80 hover:text-white" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">{children}</main>
    </div>
  );
}
