import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function AppHeader({ name }: { name: string }) {
  return (
    <header className="border-b border-sand-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 sm:px-10">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-ink-soft sm:inline">{name}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
