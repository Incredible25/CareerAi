# Phase 7 Step 3 — Beta User Intake

**No new field was added to the schema for this step.** Every piece of
information the brief asks the beta cohort to be stratified by is already
collected by the existing registration/onboarding flow — designing intake
here means mapping the requirement onto what already exists, not building
a new collection mechanism, per the existing data-minimization principle
(`docs/SECURITY_PRIVACY_REVIEW.md` "Data minimization") and the phase's
explicit instruction not to collect unnecessary personal information.

## Cohort mix, mapped to existing fields

| Required mix | Existing field | How it maps |
|---|---|---|
| Secondary-school students / university students / recent graduates / young job seekers | `Education.level` (`SECONDARY` / `UNIVERSITY` / `GRADUATE` / `OTHER`) | Near-exact match — `OTHER` ("self-directed learning") is the closest existing bucket to "young job seeker not currently enrolled," and is accurate rather than forced. |
| Age spread (the product's own `isMinor` split matters here too) | `User.ageRange` | Already recruits across `UNDER_16` through `OVER_30`; combined with `Education.level` gives a fuller picture than either alone (e.g. a 17-year-old university entrant vs. a 17-year-old still in secondary school). |
| Different device types | `Profile.hasLaptop`, `Profile.hasSmartphone` | Collected at onboarding's Access step; already unused by the scoring engine (a known, separately-tracked gap, `docs/RECOMMENDATION_QUALITY_RUBRIC.md` dimension 11) but perfectly usable for beta cohort stratification, which is exactly the kind of use this data was always intended for. |
| Different internet/connectivity conditions | `Profile.internetAccess` (`RELIABLE_DAILY` / `INTERMITTENT` / `LIMITED`) | Same source. |
| Different levels of digital literacy | **Not directly collected, and not added.** | See below — deliberately not turned into a new required field. |

## Digital literacy — why no new field

Digital literacy is a real axis the cohort should vary across, but adding
a self-reported "how comfortable are you with technology" field to
onboarding would be new UI, asked of every future user forever, to serve
a need that's specific to this one beta. Two better-fitted alternatives,
neither requiring a code change:

1. **Recruitment-time judgment, not stored data.** Whoever recruits the
   15-25 participants (a human process, `docs/PHASE_6_BETA_PLAN.md` §1)
   can deliberately include a spread — some participants comfortable with
   apps and forms, some who rarely use one — using their own knowledge of
   the people they're inviting. This is exactly the kind of context a
   recruiter has and a database field would only approximate.
2. **Observed, not asked.** Step 6's metrics (drop-off points, technical
   errors, time-to-complete) will surface digital-literacy-correlated
   friction on their own — someone struggling with the interface shows up
   in the data as a drop-off or an error, which is more honest signal
   than a self-rating collected once at the start.

## What's collected outside the app, for recruitment logistics only

Before someone registers, whoever runs the beta needs a way to invite
them — a name and a contact channel (the email they'll register with, or
a phone/WhatsApp number to send that email address to). **This is
recruitment logistics, not product data**: it doesn't need to live in
the database at all beyond what registration itself already collects
(`name`, `email`). A simple, disposable recruitment list (a spreadsheet,
kept only as long as invitations are being sent) is sufficient and
appropriately minimal for 15-25 people — building a dedicated recruitment
CRM would be a new feature this phase explicitly doesn't call for.

## What is deliberately not collected

Consistent with `docs/SECURITY_PRIVACY_REVIEW.md`'s existing
data-minimization stance: no school name or ID, no phone number, no
parent/guardian contact, no precise location, no photo, no digital-
literacy self-rating (above). None of these are needed to run or evaluate
this beta, and the product doesn't collect any of them today outside this
step either — beta intake doesn't get to be the exception that quietly
adds a new PII field the rest of the product doesn't have.

## Marking someone as a beta participant

Once a recruited person registers normally through the existing flow,
whoever operates the beta runs `prisma/mark-beta-user.ts <email> on`
(Step 2) to add them to the cohort. No separate "beta signup" path exists
or is being built — the existing registration and onboarding flow,
already audited in Step 1 with no blockers, is the actual intake
mechanism; this step only adds the marker that scopes queries and the
kill switch to the resulting cohort.
