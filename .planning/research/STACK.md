# Technology Stack

**Project:** Digital Marketplace — Licenses, Game Accounts, Gift Cards
**Researched:** 2026-05-02
**Context:** Brownfield — Next.js 14 App Router codebase already partially built. Stack extends what exists, not replaces it.

---

## Current State (What Already Exists)

The codebase already has a working implementation for:

| Layer | Installed & Used | Notes |
|-------|-----------------|-------|
| Framework | Next.js 14.2.5 (App Router) | Keep. App Router is correct for this project. |
| Styling | Tailwind CSS 3.4 + shadcn/ui (Radix-based) | Keep. Component library is already wired. |
| Database | PostgreSQL + Prisma 5.17 | Keep. Schema is comprehensive and correct. |
| Auth (admin) | NextAuth 4.24 (credentials) | Keep for admin panel only. |
| Auth (users) | Custom JWT via `jsonwebtoken` 9.0 | Keep. Already in `services/auth.service.ts`. |
| i18n | next-intl 3.17 | Keep. Will trim to AR + EN. |
| Payment (Iraqi) | Custom integration in `lib/payment/gateway.ts` | Stub needs real gateway wiring. |
| Payment (intl) | Stripe 22.x (`@stripe/stripe-js` 9.x) | Already installed, needs front-end integration. |
| Email | Resend 3.4 | Keep. |
| Real-time | Pusher 5.3 / pusher-js 8.5 | Installed but unused — chat currently polls. Wire Pusher. |
| File storage | `@vercel/blob` 2.3 | Already installed for product image uploads. |
| Validation | Zod 3.23 | Keep throughout. |
| Caching | `redis` 5.12 | Installed. Use for rate limiting and session caching. |

---

## Recommended Stack (Full)

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | 14.2.5 (existing) | Full-stack framework | App Router enables co-located API routes, server components reduce client JS, streaming improves perceived performance on slow connections (target: Iraqi users). |
| React | 18.3 (existing) | UI runtime | Server Components default; `"use client"` only for interactive islands (forms, chat, wallet). |
| TypeScript | 5.5 (existing) | Type safety | Already in use. Strict mode enforced throughout services. |

### Authentication

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Custom JWT (`jsonwebtoken`) | 9.0 (existing) | Buyer/seller auth | Already implemented in `auth.service.ts` with register/login/token. Clean, no external dependency. Do NOT replace with NextAuth for regular users — NextAuth session model conflicts with the custom role system (BUYER/SELLER/ADMIN on the same User model). |
| NextAuth.js | 4.24 (existing) | Admin panel only | Retained only for `/admin` routes. Isolated from user auth. |
| bcryptjs | 2.4 (existing) | Password hashing | Keep. 12 rounds used in `auth.service.ts`. |

**Decision: Do NOT migrate to NextAuth for all users.** The dual-auth approach (JWT cookie `mp_token` for users, NextAuth session for admins) is already working and the right separation. Unifying them would require schema changes and session adapter complexity with no benefit.

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 15+ | Primary store | All transactional data — orders, wallets, escrow, disputes. ACID required for wallet operations. |
| Prisma | 5.17 (existing) | ORM | Schema is already correct and comprehensive. `$transaction` used throughout escrow/wallet services. |

**No secondary database needed for v1.** Redis is present for caching/rate limiting only, not as a primary store.

### Payments

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Iraqi gateway (ZainCash / FIB) | custom | Primary payment for local buyers | Already stubbed in `lib/payment/gateway.ts`. Wire the real gateway. Keep all logic in `lib/payment/`. |
| Stripe | 22.x (existing) | International card payments | Already installed. Use Stripe Payment Intents with webhooks. Stripe covers cards, Apple Pay, Google Pay for diaspora buyers. |

**Do NOT add PayPal.** Stripe covers the international use case. PayPal adds SDK weight, has worse webhook reliability, and is blocked in Iraq anyway. Defer crypto to v2 per PROJECT.md.

**Wallet top-up flow:** Both gateways write to the user wallet via `walletService.credit()` after payment confirmation. The wallet is the universal internal ledger.

