# 3Doors — Founding Product & Technical Strategy

**ACCESS. EXCELLENCE. OPPORTUNITY.**

Prepared as the CTO founding brief for 3Doors — an AI-powered career discovery, planning, and opportunity navigation platform for students, graduates, and young professionals in Africa, starting in Cameroon.

Status: **Planning only. No application code has been written.** This document is Phases 1–10 of the development process (PRD → wireframes/IA → architecture). Implementation begins only after sign-off.

---

## 1. Product Requirements Document

### 1.1 Vision
3Doors is a personal AI career navigator — not a chatbot, not a job board — that walks a young person through a single continuous path:

`SELF-DISCOVERY → CAREER DIRECTION → SKILL DEVELOPMENT → PRACTICE → PORTFOLIO → OPPORTUNITIES → INCOME → LONG-TERM GROWTH`

### 1.2 Problem
Career guidance available to young Africans today is generic (built for other markets), expensive or inaccessible, degree-obsessed, not personalized, and disconnected from real, current opportunities. Most tools stop at "here's a career you might like" — none walk the user into action.

### 1.3 What 3Doors must be true to
- **Transparent, not oracular.** Every recommendation shows its reasoning and a fit score, never a bare verdict.
- **Plural, not singular.** Always a ranked set of paths, never "the one right career."
- **Actionable today, not just someday.** Every session should surface at least one thing the user can start now (a skill, a starter project, a side-income option) — this is the platform's real differentiator over static career-test tools.
- **Honest about certainty.** AI-generated guidance is visibly labeled and distinguished from verified data (real opportunities, real sources). Nothing is invented — no fake jobs, scholarships, companies, salaries, or deadlines.
- **Built for the environment it serves.** Assumes intermittent internet, shared or low-spec devices, prepaid data cost-sensitivity, and a job market where non-degree and remote/freelance paths are often more viable than the formal sector — without stereotyping any individual user.

### 1.4 Product pillars → naming logic
- **Door 1 — Access:** low-friction onboarding, works on modest connections/devices, free core tier.
- **Door 2 — Excellence:** rigorous, structured recommendation methodology; real skill-building; credible content.
- **Door 3 — Opportunity:** a direct line from "I don't know what to do" to a real application, client, or income.

---

## 2. MVP Feature List

In scope for MVP (maps to Phase 24 of the brief):

