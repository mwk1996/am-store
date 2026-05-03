---
plan: 03-07
phase: 03-purchase-and-delivery
status: complete
completed: 2026-05-03
---

## Summary

Implemented payment initiation/callback and auto-confirm cron, completing the end-to-end payment flow.

## What Was Built

- **POST /api/payment/initiate** — Buyer auth, rejects `gateway="wallet"` with 400, uses `getProvider` dispatcher for external gateways, stores `gatewayRef` on order, returns `{ redirectUrl }`.
- **GET /api/payment/callback** (ZainCash) — Verifies JWT via `zaincashProvider.verifyCallback`, idempotent (already PAID → redirect to success), atomic: `keyService.assignKey + order.update(PAID) + auditService.log(KEY_REVEALED)` in one `$transaction`, non-blocking license email. Invalid JWT → order set FAILED.
- **POST /api/payment/callback** — Kept for backward compat with non-redirect gateways; same logic as GET.
- **GET /api/cron/auto-confirm** — `Authorization: Bearer CRON_SECRET` check, sweeps DELIVERED orders with `confirmDeadline < now`, sets COMPLETED + `AUTO_CONFIRMED` audit per order, continues on per-order errors.
- **vercel.json** — Cron registered at `*/15 * * * *`.
- **lib/email.ts** — Added `sendDeliveryEmail(to, orderId, credentials)` using Resend, same pattern as `sendLicenseEmail`.

## Key Decisions

- ZainCash callback is a browser GET redirect (`?token=JWT`) — plan's research (Pitfall 2) confirmed; POST handler kept for other gateways
- `wallet` excluded from Zod enum in initiate route + explicit 400 guard before parse
- Callback uses `order.buyer?.email ?? order.guestEmail` for email recipient (supports both buyer accounts and legacy guest orders)

## Self-Check: PASSED

- `grep "assignKey" app/api/payment/callback/route.ts` → keyService.assignKey present (no findFirst+update)
- `grep "OrderStatus.FAILED" app/api/payment/callback/route.ts` → no `as any` cast
- `grep "AUTO_CONFIRMED" app/api/cron/auto-confirm/route.ts` → audit event present
- `grep "CRON_SECRET" app/api/cron/auto-confirm/route.ts` → auth check present
- `grep "sendDeliveryEmail" lib/email.ts` → function exported
- `cat vercel.json | grep auto-confirm` → cron entry present
