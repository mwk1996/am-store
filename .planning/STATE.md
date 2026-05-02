# STATE — Digital License & Game Account Marketplace

**Last updated:** 2026-05-02
**Session:** Roadmap initialized

---

## Project Reference

**Core value:** A trusted, fast marketplace where buyers get their digital goods reliably and sellers can reach customers — with transparent listings, secure payment, and a simple refund path when things go wrong.

**Target users:** Arabic/English-speaking buyers wanting cheap, fast digital goods; individual sellers and small shops listing digital inventory.

**Stack:** Next.js 14 App Router, Tailwind + shadcn/ui, PostgreSQL + Prisma, JWT (buyers/sellers) + NextAuth (admin), next-intl (AR + EN), Iraqi payment gateway + Stripe, Resend/Nodemailer.

---

## Current Position

**Current phase:** Not started
**Current plan:** None
**Status:** Roadmap created — awaiting phase planning

```
Progress: [░░░░░░░░░░░░░░░░░░░░] 0% — Phase 1 of 7 not started
```

---

## Phase Status

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| 1 — Auth & User Accounts | Not started | - | - |
| 2 — Marketplace Browsing & Listings | Not started | - | - |
| 3 — Purchase & Delivery | Not started | - | - |
| 4 — Wallet & Payments | Not started | - | - |
| 5 — Trust Layer | Not started | - | - |
| 6 — Chat & Notifications | Not started | - | - |
| 7 — Admin Panel | Not started | - | - |

---

## Accumulated Context

### Key Decisions Made

| Decision | Rationale |
|----------|-----------|
| Required buyer accounts (no guest checkout) | Needed for order history, refunds, trust traceability |
| Dual-auth: JWT for buyers/sellers, NextAuth for admin | Already implemented correctly — do not change |
| Instant + manual delivery modes | Keys = instant reveal; game accounts = seller posts credentials |
| Iraqi + Stripe payment support | Serves local (ZainCash/FIB) and diaspora (Stripe) buyers |
| AR + EN only for v1 | Reduces i18n surface area — TR/KU deferred |
| Wallet-hold escrow model | Simpler than full escrow; correct for v1 |
| Prisma `$transaction` throughout wallet/escrow/key services | Already in place — keep it |

### Critical Implementation Notes

1. **Key assignment race condition** — Must use `SELECT FOR UPDATE SKIP LOCKED` before Phase 3 ships. Duplicate key delivery = refund liability.
2. **Wallet double-spend** — Must use atomic `UPDATE wallet SET balance = balance - amount WHERE balance >= amount`. Read-then-write without lock = negative balance possible.
3. **AdminUser migration** — Legacy `AdminUser` table in schema must be migrated to `User` with `role: ADMIN`. Plan this in Phase 1.
4. **Delivery auto-confirm cron** — Phase 3 needs a Vercel Cron job sweeping orders past `confirmDeadline` — without this, expired orders pile up.
5. **Key encryption** — `SEC-02` requires keys encrypted at rest. `keyValue` column in `ProductKey` has comment "stored encrypted" but encryption implementation must be verified/added in Phase 2.

### Schema Gaps (Need Migration Before Shipping)

- `Product` missing `deliveryType INSTANT/MANUAL` enum field
- `Order` missing `confirmDeadline DateTime?` (for cron sweep)
- `Transaction` missing `gatewayRef` (idempotent top-up callbacks)
- `Product` missing `isFeatured Boolean` (LISTING-04)
- `User` missing `emailVerified Boolean` / `verificationToken` (AUTH-03)
- `User` missing `isVerifiedSeller Boolean` and `isSuspended Boolean` (TRUST-04, ADMIN-02)
- `User` missing `listingCount` or capped via query (SEC-05)

### Open Questions (Need Product Owner Input)

1. Which Iraqi gateway specifically — ZainCash, FIB, or other?
2. Manual delivery SLA window — 12h or 24h?
3. Dispute window for keys vs accounts — 3 days or 14 days?
4. Commission rate — 10% confirmed for launch?
5. Payout method for sellers — ZainCash transfer, bank transfer, or FIB?
6. Withdrawal identity verification threshold amount?

### Todos

- [ ] Answer open gateway/payment questions before Phase 4 planning
- [ ] Confirm manual delivery SLA before Phase 3 planning
- [ ] Decide commission rate before Phase 3 planning

### Blockers

None currently.

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Requirements defined | 47 |
| Requirements mapped | 47 |
| Phases planned | 7 |
| Plans created | 0 |
| Plans completed | 0 |

---

## Session Continuity

To resume work:
1. Read `.planning/ROADMAP.md` for phase structure and success criteria
2. Read `.planning/REQUIREMENTS.md` for full requirement list and traceability
3. Read `.planning/research/SUMMARY.md` for architectural decisions and pitfalls
4. Run `/gsd-plan-phase 1` to begin Phase 1 planning

---
*Next action: `/gsd-plan-phase 1` — Auth & User Accounts*
