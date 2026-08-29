import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SourceForm } from "@/components/admin/source-form";

export const metadata: Metadata = { title: "Edit source · Admin" };

export default async function EditSourcePage({ params }: { params: { id: string } }) {
  const source = await prisma.source.findUnique({ where: { id: params.id } });
  if (!source) notFound();

  return (
    <div className="max-w-xl">
      <Link href="/admin/sources" className="text-sm font-medium text-ink-soft hover:text-ink">← All sources</Link>
      <h1 className="mt-3 text-2xl font-bold text-ink">{source.name}</h1>
      <div className="mt-6">
        <SourceForm initial={source} />
      </div>
    </div>
  );
}