### File Storage

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel Blob | 2.3 (existing) | Product images, seller assets | Already installed. Simple CDN-backed object storage. No infra to manage. Upload via `/api/admin/upload` route. |

**Constraint:** Vercel Blob is tied to Vercel hosting. If self-hosting on a VPS, swap to Cloudflare R2 (same S3 API, cheaper egress, free 10GB). No code changes required — just swap the client. Mark this as a deployment-time decision.

### Email

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Resend | 3.4 (existing) | Transactional email | Order confirmations, key delivery, dispute notices. Resend has a generous free tier (3K/month), React Email template support, and reliable delivery. |

**Templates needed:** order confirmation (instant delivery), manual delivery pending, dispute opened, dispute resolved, withdrawal processed.

### Real-Time (Chat + Notifications)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Pusher Channels | 5.3 server / 8.5 client (existing) | Live chat, delivery notifications, dispute updates | Already installed and correctly chosen. The chat component (`ChatWindow.tsx`) currently polls every 5 seconds — this must be replaced with Pusher subscriptions. |

**Pusher setup required:**
- Channel naming: `private-order-{orderId}` for order chat
- Channel naming: `private-user-{userId}` for personal notifications
- Authenticate subscriptions via `/api/pusher/auth` route (POST, requires JWT)
- Events: `new-message`, `order-status-changed`, `notification`

**Why Pusher over raw WebSockets:** Next.js App Router does not support persistent WebSocket connections on serverless. Pusher provides managed WebSocket infrastructure compatible with Vercel/serverless deployments. The free Spark tier covers 200k messages/day — sufficient for v1.

**Why not Server-Sent Events (SSE):** SSE is unidirectional and requires connection management. Pusher's bidirectional channels are cleaner for the chat use case.

### Caching / Rate Limiting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Redis (Upstash) | `redis` 5.12 (existing) | Rate limiting on auth endpoints, optional session cache | Use Upstash Redis (HTTP-based, serverless compatible). Protect `/api/auth/login`, `/api/auth/register`, `/api/orders` from abuse. 10K commands/day free. |

**Rate limit targets:**
- Login: 5 attempts / 15 minutes per IP
- Register: 3 per IP per hour
- Order creation: 10 per user per hour

### Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zod | 3.23 (existing) | Input validation on all API routes | Already used in `lib/validations.ts`. Keep consistent. Zod schemas double as TypeScript types via `z.infer<>`. |

### Search

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL full-text search (Prisma raw queries) | — | Product search by title, category, seller | For v1, Postgres `tsvector` + `tsquery` is sufficient. No external search service needed until product count exceeds ~50K rows. Add `@@index` on `title` and `categoryId`. |

**Defer Algolia/Typesense to v2.** The added infra cost and sync complexity are not justified at v1 scale. A single `ILIKE` or `to_tsvector` query on 1K-10K products is fast enough.

### Image Handling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js Image (`next/image`) | built-in | Optimized product image rendering | Automatic WebP conversion, lazy loading, responsive sizes. Use `remotePatterns` in `next.config` to allow Vercel Blob domain. |

### Form Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React built-in state + Zod | — | Forms | For a marketplace this size, a heavyweight form library (react-hook-form, Formik) adds more complexity than value when Zod + controlled inputs already work. If forms get complex (multi-step seller onboarding), add `react-hook-form` 7.x + `@hookform/resolvers` at that point only. |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `lucide-react` | 0.414 (existing) | Icons | Already used throughout. Keep. |
| `class-variance-authority` + `clsx` + `tailwind-merge` | existing | Tailwind class composition | Keep. Standard shadcn/ui pattern. |
| `next-themes` | 0.4 (existing) | Dark/light mode | Already installed. Optional for v1 but costs nothing to keep. |
| `date-fns` | — | Date formatting in UI | Add when needed for "ordered 3 days ago" style displays. Lighter than `dayjs`. |

---