1. Landing page (marketing, trust-building, no login wall to understand the product)
2. Auth: registration/login (email + password, social optional later)
3. Progressive user profile (not a single long form)
4. Self-discovery assessment (interests, strengths, work preferences, etc.)
5. AI career recommendation engine → Top 5 ranked career matches with transparent scoring
6. Career exploration pages (per career: overview, skills, pathways, projects)
7. Skill-gap analysis (current vs. required, per selected career)
8. 90-day personalized roadmap
9. Side-income recommendations engine (works from the user's *current* skills, not just their target career)
10. AI career assistant (conversational, profile-aware, scoped to career topics)
11. User dashboard (single home for direction, plan, and progress)
12. Minimal admin console to manage the career knowledge base (needed to run the recommendation engine at all — see §16)

Explicitly **out of MVP** — detailed in §19.

---

## 3. User Personas

| | Ange, 17 | Brice, 21 | Solange, 24 | Kevin, 23 |
|---|---|---|---|---|
| **Stage** | Secondary school (Terminale), Douala | University, Economics, Yaoundé II | Recent graduate, Biology, 8 months job-hunting, Bafoussam | Self-taught, no degree, Buea |
| **Device/data** | Shared family smartphone, buys data bundles weekly | Own low-end Android, campus wifi + data | Smartphone only, cost-conscious | Laptop + phone, decent connectivity |
| **Core need** | "What should I even study? What does my strong grade in Bio actually lead to?" | "I'm in Econ but I don't want a bank job — what else is possible, and what should I learn on the side?" | "My degree didn't lead anywhere. What can I pivot to, and can I earn something while I retrain?" | "I want to earn online now. I don't need a lecture on careers, I need a starting point today." |
| **Frustration with status quo** | Career talks are generic ("become a doctor or engineer"), not tied to her actual subjects/grades | No one connects his coursework to real non-banking paths; guidance counselors don't know remote work exists | Feels the guidance industry assumes she should have "known better"; nothing practical, just more advice | Impatient with anything that feels like a quiz with no output |
| **What 3Doors must deliver for them** | Subject-to-career mapping, low-pressure assessment, guidance she can act on before choosing a university track | Skill-development plan that runs alongside his degree; freelance/remote entry points | Fast skills-gap read using her *existing* transferable skills; a repositioning path, not just "start over" | Immediate side-income list scored against skills she already has, with a first-client action, on day one |
| **Risk if we get it wrong** | Bounces after one generic "you'd be a great doctor!" screen | Sees it as "just another quiz app," never returns | Feels judged/patronized, associates 3Doors with the same dead-end advice she's already had | Wants ROI in under 5 minutes; will not tolerate onboarding friction |

A fifth persona to design for explicitly, without stereotyping: **low-connectivity/low-device users** (e.g., users on 2G/3G, shared devices, limited data budgets) — every core flow must degrade gracefully rather than exclude them (see §14.4).

---

## 4. Detailed User Journey (MVP)

1. **Landing (no login required).** Headline: *"Discover Your Direction. Build Your Skills. Find Your Opportunities."* Explains the 7-step path in plain language, shows a sample career-match card so the value is visible before signup, states clearly that AI guidance is a tool, not a professional/psychological verdict.
2. **Account creation.** Email + password (or magic link). Minimal fields at signup: name, email, password, age range, country/city. Age range determines whether minor-safeguarding rules apply (§13).
3. **Progressive profile.** Rather than one long form, the app asks a handful of questions at a time across the first few sessions — education, subjects, interests, skills, experience, work preferences, time availability, device/internet access, income goals. Each step is skippable and resumable; the dashboard always shows "profile completeness" so the user knows why more detail helps.
4. **Self-discovery assessment.** ~15–20 short, plain-language items (not 100+ Likert-scale questions) covering interests, strengths, work preferences, problem-solving style, social/business/technical orientation. A visible disclaimer: *"This is a career guidance tool, not a psychological or clinical assessment."*
5. **AI analysis.** The assessment + profile are compiled into a structured payload and sent to the recommendation engine (§7–8). Processing state is shown (this should take seconds, not feel like a black box).
6. **Career profile + Top 5 matches.** Each match shows fit score, the specific reasons behind it (tied to the user's own answers), current strengths that support it, skills to develop, a starter project, and realistic entry points (internship/freelance/remote), with 2–3 nearby alternative careers surfaced instead of forcing a single choice.
7. **Career exploration.** The user can open any of the 5 (or browse others) to see the full career profile page (§ Career Exploration in the knowledge base, see §31 of the original brief / §6 here).
8. **Selecting a direction.** Choosing a career (not exclusive — a user can hold more than one "active" direction) triggers:
   - **Skill-gap analysis** (current vs. required skills for that career)
   - **90-day roadmap**, sequenced and adapted to the user's available time, device/internet access, and current level
   - **Side-income options** available *right now* from the user's existing skills — deliberately shown even to users who are still years from their long-term career, because it is the fastest source of trust and momentum
9. **Dashboard becomes home base.** Career direction, top matches, current roadmap stage, recommended next actions, and the AI assistant are always one tap away.
10. **AI assistant remains available.** Profile-aware, can answer open questions ("What can I do with a degree in Economics?"), help interpret the plan, or be asked to revisit the assessment if the user's goals change.
11. **Return visits.** The system should never make a returning user re-explain themselves — the dashboard opens on "here's where you left off" and one concrete recommended next action.

Edge cases the journey must handle explicitly: a user who abandons the assessment partway (resume, don't restart); a user who disagrees with their top match (easy path to explore alternatives or retake specific assessment sections); a low-bandwidth session (text-first rendering, no blocking on images/heavy assets).

---

## 5. Site Map

```
3DOORS
├── Marketing (public, no auth)
│   ├── / (Landing)
│   ├── /how-it-works
│   ├── /careers (public career-knowledge browse — SEO + content strategy, §34)
│   │   └── /careers/[slug]
│   ├── /about
│   ├── /privacy  &  /terms
│   └── /login  /register
│
├── App (authenticated)
│   ├── /onboarding            (progressive profile, resumable, step-based)
│   ├── /assessment            (self-discovery assessment)
│   ├── /dashboard             (home base — §19 of brief)
│   ├── /matches                (Top 5 career matches, ranked)
│   ├── /careers/[slug]/plan    (skill gap + roadmap + side-income for a chosen career, authed view)
│   ├── /side-income            (side-income engine, independent of a chosen career)
│   ├── /roadmap                (active 90-day plan, task tracking)
│   ├── /portfolio               (Phase 3+ — project tracker; stubbed nav in MVP if trivial)
│   ├── /assistant               (AI career assistant, full conversation view)
│   ├── /profile                (edit profile, manage data, delete account)
│   └── /settings                (privacy, notifications, language)
│
└── Admin (internal, RBAC-gated)
    ├── /admin/users
    ├── /admin/careers            (career knowledge base CRUD)
    ├── /admin/skills
    ├── /admin/opportunities      (Phase 5 — verification queue)
    ├── /admin/resources          (learning resources CRUD)
    ├── /admin/analytics
    └── /admin/ai-config           (prompt/version management, guarded)
```

---

## 6. Database Schema

Relationships first, in prose, before any table definition — this is a normalized relational design on PostgreSQL.

**Identity & profile cluster.** A `users` row is the authentication identity. It has one `profiles` row (1:1) holding the "soft" data used for recommendations (goals, preferences, availability). `education` records (1:many — a user may log secondary + university history) and `skills`/`interests` are many-to-many through join tables (`user_skills`, `user_interests`) carrying a proficiency/strength level, since skills and interests are drawn from shared, reusable catalogs (needed later for matching against `career_skills` and `opportunity` requirements).

**Assessment cluster.** `assessments` records one completed (or in-progress) self-discovery assessment per user per attempt (users may retake). `assessment_answers` is 1:many off `assessments`, one row per question, storing the raw answer plus which trait(s) it maps to. This raw data is what gets compiled into the structured payload sent to the AI (§7).

**Career knowledge base.** `career_profiles` is the authoritative, admin-curated catalog (not AI-invented). `career_skills` joins careers to the shared `skills` catalog with a `level` (beginner/intermediate/advanced) and `required` flag. `career_profiles` self-references for `related_careers`. `learning_resources` link to careers and/or skills, tagged FREE/LOW_COST/PAID, with a `verified_at` and `source_url` — never invented.

**Recommendation cluster (generated, per user).** `career_matches` is 1:many off `users`, one row per recommended career per assessment run, storing the fit score, the reasoning breakdown (JSON, mirroring the score's sub-factors), and which `assessments` run produced it — so history is preserved across retakes rather than overwritten. `skill_gaps` is 1:many off (`user`, `career_profile`), one row per missing/weak skill for that pairing. `roadmaps` is 1:1 per (`user`, `career_profile`) active plan; `roadmap_tasks` is 1:many off `roadmaps`, ordered, with a status (`pending/in_progress/done`) — this is what powers the progress bars in §20 of the brief.

**Side-income cluster.** `side_opportunities` is the admin-curated catalog of side-income archetypes (Social Media Assistant, Virtual Assistant, etc. — structurally similar to `career_profiles` but scoped to fast-start, low-barrier work). A generated `side_income_matches` table (analogous to `career_matches`) stores per-user scored results so the dashboard doesn't recompute on every load.

**Opportunity cluster (Phase 5, schema reserved now).** `opportunities` is the verified, sourced listing catalog (jobs/internships/scholarships/etc.), always carrying `source_url` and `verified_at` — never AI-authored. `opportunity_matches` is generated per user, analogous to `career_matches`, storing a match score and the specific gaps preventing a stronger match.

**Portfolio & applications (Phase 3/6).** `portfolio_projects` is 1:many off `users`, optionally linked to a `career_profile` or `roadmap_task` it fulfills. `applications` tracks opportunities/side-jobs the user says they've pursued — this is the platform's real success signal (§35 of the brief).

**Conversation & system cluster.** `ai_conversations` (1:many off `users`) and `ai_messages` (1:many off `ai_conversations`) store the assistant history, each message tagged with the profile-snapshot version used, so answers stay auditable. `notifications` is 1:many off `users` (deadline reminders, roadmap nudges — mostly Phase 3+).

### Table reference

| Table | Purpose | Key relationships |
|---|---|---|
| `users` | Auth identity | 1:1 `profiles`; 1:many everything else |
| `profiles` | Goals, preferences, availability, device/internet access | 1:1 `users` |
| `education` | School/university history | many:1 `users` |
| `skills` / `interests` | Shared reusable catalogs | many:many via join tables |
| `user_skills` / `user_interests` | User's self-reported level | joins `users` ↔ `skills`/`interests` |
| `assessments` | One assessment attempt | many:1 `users` |
| `assessment_answers` | Raw per-question answers | many:1 `assessments` |
| `career_profiles` | Curated career knowledge base | self-ref `related_careers`; many:many `career_skills` |
| `career_skills` | Skill requirement per career, with level | joins `career_profiles` ↔ `skills` |
| `career_matches` | Generated, scored recommendation | many:1 `users`, `assessments`, `career_profiles` |
| `skill_gaps` | Missing skill per (user, career) | many:1 `users`, `career_profiles`, `skills` |
| `learning_resources` | Verified courses/materials, cost tier | many:many with `skills`/`career_profiles` |
| `roadmaps` | Active plan per (user, career) | many:1 `users`, `career_profiles` |
| `roadmap_tasks` | Ordered, trackable steps | many:1 `roadmaps` |
| `side_opportunities` | Curated side-income catalog | many:many `skills` |
| `side_income_matches` | Generated, scored side-income fit | many:1 `users`, `side_opportunities` |
| `opportunities` | Verified external listings (Phase 5) | — |
| `opportunity_matches` | Generated match (Phase 5) | many:1 `users`, `opportunities` |
| `portfolio_projects` | User's tracked work | many:1 `users`; optional link to `career_profiles`/`roadmap_tasks` |
| `applications` | User-logged pursuit of an opportunity | many:1 `users`; optional link to `opportunities` |
| `notifications` | Reminders/nudges | many:1 `users` |
| `ai_conversations` / `ai_messages` | Assistant history | 1:many chain off `users` |

---

## 7. AI Architecture

**Principle: the LLM reasons over structured data it does not own the source of truth for.** The career knowledge base, skills catalog, learning resources, and opportunities are all admin-curated, database-backed facts. The LLM's job is matching, explaining, and sequencing — never inventing entities.

**Pipeline:**

1. **Profile compiler** (server-side): assembles a structured JSON payload from `profiles`, `education`, `user_skills`, `user_interests`, and the latest `assessment_answers` — the shape described in §29 of the brief (education_level, subjects, interests, skills, strengths, experience, goals, work_preferences, location, available_time).
2. **Prompt orchestrator**: selects the task (career recommendation / skill-gap+roadmap / side-income / assistant chat) and builds a request that includes (a) the structured user payload, (b) the *relevant slice* of the career/skills knowledge base (retrieved by candidate filtering, not the whole catalog), and (c) a strict output schema.
3. **LLM call** (Claude, via the Claude API), using tool-use / structured-output mode so the model returns typed JSON, not free text, for every generative task except open conversational replies in the assistant.
4. **Validator**: every structured response is validated against a schema before it touches the database — reject and retry (bounded) on malformed output; never persist a response that references a career, skill, or resource not present in the knowledge base.
5. **Persistence**: validated output is written to `career_matches` / `skill_gaps` / `roadmaps` / `side_income_matches` etc. The user reads the *stored* result, not a live re-generation on every page view — this keeps cost predictable and results stable/explainable across sessions.
6. **Assistant chat** is a separate, lighter-weight path: same profile payload injected as system context on each turn, retrieval-augmented with knowledge-base lookups when the user asks about a specific career/skill, but allowed to answer in natural language. It is explicitly scoped (declines or redirects clearly off-topic requests) and always cites whether an answer is guidance vs. verified fact.

**Guardrails baked into the architecture, not just the prompt:**
- Opportunity data is *never* LLM-generated — the assistant may only reference rows that exist in `opportunities`.
- Every AI-authored recommendation is tagged `source = "ai_generated"` in the data model, distinct from `verified` (admin-curated facts) and `user_generated` (self-reported), so the UI can visually distinguish them per §18 of the brief.
- Salary/financial figures, when shown at all, are pulled from a labeled, sourced estimate field — never freely generated by the model.

---

## 8. Career Recommendation Methodology

**Career Fit Score**, a weighted composite (weights are a starting hypothesis, tunable post-launch against real outcome data):

| Factor | Weight | Primary data source |
|---|---|---|
| Interest match | 20% | Assessment answers + `user_interests` vs. career tags |
| Skill match | 20% | `user_skills` vs. `career_skills` (required set) |
| Subject match | 15% | `education`/subjects studied vs. career's typical subject pathways |
| Strength match | 15% | Assessment-derived strengths vs. career's core competencies |
| Work-preference match | 10% | Remote/in-person, team/solo, structure preference vs. career norms |
| Goal match | 10% | Stated income/career goals vs. career's realistic trajectory |
| Opportunity relevance | 5% | Density of realistic entry points in the user's country/region |
| Learning feasibility | 5% | Gap size vs. user's available time/resources — penalizes an otherwise "perfect" career that is unrealistic to break into soon |

Each match is returned with the *decomposed* score (not just the total) so the "WHY THIS CAREER MAY FIT YOU" explanation in the UI is generated from real sub-scores, not a post-hoc rationalization. Output is always a ranked list (minimum 5), explicitly framed per §30 of the brief — "law appears to be a strong potential fit," never "you should become a lawyer" — and always surfaces 2–3 adjacent alternatives per top match to avoid funneling users into one path.

---

## 9. Side-Income Recommendation Methodology

Deliberately decoupled from the long-term career match — this answers "what can I do *this month*," not "what should I become." Logic:

1. Filter the `side_opportunities` catalog to those whose required-skill set has meaningful overlap with the user's *current* `user_skills` (including informal/self-rated skills, not just formal ones) and whose tool requirements match the user's stated device/internet access.
2. Score remaining candidates by: skill-fit, tool-fit, and **time-to-first-income** (how fast a beginner can realistically produce a sellable first output) — explicitly weighted higher than long-term earning ceiling, since the goal is momentum and trust, not optimality.
3. For each recommendation, generate (via the AI pipeline, validated against the catalog): why it fits, current vs. missing skills, an estimated time to learn the basics, required tools, a concrete starter project, and how/where to find a first client — using only verified channels (freelance platforms, local business outreach patterns), never a promise of income or a fabricated "guaranteed client."
4. Never state guaranteed earnings; where illustrative figures are shown they are labeled as rough, market-level estimates, not personal promises.

---

## 10. Opportunity Matching Methodology (Phase 5, architecture reserved now)

Strictly database-driven — the AI never invents or paraphrases-into-existence an opportunity. Matching is a two-stage filter:

1. **Hard eligibility filters**: education level, location/remote eligibility, deadline not passed, explicitly stated requirements the user fails to meet are excluded outright (not scored down).
2. **Soft relevance scoring** over the eligible set: skill overlap with the opportunity's stated requirements, career-path relevance (does this opportunity move the user along their chosen roadmap), and recency of the opportunity.

Every match shown includes: match score, the specific reasons it matched, any missing/soft requirements, deadline, and a direct application link with source and verification date — matching the trust rules in §18 of the brief exactly. If confidence in a listing's continued validity is low (e.g., verified long ago, no confirmation source), the UI must say so rather than presenting it as current.

---

## 11. Technical Architecture

```
┌─────────────────────────────┐
│  Next.js (React) — Frontend │  Mobile-first, SSR for marketing/SEO,
│  + API Routes (backend)     │  CSR for authenticated app shell
└───────────────┬─────────────┘
                │
     ┌──────────┼───────────────────────────────┐
     │          │                               │
┌────▼────┐ ┌───▼─────────┐            ┌────────▼────────┐
│PostgreSQL│ │ Auth provider│            │ Claude API       │
│(Prisma   │ │ (managed,    │            │ (structured      │
│ ORM)     │ │  email+pass  │            │  output/tool use)│
└──────────┘ │  first)      │            └───────────────────┘
             └──────────────┘
                │
        ┌───────▼────────┐
        │ Object storage  │  (portfolio images, resumes — Phase 3+)
        │ (S3-compatible) │
        └────────────────┘
```

- **Frontend/Backend**: Single Next.js app — API routes serve as the backend for MVP. This avoids standing up a separate service for a team this size, while keeping route handlers thin enough to extract into a standalone service later if scale demands it.
- **Database**: PostgreSQL, accessed through an ORM (Prisma) for type-safe queries and migration management — matches the brief's requirement for a normalized relational schema.
- **Auth**: A managed auth provider rather than hand-rolled auth (session/password handling is a common source of real-world breaches; not a place to save engineering time).
- **AI**: Claude API, called server-side only (API keys never reach the client), using structured/tool-use output for every generative task described in §7.
- **Storage**: deferred until portfolio/resume upload lands (Phase 3) — reserved in the architecture, not built in MVP.
- **Hosting**: a platform with a generous free/low tier and zero-ops deploys (e.g., Vercel for the app, a managed Postgres provider) — appropriate for a pre-PMF startup; nothing here should require a dedicated ops hire.

---

## 12. API Structure

Grouped by domain, REST-style (Next.js route handlers). Representative, not exhaustive:

```
POST   /api/auth/register            /api/auth/login          /api/auth/logout
GET    /api/profile                  PATCH  /api/profile       DELETE /api/profile
GET    /api/onboarding/step          POST   /api/onboarding/step

POST   /api/assessment/start
POST   /api/assessment/answer
POST   /api/assessment/submit         → triggers recommendation pipeline

GET    /api/matches                   (career_matches for current user)
GET    /api/careers/:slug             (public career profile)
GET    /api/careers/:slug/plan        (skill gap + roadmap + side-income, authed)

GET    /api/roadmap                   PATCH /api/roadmap/tasks/:id  (mark done)
GET    /api/side-income

POST   /api/assistant/message         GET /api/assistant/history

GET    /api/admin/careers             POST/PATCH/DELETE  (RBAC: admin only)
GET    /api/admin/skills              POST/PATCH/DELETE
GET    /api/admin/analytics
```

All AI-invoking routes (`assessment/submit`, `assistant/message`) are rate-limited per user and run through the validator described in §7 before any write.

---

## 13. Security and Privacy Architecture

- **Authentication**: managed provider, hashed/salted credentials never touched directly, session tokens httpOnly + secure, CSRF protection on state-changing routes.
- **Authorization**: simple RBAC — `user` vs. `admin`; every admin route checked server-side, never trust a client-side role flag.
- **Data minimization**: only fields that materially improve recommendation quality are collected; nothing is collected "for later."
- **Encryption**: TLS in transit everywhere; sensitive fields (nothing beyond normal PII in MVP — no payment data yet) encrypted at rest via the database provider's standard encryption.
- **Minors**: any user in a secondary-school age range is flagged; profile fields default to the minimum necessary, no behavioral marketing, and copy/consent flows are written for a younger reader. If the business later wants to collect anything beyond baseline account data from under-18 users, that requires a parental-consent mechanism before it ships — not assumed here.
- **User control**: profile editing, data export (basic — a JSON dump of their own data is a cheap, high-trust feature), and account deletion (hard delete of personal data; anonymized retention only for aggregate analytics counts) are all self-service from day one.
- **AI disclaimers**: persistent, unavoidable labeling that recommendations are AI-generated guidance, not professional psychological or legal advice — surfaced at the assessment, on every career match, and in the assistant's first message.
- **Rate limiting & abuse prevention** on auth and AI endpoints.
- **Audit log** for admin actions on the knowledge base and user records (who changed what, when) — cheap to add now, expensive to retrofit.

---

## 14. UI/UX Structure

### 14.1 Brand system
- **Primary**: deep green (trust, growth, opportunity)
- **Secondary**: navy (stability, seriousness)
- **Accents**: orange (energy, call-to-action), blue, white (clarity, access)
- **Typography**: a confident, modern sans for headings; a highly legible workhorse sans for body/data-dense screens (assessment, roadmap tables) — never a look that reads as a generic AI-chatbot skin (no purple gradients, no bot avatars, no "typing..." chat-bubble aesthetic as the primary metaphor).
- **Tone**: direct, respectful, never patronizing — copy should read like a sharp, encouraging older sibling who's done this before, not a corporate careers-office pamphlet.

### 14.2 Core patterns
- **Card-based results** for career matches, skill gaps, and side-income options — score, reasoning, and next action always visible without a click.
- **Progress, not points**: meaningful completion bars (Career Discovery, Skill Development, Portfolio, Opportunity Readiness) rather than XP/streak mechanics — matches §20's "do not over-gamify."
- **Trust labeling as a visual system**: a consistent small badge/label style distinguishing Verified / AI-Guidance / Estimate / User-Provided wherever those appear together on a screen.

### 14.3 Navigation
Mobile-first bottom nav on the authenticated app (Dashboard / Matches / Roadmap / Assistant / Profile); marketing site uses a conventional top nav.

### 14.4 Low-bandwidth / low-device mode
Since this is a stated design constraint (§17, §33 of the brief), MVP UI must: keep initial payload small, lazy-load non-critical images, degrade to text-first layouts rather than failing, and avoid patterns (heavy client-side chat animations, large hero video) that assume fast, unmetered connections. This also lays the groundwork for a future WhatsApp-based interface (§33) without redesigning the core data/response model later.

---

## 15. Development Roadmap

| Phase | Scope | Indicative duration |
|---|---|---|
| **Phase 1 — Foundation** | Landing page, auth, progressive profile, self-discovery assessment | 3–4 weeks |
| **Phase 2 — Career Engine** | Career knowledge base + admin CRUD, recommendation engine, career exploration pages, skill-gap analysis | 4–5 weeks |
| **Phase 3 — Action** | Roadmaps, learning resource recommendations, side-income engine, progress tracking/dashboard | 3–4 weeks |
| **Phase 4 — AI Assistant** | Conversational assistant, profile-aware context, assistant history | 2 weeks |
| **Phase 5 — Opportunity Engine** | Opportunity database, admin verification workflow, matching | 4 weeks (post-MVP) |
| **Phase 6 — Growth** | Portfolio builder, CV assistance, mentorship/employer matching | Post-MVP, scoped later |

Phases 1–4 constitute the MVP (§2). Phase 5–6 begin only after MVP validation.

---

## 16. Estimated Development Complexity per Module

| Module | Complexity | Why |
|---|---|---|
| Landing page | Low | Static/SSR marketing content |
| Auth + profile | Low–Medium | Managed provider handles the hard parts; progressive-onboarding UX takes real design care |
| Self-discovery assessment | Medium | Content design (question set) matters as much as the build; needs careful, non-clinical framing |
| Career knowledge base + admin CRUD | Medium | Must exist and be populated *before* the recommendation engine has anything to recommend — this is the real critical-path item, not the AI call itself |
| Recommendation engine (career match) | Medium–High | Structured-output AI pipeline, scoring transparency, validation against the knowledge base |
| Career exploration pages | Low–Medium | Mostly a template over knowledge-base data |
| Skill-gap analysis | Medium | Depends on clean skills catalog + career_skills mapping |
| 90-day roadmap generator | Medium–High | Needs to genuinely adapt to time/device/skill inputs, not template-fill |
| Side-income engine | Medium | Similar shape to career matching but a separate catalog and scoring bias (speed-to-income) |
| AI assistant | Medium | Retrieval + profile context; the hard part is scoping and guardrails, not the chat UI |
| Dashboard | Low–Medium | Aggregation view over already-built data |
| Admin console (MVP-minimal) | Medium | Needed to operate the knowledge base; keep deliberately thin at first |
| Opportunity engine (Phase 5) | High | Sourcing + verification workflow is an ongoing content-operations problem, not just engineering |
| Portfolio builder (Phase 6) | Medium | File storage + simple CRUD, low algorithmic complexity |

---

## 17. Recommended Technology Stack

| Layer | Choice | Reasoning |
|---|---|---|
| Frontend | Next.js (React) | SSR for SEO on marketing/content pages, CSR for the app; one framework for both, matches the brief |
| Backend | Next.js API routes | Avoids a second service to operate/deploy for MVP team size; extractable later if needed |
| Database | PostgreSQL | Relational integrity for a genuinely relational domain (users, skills, careers, matches all reference each other); mature, well-understood, cheap to host managed |
| ORM | Prisma | Type-safe schema-as-code, migrations, pairs naturally with Next.js/TypeScript |
| Auth | Managed auth provider | Security-critical surface area not worth hand-rolling; faster to ship correctly |
| AI | Claude API (Anthropic), structured/tool-use output | Strong structured-output reliability and reasoning quality needed for transparent, explainable scoring — not free-text generation |
| Storage | S3-compatible object storage | Standard, portable choice for portfolio/resume assets, deferred to Phase 3 |
| Hosting | Vercel (app) + managed Postgres provider | Zero-ops deploys, generous free tier appropriate for pre-PMF stage, scales without a re-platform |
| Language | TypeScript end-to-end | Shared types between frontend/backend/schema reduce a whole class of integration bugs |

---

## 18. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Empty/thin career knowledge base at launch | Recommendation engine has nothing credible to recommend | Treat knowledge-base population (curated careers + skills for the Cameroon context) as a *launch blocker*, not a parallel content task — build the admin CRUD early enough to seed real data before user testing |
| AI hallucinating opportunities, salaries, or institutions | Directly breaks the platform's core trust promise (§18 of brief) | Architectural guardrail, not a prompt instruction: opportunities/resources are DB rows the AI can only reference, never author; structured-output validation rejects unrecognized entities before persistence |
| Users perceive it as "just another career quiz" | Low retention, low perceived value | Side-income engine ships in MVP specifically to give action within the first session, not just a personality-test-style report |
| Over-collecting personal data, especially from minors | Trust and legal/reputational risk | Data-minimization by design (§13); minor-specific defaults; no data collected "for later" |
| Low-bandwidth/low-device users excluded in practice | Excludes a large share of the actual target market | Performance and low-bandwidth UX are launch requirements, not a post-launch optimization pass (§14.4) |
| Career advice that reads as US/Europe-centric | Undermines the core "built for young Africans" positioning | Career pathways, subjects, and side-income options are curated per-market starting with Cameroon; no career profile ships without local pathway/opportunity context |
| Scope creep toward the full opportunity marketplace before MVP validates | Delays the core value loop the product actually needs to prove first | Opportunity engine is explicitly Phase 5, schema reserved but not built, per §19 |
| AI cost scaling unpredictably with usage | Margin/runway risk as user base grows | Recommendations are computed once and persisted (not regenerated per page view); rate limits on AI-invoking endpoints |

---

## 19. What Should NOT Be Built in the MVP

- Full opportunity marketplace/feed and opportunity matching (Phase 5) — schema reserved, not implemented.
- Portfolio builder, AI CV builder, AI interview coach, LinkedIn optimizer (Phase 6).
- Mentorship matching, employer matching, career communities.
- WhatsApp/low-bandwidth messaging interface — architecture should not preclude it later, but it is not built now.
- Multilingual support beyond the initial launch language — architecture (content model with a `locale` field) should not block it later.
- Heavy gamification (badges beyond a small, meaningful set; streaks; leaderboards).
- Payment/premium tier infrastructure — free tier only until product-market fit is demonstrated (§39 of the brief is explicit on this).
- B2B/institutional dashboards (schools/universities/NGOs).
- Voice-based guidance, mobile native app — web, mobile-first, is the MVP surface.

---

## 20. Step-by-Step Implementation Plan (once approved)

1. Stand up the Next.js + TypeScript + Prisma + PostgreSQL project skeleton and CI basics.
2. Implement auth (managed provider) and the `users`/`profiles` schema; ship registration/login.
3. Build the progressive onboarding flow against `profiles`/`education`/`user_skills`/`user_interests`.
4. Design and implement the self-discovery assessment (content + `assessments`/`assessment_answers` schema + UI).
5. **Populate the career knowledge base** (`career_profiles`, `career_skills`, `skills`, `learning_resources`) for an initial curated set of careers relevant to the Cameroon context, via the admin CRUD built alongside it — this is the pacing item for everything after it.
6. Build the AI recommendation pipeline (§7): profile compiler → prompt orchestrator → structured Claude call → validator → persistence into `career_matches`.
7. Build the Top-5-matches UI and individual career exploration pages.
8. Build skill-gap analysis and the roadmap generator (`skill_gaps`, `roadmaps`, `roadmap_tasks`), reusing the same validated-AI-pipeline pattern.
9. Populate the side-income catalog (`side_opportunities`) and build its scoring/recommendation flow (`side_income_matches`).
10. Build the AI assistant (chat UI, `ai_conversations`/`ai_messages`, retrieval-augmented profile-aware responses, scoped guardrails).
11. Build the dashboard as an aggregation layer over everything above.
12. Apply the security/privacy baseline end-to-end (§13): data export, account deletion, minor-safeguarding defaults, rate limiting, audit log on admin actions.
13. Performance/low-bandwidth pass across the core flows (§14.4).
14. Closed pilot with a small real cohort in Cameroon; instrument the meaningful-action metrics from §35 of the brief (skills started, projects completed, applications submitted) rather than vanity engagement metrics.
15. **Stop. Review pilot data and this plan against reality before starting Phase 5 (Opportunity Engine) or Phase 6 (Growth).**

---

**3DOORS — ACCESS. EXCELLENCE. OPPORTUNITY.**

Awaiting approval before implementation begins.
