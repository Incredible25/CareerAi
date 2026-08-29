# 3Doors

**ACCESS. EXCELLENCE. OPPORTUNITY.**

An AI-powered career discovery, planning, and opportunity navigation platform for students, graduates, and young professionals in Africa, starting in Cameroon.

The full product and technical strategy — PRD, personas, user journeys, database schema, AI architecture, and roadmap — lives in [`docs/PRODUCT_STRATEGY.md`](./docs/PRODUCT_STRATEGY.md).

## Status

**Phase 1 — Foundation** is in progress: landing page, authentication, progressive profile, and the self-discovery assessment. See the phase breakdown in the strategy doc (§15) for what comes next.

## Getting started

Requirements: Node 20+, a PostgreSQL database.

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and NEXTAUTH_SECRET
npx prisma migrate dev
npm run prisma:seed-all # loads skills/interests, careers, side-income, and career<->side-income links
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript project check |
| `npm run prisma:migrate` | Create/apply a local migration |
| `npm run prisma:seed-all` | Seed skills/interests, careers, side-income paths, and their cross-links, in order |

## Architecture at a glance

Next.js (App Router, TypeScript) + PostgreSQL via Prisma + NextAuth (credentials) + Tailwind CSS. Full reasoning for each choice is in `docs/PRODUCT_STRATEGY.md` §11 and §17.
