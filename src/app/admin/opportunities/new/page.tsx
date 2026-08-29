import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OpportunityForm } from "@/components/admin/opportunity-form";

export const metadata: Metadata = { title: "Add opportunity · Admin" };

export default async function NewOpportunityPage() {
  const [sources, skills, careers] = await Promise.all([
    prisma.source.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.skill.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.careerProfile.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-2xl">
      <Link href="/admin/opportunities" className="text-sm font-medium text-ink-soft hover:text-ink">← All opportunities</Link>
      <h1 className="mt-3 text-2xl font-bold text-ink">Add an opportunity</h1>
      <p className="mt-1 text-sm text-ink-soft">
        New opportunities are created as <strong>unverified drafts</strong>. Nothing here becomes
        visible to users, or counts as verified, until reviewed separately.
      </p>
      <div className="mt-6">
        <OpportunityForm sources={sources} skillCatalog={skills} careerCatalog={careers} />
      </div>
    </div>
  );
}