## Alternatives Considered and Rejected

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Auth | Custom JWT + NextAuth (admin only) | Full NextAuth for all users | NextAuth v4 session model doesn't cleanly support BUYER/SELLER/ADMIN on one table without adapter complexity. The custom JWT auth is already working. |
| Auth | Custom JWT | Clerk / Auth0 | SaaS auth adds per-MAU cost, RTL/Arabic UI customization is limited in hosted auth UIs, and the existing auth service is already feature-complete. |
| Real-time | Pusher | Ably | Same category, Pusher is already installed and has better free tier. |
| Real-time | Pusher | Socket.io self-hosted | Requires a persistent Node process — incompatible with Vercel/serverless. |
| Search | Postgres FTS | Algolia | Overkill for v1. Algolia adds $50+/month and sync complexity. |
| Payments | Stripe | PayPal | PayPal has worse DX, blocked in Iraq, and Stripe covers the same international use case. |
| Storage | Vercel Blob | AWS S3 | Vercel Blob is already integrated. S3 adds IAM/credentials complexity. Swap to Cloudflare R2 only if moving off Vercel. |
| ORM | Prisma | Drizzle | Prisma is already in use with a comprehensive schema. Migration risk is not justified. Drizzle is faster for simple queries but the difference is irrelevant at v1 scale. |
| Email | Resend | Nodemailer | Resend provides reliable delivery infrastructure. Nodemailer requires a configured SMTP provider and has no template system. |

---

## Installation — What to Add

The following are not yet installed and should be added:

```bash
# Rate limiting helper (Upstash Redis client is HTTP-based, serverless compatible)
npm install @upstash/ratelimit @upstash/redis

# Date formatting (add when needed)
npm install date-fns
```

Everything else is already in `package.json`.

---

## Environment Variables Required

```env
# Existing
DATABASE_URL=
NEXTAUTH_SECRET=
PAYMENT_GATEWAY_SECRET=
PAYMENT_GATEWAY_API_URL=
PAYMENT_GATEWAY_MERCHANT_ID=
RESEND_API_KEY=
JWT_SECRET=
JWT_EXPIRES_IN=7d
COMMISSION_RATE=0.10
BLOB_READ_WRITE_TOKEN=         # Vercel Blob

# Add
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
UPSTASH_REDIS_REST_URL=        # Rate limiting
UPSTASH_REDIS_REST_TOKEN=
```

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Core framework | HIGH | Existing code confirms choices. Next.js 14 App Router is the right call. |
| Auth architecture | HIGH | Dual-auth (JWT + NextAuth admin) is already implemented and working. |
| Payments | HIGH | Both Stripe and Iraqi gateway are already installed. |
| Real-time (Pusher) | HIGH | Already installed; polling in ChatWindow confirms Pusher is the intended next step. |
| Search | MEDIUM | Postgres FTS recommendation based on scale assumptions. Validate at Phase 3 if seller count grows faster than expected. |
| Rate limiting | MEDIUM | Upstash recommended over raw Redis for serverless compatibility. Verify deployment target (Vercel vs VPS) before implementation. |

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Keep dual-auth (JWT + NextAuth) | Auth service already written. Unifying would break admin session. |
| Wire Pusher (stop polling) | Chat polling at 5s is wasteful and laggy. Pusher upgrade is low effort — library already installed. |
| Postgres FTS for search | v1 product catalog is small (< 10K). External search adds infra cost before it's needed. |
| Wallet as universal internal ledger | Both Iraqi gateway and Stripe credits the wallet. Clean separation between payment rails and purchase flow. |
| Escrow via `pendingBalance` | Existing `escrow.service.ts` correctly holds funds in `pendingBalance` (platform-controlled) until delivery confirmed. Do not change this pattern. |

---

## Sources

- Codebase analysis: `package.json`, `prisma/schema.prisma`, `services/`, `lib/auth-middleware.ts`, `components/chat/ChatWindow.tsx`
- Pusher serverless compatibility: Pusher Channels supports serverless via HTTP API calls from server routes (no persistent connection needed server-side)
- Vercel Blob docs: `@vercel/blob` 2.x supports `put()`, `del()`, `list()` from server routes
- Stripe: version 22.x confirmed in `package.json`; Payment Intents API is the correct integration pattern for marketplace flows
