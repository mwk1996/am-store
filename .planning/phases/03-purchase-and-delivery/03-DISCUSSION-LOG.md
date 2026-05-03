# Phase 3: Purchase & Delivery - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-03
**Phase:** 03-purchase-and-delivery
**Areas discussed:** Payment flow, Order schema migration, Manual delivery UX, Key reveal & re-access

---

## Payment Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Wallet-only, stub ORDER-02 | Phase 3 wallet-only; ORDER-02 stubbed for Phase 4 | |
| Inline top-up during checkout | Trigger gateway top-up if wallet insufficient | |
| Gateway-direct for ORDER-02 | Integrate gateway for one-time purchases now | |
| **Gateway is primary (follow-up)** | **Gateway redirect is primary; wallet is secondary** | ✓ |

**User's choice:** Gateway is primary payment path; wallet balance is an alternative if available. Both fully implemented in Phase 3 (not stubbed).

| Gateway selection option | Description | Selected |
|--------------------------|-------------|----------|
| Buyer selects at checkout | All Iraqi gateways shown as options | ✓ |
| One default gateway | Single gateway, no selection UI | |
| Admin configures active gateways | Admin controls enabled gateways | |

**User's choice:** Buyer selects gateway at checkout from all available Iraqi options.

**Gateways specified by user:** QI Card, ZainCash, FIB, Asia Pay, Fast Pay — all major Iraqi payment methods.

**Gateway architecture:** Abstract interface in `lib/payment/` — each gateway is a provider plugin. ZainCash as reference implementation.

---

## Order Schema Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Add buyerId + sellerId, keep guestEmail nullable | Non-destructive; existing orders preserved | ✓ |
| Drop guestEmail, require buyerId | Hard migration, destructive | |

**User's choice:** Add buyerId + sellerId as nullable FKs. Keep guestEmail nullable for legacy data.

| Commission storage | Description | Selected |
|--------------------|-------------|----------|
| Store commissionAmount on Order | Stored at purchase time; audit trail clear | ✓ |
| Compute at payout time | No commission field; computed on withdrawal | |

**User's choice:** Store `sellerAmount` and `commissionAmount` on Order at purchase time. Commission = 10%.

---

## Manual Delivery UX

| Delivery window | Description | Selected |
|-----------------|-------------|----------|
| 24 hours | Matches DELIVERY-05; standard window | ✓ |
| 12 hours | Tighter, more buyer-friendly | |
| 48 hours | More relaxed for sellers | |

**User's choice:** 24-hour delivery window.

| Seller delivery UI location | Description | Selected |
|-----------------------------|-------------|----------|
| Dashboard → Orders tab | Modal/form in existing dashboard | ✓ |
| Dedicated order detail page | Separate /dashboard/orders/[id] page | |

**User's choice:** Dashboard → Orders tab with a delivery modal.

---

## Key Reveal & Re-access

| Re-access pattern | Description | Selected |
|-------------------|-------------|----------|
| Click-to-reveal in order history | Inline reveal button; authenticated API call | ✓ |
| Dedicated order detail page | Separate /orders/[id] page | |

**User's choice:** Click-to-reveal inline in order history. Unlimited re-access.

| Dispute window | Description | Selected |
|----------------|-------------|----------|
| 3 days for keys, 14 days for accounts | Split window by delivery type | ✓ |
| 7 days for both | Single unified window | |
| 3 days for both | Short window for both | |

**User's choice:** 3 days for INSTANT (keys), 14 days for MANUAL (game accounts).

---

## Claude's Discretion

- Cron schedule for auto-confirm sweep
- Email template design
- Loading states and skeleton UI
- Error message copy for gateway failures

## Deferred Ideas

- Wallet top-up → Phase 4
- In-order chat → Phase 6
- Admin gateway enable/disable UI → Phase 7
- Cryptocurrency payments → v2
