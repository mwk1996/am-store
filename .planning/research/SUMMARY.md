# Research Summary — Digital License & Game Account Marketplace

**Synthesized:** 2026-05-02
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Executive Summary

This is a brownfield project. A Next.js 14 App Router codebase already exists with a working single-seller license store (guest checkout, Iraqi payment gateway, admin panel). The goal is to evolve it into an open multi-seller marketplace supporting software licenses (instant delivery) and game accounts (manual delivery) for Arabic/English-speaking buyers.

The core architecture — Prisma schema, service layer (escrow, wallet, key, order), auth split — is largely correct and ahead of the UI. The primary work is wiring auth + route protection for buyers/sellers, building marketplace UI, completing delivery flows, and adding trust mechanisms.

**Two financial bugs must be fixed before any transaction flow ships:**
1. Key assignment is non-atomic → needs `SELECT FOR UPDATE SKIP LOCKED`
2. Wallet deduction is a read-then-write without a lock → needs single atomic `UPDATE ... WHERE balance >= amount`

The market gap is real: no major platform (G2A, Kinguin, Eneba) serves Iraqi/Arabic buyers well. Arabic-first UX + Iraqi payment + dispute resolution is the differentiation.

---

## Recommended Stack

| Technology | Decision | Rationale |
|------------|----------|-----------|
| Next.js 14 App Router | Keep | Existing code throughout |
| Custom JWT (`jsonwebtoken`) | Keep for buyers/sellers | Already implemented, correct role system |
| NextAuth.js | Keep for admin only | Isolated to `/admin`, dual-auth split is correct |
| PostgreSQL + Prisma | Keep | Schema is comprehensive and correct |
| Pusher (installed, unwired) | Wire it | `ChatWindow.tsx` polls every 5s — stop polling |
| Stripe (installed, unwired) | Wire Payment Intents + webhook | Already in package.json |
| Iraqi gateway | Wire real credentials | `lib/payment/gateway.ts` is stubbed |
| `@upstash/ratelimit` | Add | Rate limit auth endpoints (serverless-safe) |
| Postgres FTS | Use for search v1 | No Algolia needed until 50K+ products |

**Avoid:** PayPal (blocked in Iraq), Socket.io self-hosted (incompatible with serverless), Algolia (overkill), Clerk/Auth0 (per-MAU cost, limited RTL).

---

## Table Stakes Features for v1

**Buyer:** Account registration + login, product search with filters, delivery type indicator on every listing, purchase via wallet or direct payment, instant key reveal on-screen + email, manual delivery status tracking, order history, dispute/refund request, seller reviews, RTL Arabic UI.

**Seller:** Self-service registration (auto-approved), product listing creation, bulk key upload (CSV), stock management, order management dashboard, manual delivery UI (paste credentials), earnings dashboard, payout request, new-order notifications.

**Platform:** Wallet/balance system, commission deduction, admin moderation, dispute resolution, category taxonomy, key security (only revealed post-payment).

---

## Key Architectural Decisions

**Already made (do not change):**
- Dual-auth: JWT for buyers/sellers, NextAuth for admin
- Wallet escrow via `pendingBalance` — correct simplification for v1
- Prisma `$transaction` throughout wallet/escrow/key services
- `order.status` as ground truth — never block status on email success

**Open (need schema migration before shipping):**
- Add `deliveryType INSTANT/MANUAL` enum to Product
- Add `confirmDeadline DateTime?` to Order (for cron sweep)
- Add key encryption in `key.service.ts`
- Add `gatewayRef` to Transaction (idempotent top-up callbacks)
- Migrate `AdminUser` references to `User` with `role: ADMIN`

---

## Top 5 Pitfalls

| # | Pitfall | Consequence | Prevention | Phase |
|---|---------|-------------|------------|-------|
| 1 | Key assignment race condition | Duplicate key delivery, refund liability | `SELECT FOR UPDATE SKIP LOCKED` | Phase 3 |
| 2 | Wallet double-spend | Negative balance, real financial loss | Atomic UPDATE + `CHECK (balance >= 0)` | Phase 4 |
| 3 | Game account takeback | Chargebacks weeks later | 14–30 day dispute window + seller checklist | Phase 3 |
| 4 | Delivery window expiry without auto-action | External chargebacks instead of platform disputes | Vercel Cron sweep auto-refunding expired orders | Phase 3 |
| 5 | Wallet refund laundering / self-dealing | Direct financial loss | Hold period + self-dealing detection | Phase 4 |

---

## Suggested Phase Build Order

**Phase 1 — Auth & User Accounts**
Everything depends on authenticated users. Buyer + seller registration/login, JWT route protection, wallet creation on registration, AdminUser → User ADMIN migration.

**Phase 2 — Marketplace Browsing & Seller Listings**
Sellers list before buyers purchase. Public marketplace with search/filters, seller product CRUD, bulk key upload, product detail pages.

**Phase 3 — Purchase & Delivery Flow**
Core transaction loop. Order creation + escrow, instant key delivery (atomic), manual delivery with seller credential post, buyer confirmation, auto-confirm cron sweep.

**Phase 4 — Wallet & Payments**
Wallet top-up via Iraqi gateway + Stripe, transaction history, seller withdrawal requests, admin approval. Atomic deduction + hold periods.

**Phase 5 — Trust Layer**
Buyer reviews, dispute flow, verified seller badge, graduated payout holds for new sellers.

**Phase 6 — Real-Time Chat & Notifications**
Pusher per-order chat, notification bell, `/api/pusher/auth`, contact-info scanning.

**Phase 7 — Admin Panel & Seller Analytics**
Full admin dashboard, seller analytics, featured listings.

---

## Open Questions (Need Product Owner Input)

1. Which Iraqi gateway specifically — ZainCash, FIB, or other?
2. Manual delivery SLA window — 12h or 24h? Dispute window for keys vs accounts — 3 days or 14 days?
3. Withdrawal threshold that triggers identity verification?
4. Commission rate — is 10% (current `COMMISSION_RATE=0.10`) the launch rate?
5. Payout method for sellers — ZainCash transfer, bank transfer, FIB?
