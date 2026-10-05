# N5Deal Marketplace Prototype

A working full-stack marketplace prototype for **M&A opportunities and financial assets**, inspired by [N5Deal](https://n5deal.com/all-listing).

Built as a technical selection assignment: focused product scope, persistent data, three roles, and a deployable Next.js app — not a production clone.

## Quick start

```bash
npm install
cp .env.example .env
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo accounts

Password for all seeded users: `demo1234`

| Role | Email | One-click on `/login` |
|------|-------|------------------------|
| Buyer | `buyer@n5deal.demo` | Elena Voss |
| Seller | `seller@n5deal.demo` | Viktor Radek |
| Platform Manager | `manager@n5deal.demo` | Alex Morgan |

Additional buyers/sellers are seeded for richer browse/filter demos.

## What you can evaluate

### Buyer
- Maintain acquisition mandate (categories, jurisdictions, budget, interests)
- Browse / filter / AI-search assets
- See AI match scores against their profile
- Contact sellers about a listing

### Seller
- Publish assets (with AI validation hints)
- Browse / filter / AI-search buyers
- See suggested buyers ranked against inventory
- Contact buyers

### Platform Manager
- Search buyers, sellers, and assets
- Suspend / reinstate participants
- Remove participants
- Suspend or republish assets

## Architecture & key decisions

| Decision | Why |
|----------|-----|
| **Next.js App Router + TypeScript** | Required stack; Server Components for read-heavy marketplace pages, Server Actions for mutations |
| **JSON file store (`data/store.json`)** | Real persistent data model without external DB credentials; works locally and on Vercel (copied to `/tmp` at runtime). Easy to inspect and reset |
| **Cookie JWT sessions (`jose`)** | Lightweight auth suitable for a demo; suspended users lose access on next request |
| **Role-gated routes + action checks** | UX shortcuts in nav, hard checks in Server Actions |
| **Heuristic AI matching / smart filters** | Deterministic, no API key, easy to demo. Scores category, jurisdiction, budget fit, and interest keywords. NL query parser extracts filters like “EMI in Lithuania under €3m” |
| **Dark fintech visual language** | Aligned with N5Deal’s professional M&A tone (navy surfaces, teal accent, Syne + Manrope) without a 1:1 copy |

### Data model

- `User` (BUYER / SELLER / MANAGER) + status
- `BuyerProfile` — mandate / budget / preferences
- `SellerProfile` — operator bio
- `Asset` — structured listing (category, jurisdiction, license, price, readiness, status)
- `Message` — buyer↔seller contact tied optionally to an asset

## Assumptions

1. Contact = in-app messaging (not email/SMS). Enough to prove the flow.
2. “Remove participant” is a hard delete for demo clarity; production would soft-delete + audit log.
3. Public asset browsing is allowed; contacting requires sign-in as the correct role.
4. AI features are rule-based (explainable scores), not LLM calls — reliability over novelty for a time-boxed assignment.
5. On Vercel, mutations persist for the life of a warm serverless instance; cold starts reload from the seeded `data/store.json`. Locally, writes persist to disk across refresh and restarts.

## AI tools used

- **Cursor / Composer** — scaffolding, iterative implementation, refactoring
- Manual product decisions on scope, UX, and architecture remained human-owned

## Tests

```bash
npm test
```

Covers smart-query parsing, match scoring, and asset draft validation.

## Live demo

- **Temporary Vercel deployment:** https://temporary-swift-saffron-gppsa4v.vercel.app  
  Claim to keep it permanent: https://vercel.com/claim-deployment?code=ba90db03-7ffc-430b-b798-e0cbf0cc6651
- **Source:** https://github.com/ShnayderL/n5deal-marketplace-prototype  
- **PR with full implementation:** https://github.com/ShnayderL/n5deal-marketplace-prototype/pull/1

> The anonymous Vercel preview expires unless claimed. For a durable production URL, claim the deployment or import the GitHub repo into your Vercel account (`AUTH_SECRET` required).

## Deploy

```bash
npm run build
npx vercel --prod
```

Set `AUTH_SECRET` in the host environment.

## With more time I would

- Move to Postgres (Neon/Supabase) for durable multi-instance persistence
- Add NDA / deal-room stages and document upload
- Real LLM assist for mandate drafting and listing copy (with human confirmation)
- Playwright e2e for the three role journeys
- i18n (EN/UK) and stronger verification workflows
- Proper audit log for manager actions

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Seed store (if needed) + local development |
| `npm run build` | Seed store + production build |
| `npm run db:reset` | Force-reseed demo data |
| `npm test` | Unit tests |
