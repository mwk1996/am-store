---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
current_phase: Phase 3 — Purchase & Delivery
current_plan: None — awaiting planning
status: completed
last_updated: "2026-05-03T17:09:31.819Z"
progress:
  total_phases: 7
  completed_phases: 1
  total_plans: 22
  completed_plans: 14
  percent: 64
---

# STATE — Digital License & Game Account Marketplace

**Last updated:** 2026-05-03
**Session:** Phase 3 plan 03 complete

---

## Project Reference

**Core value:** A trusted, fast marketplace where buyers get their digital goods reliably and sellers can reach customers — with transparent listings, secure payment, and a simple refund path when things go wrong.

**Target users:** Arabic/English-speaking buyers wanting cheap, fast digital goods; individual sellers and small shops listing digital inventory.

**Stack:** Next.js 14 App Router, Tailwind + shadcn/ui, PostgreSQL + Prisma, JWT (buyers/sellers) + NextAuth (admin), next-intl (AR + EN), Iraqi payment gateway + Stripe, Resend/Nodemailer.

---

## Current Position

**Current phase:** Phase 3 — Purchase & Delivery
**Current plan:** Plan 04 (03-03 complete)
**Status:** Phase 3 in progress — migration applied, proceeding to service plans

```
Progress: [██████░░░░░░░░░░░░░░] 28% — Phase 2 of 7 complete
```

---

## Phase Status

| Phase | Status | Started | Completed |
|-------|--------|---------|-----------|
| 1 — Auth & User Accounts | Complete ✓ | 2026-05-02 | 2026-05-02 |
| 2 — Marketplace Browsing & Listings | Complete ✓ | 2026-05-03 | 2026-05-03 |
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
| Multilingual product fields as Json (`{"en":"...","ar":"..."}`) | Phase 2 decision — all products use this format |
| AES-256-GCM key encryption at rest | SEC-02 implemented in Phase 2 via `lib/crypto.ts` |
| Seller listing cap: 10 active listings (0 completed orders) | SEC-05 enforced server-side + UI banner |
| 7-day earnings hold for new sellers | SEC-04 dismissible banner on dashboard |

### Critical Implementation Notes

1. **Key assignment race condition** — Must use `SELECT FOR UPDATE SKIP LOCKED` before Phase 3 ships. Duplicate key delivery = refund liability.
2. **Wallet double-spend** — Must use atomic `UPDATE wallet SET balance = balance - amount WHERE balance >= amount`. Read-then-write without lock = negative balance possible.
3. **Delivery auto-confirm cron** — Phase 3 needs a Vercel Cron job sweeping orders past `confirmDeadline` — without this, expired orders pile up.
4. **Phase 4/5 services are stubbed** — escrow, wallet, notification, review services throw "not implemented" — do not call them in production until their phases ship.
5. **Guest order model** — Current Order schema has no `buyerId`/`sellerId` — Phase 3 needs to decide whether to add these or keep guest-only.

### Schema Notes (Phase 2 Complete)

- `Product`: `title Json`, `description Json`, `deliveryType DeliveryType`, `status ProductStatus`, `isFeatured Boolean`, `platform String?`, `sellerId String`, `categoryId String?`
- `ProductKey`: renamed from `LicenseKey`; `keyValue String` (AES-256-GCM encrypted), `isUsed Boolean`, `usedAt DateTime?`
- `Category`: seeded with Gaming, Software, Office, Antivirus, Other
- `OrderStatus` enum: PENDING/PAID/DELIVERED/COMPLETED/DISPUTED/REFUNDED
- `DeliveryType` enum: INSTANT/MANUAL
- `ProductStatus` enum: ACTIVE/INACTIVE

### Open Questions (Need Product Owner Input)

1. Which Iraqi gateway specifically — ZainCash, FIB, or other?
2. Manual delivery SLA window — 12h or 24h?
3. Dispute window for keys vs accounts — 3 days or 14 days?
4. Commission rate — 10% confirmed for launch?
5. Payout method for sellers — ZainCash transfer, bank transfer, or FIB?
6. Phase 3: keep guest checkout or require buyer accounts for purchase?

### Todos

- [ ] Answer open gateway/payment questions before Phase 4 planning
- [ ] Confirm manual delivery SLA before Phase 3 planning
- [ ] Decide commission rate before Phase 3 planning
- [ ] Decide guest vs. buyer-account model before Phase 3 planning

### Blockers

None currently.

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Requirements defined | 47 |
| Phases planned | 7 |
| Plans completed | 14 (7 Phase 1 + 7 Phase 2) |

---

## Session Continuity

To resume work:

1. Read `.planning/ROADMAP.md` for phase structure and success criteria
2. Read `.planning/REQUIREMENTS.md` for full requirement list and traceability
3. Run `/gsd-discuss-phase 3` to capture Phase 3 decisions, then `/gsd-plan-phase 3`

---
*Next action: `/gsd-discuss-phase 3` — Purchase & Delivery*
