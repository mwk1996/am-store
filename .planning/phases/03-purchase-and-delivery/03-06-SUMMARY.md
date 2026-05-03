---
plan: 03-06
phase: 03-purchase-and-delivery
status: complete
completed: 2026-05-03
---

## Summary

Implemented all 5 order API routes forming the purchase and delivery backbone.

## What Was Built

- **POST /api/orders** — Buyer auth, product stock check, 10% commission math (`sellerAmount=price*0.90`, `commissionAmount=price*0.10`), `buyerId`/`sellerId` from token/product. Wallet path: `deductBalance + assignKey (INSTANT) + order.create(PAID)` in one `$transaction`; returns `{ orderId, paid: true }`; returns 402 on "Insufficient balance". Gateway path: creates PENDING order; returns `{ orderId }`.
- **GET /api/orders** — Paginated order list for authenticated user via `orderService.listForUser`; `keyValue` never in response.
- **GET /api/orders/[id]** — Ownership-checked order detail via `orderService.getByIdForUser`.
- **GET /api/orders/[id]/key** — Buyer auth + ownership + status in (PAID, COMPLETED) → decrypts key with `decryptKey`, logs `KEY_REVEALED` audit event.
- **POST /api/orders/[id]/deliver** — Seller auth + product ownership + PAID status + 24h seller window check (computed from `createdAt + 24h` since no `sellerDeadline` field in schema) → sets DELIVERED, `deliveredAt`, `confirmDeadline=+24h`, logs `CREDENTIALS_DELIVERED`, sends `sendDeliveryEmail`.
- **POST /api/orders/[id]/confirm** — Buyer auth + ownership + DELIVERED → sets COMPLETED, `confirmedAt`, `disputeDeadline` (+14d for MANUAL), logs `BUYER_CONFIRMED`.

## Key Decisions

- `sellerDeadline` not in schema (03-01 didn't add it) — computed from `order.createdAt + 24h` in deliver route instead of storing
- Wallet key assignment uses temp orderId placeholder then updates key with real orderId after order.create
- `sendDeliveryEmail` imported dynamically to avoid hard failure if email is unavailable

## Self-Check: PASSED

- `grep "commissionAmount" app/api/orders/route.ts` → commission calculation present
- `grep "walletService.deductBalance" app/api/orders/route.ts` → wallet path present
- `grep "keyService.assignKey" app/api/orders/route.ts` → key assignment in wallet $transaction
- `grep "KEY_REVEALED" app/api/orders/[id]/key/route.ts` → audit log present
- `grep "CREDENTIALS_DELIVERED" app/api/orders/[id]/deliver/route.ts` → audit log present
- `grep "BUYER_CONFIRMED" app/api/orders/[id]/confirm/route.ts` → audit log present
