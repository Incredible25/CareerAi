import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Open your first door"
      subtitle="A few details to get started — you can add the rest as you go."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-green-500 hover:text-orange-500">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
