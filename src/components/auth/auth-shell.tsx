import Link from "next/link";
import { Logo } from "@/components/logo";

export function AuthShell({
  title,
  subtitle,
  footer,
  children,
}: {
  title: string;
  subtitle: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-sand-50">
      <header className="px-6 py-6 sm:px-10">
        <Logo />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-ink">{title}</h1>
            <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>
          </div>
          <div className="card">{children}</div>
          <p className="mt-6 text-center text-sm text-ink-soft">{footer}</p>
        </div>
      </main>
      <footer className="px-6 pb-8 text-center text-xs text-ink-faint">
        <Link href="/privacy" className="hover:text-ink-soft">
          Privacy
        </Link>
        <span className="mx-2">·</span>
        <Link href="/terms" className="hover:text-ink-soft">
          Terms
        </Link>
      </footer>
    </div>
  );
}
