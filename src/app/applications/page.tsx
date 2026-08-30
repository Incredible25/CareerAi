import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { isOnboardingComplete } from "@/lib/onboarding";
import { visibleOpportunityWhere } from "@/lib/opportunities/visibility";
import { AppHeader } from "@/components/app-header";
import { ApplicationTracker } from "@/components/applications/application-tracker";

export const metadata: Metadata = { title: "Your applications" };

export default async function ApplicationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.profile || !isOnboardingComplete(user.profile.onboardingStep)) redirect("/onboarding");

  const applications = await prisma.opportunityApplication.findMany({
    where: { userId: user.id },
    include: { opportunity: { include: { source: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const visibleOpportunities = await prisma.opportunity.findMany({
    where: { id: { in: applications.map((a) => a.opportunityId) }, ...visibleOpportunityWhere() },
    select: { id: true },
  });
  const visibleIds = new Set(visibleOpportunities.map((o) => o.id));

  return (
    <div className="min-h-dvh bg-sand-50 pb-24">
      <AppHeader name={user.name} isAdmin={user.role === "ADMIN"} />

      <main className="mx-auto max-w-2xl px-6 pt-10 sm:px-10">
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">Your applications</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Everything you&apos;ve saved or applied to, tracked at your own pace. 3Doors never
          submits an application for you or marks one applied on its own — every status here is
          something you told us.
        </p>

        <div className="mt-8">
          <ApplicationTracker
            initialApplications={applications.map((a) => ({
              id: a.id,
              status: a.status,
              notes: a.notes,
              appliedAt: a.appliedAt ? a.appliedAt.toISOString() : null,
              opportunity: {
                id: a.opportunity.id,
                title: a.opportunity.title,
                organization: a.opportunity.organization,
                applicationDeadline: a.opportunity.applicationDeadline
                  ? a.opportunity.applicationDeadline.toISOString()
                  : null,
                isVisible: visibleIds.has(a.opportunity.id),
              },
            }))}
          />
        </div>
      </main>
    </div>
  );
}
