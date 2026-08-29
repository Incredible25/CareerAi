import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SOURCE_TYPE_LABELS, TRUST_LEVEL_LABELS } from "@/lib/opportunities/constants";
import { SourceForm } from "@/components/admin/source-form";

export const metadata: Metadata = { title: "Sources · Admin" };

export default async function AdminSourcesPage() {
  const sources = await prisma.source.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { opportunities: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Sources</h1>
      <p className="mt-1 max-w-xl text-sm text-ink-soft">
        Every opportunity must reference a source. Add the organization or platform here first,
        then reference it when adding an opportunity.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,360px]">
        <div className="space-y-3">
          {sources.length === 0 && <p className="text-sm text-ink-soft">No sources yet.</p>}
          {sources.map((source) => (
            <Link key={source.id} href={`/admin/sources/${source.id}`} className="card block hover:border-green-500/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-sm font-bold text-ink">{source.name}</p>
                  <p className="text-xs text-ink-faint">{SOURCE_TYPE_LABELS[source.type]} · {source.url}</p>
                </div>
                <div className="flex flex-none flex-col items-end gap-1">
                  <span className="badge">{TRUST_LEVEL_LABELS[source.trustLevel]} trust</span>
                  {!source.active && <span className="badge border-orange-400 text-orange-600">Inactive</span>}
                </div>
              </div>
              <p className="mt-2 text-xs text-ink-faint">{source._count.opportunities} opportunit{source._count.opportunities === 1 ? "y" : "ies"}</p>
            </Link>
          ))}
        </div>

        <div>
          <h2 className="mb-3 font-display text-sm font-bold text-ink">Add a source</h2>
          <SourceForm />
        </div>
      </div>
    </div>
  );
}
