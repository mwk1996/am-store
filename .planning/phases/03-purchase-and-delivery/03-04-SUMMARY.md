---
plan: 03-04
phase: 03-purchase-and-delivery
status: complete
completed: 2026-05-03
---

## Summary

Implemented the four core service-layer files that all API routes depend on.

## What Was Built

- **services/key.service.ts** — `assignKey` rewritten to use `$queryRaw` with `FOR UPDATE SKIP LOCKED` (D-09). Eliminates the findMany read-then-write race condition. Throws "No available keys for this product" on empty pool.
- **services/order.service.ts** — `listForUser` now filters by `buyerId`/`sellerId` per role with pagination; `getByIdForUser` adds OR ownership check. `keyValue` is never selected in any query (D-16).
- **services/audit.service.ts** — New file. `auditService.log(tx, { orderId, event, ip, userAgent })` creates an `AuditLog` row via `tx.auditLog.create`.
- **services/wallet.service.ts** — New file. `walletService.deductBalance` issues a single atomic `UPDATE "User" SET walletBalance = walletBalance - amount WHERE walletBalance >= amount`. Throws "Insufficient balance" when `rowsAffected === 0` (D-10).

## Key Decisions

- `Prisma.OrderWhereInput` explicit type annotation required on `where` to satisfy TypeScript discriminated union
- `walletService.deductBalance` checks both `0n` (BigInt from Postgres) and `0` for compatibility
- `auditService.log` accepts both `TransactionClient` and the singleton prisma so it can be used inside and outside transactions

## Self-Check: PASSED

- `grep "FOR UPDATE SKIP LOCKED" services/key.service.ts` → 1 match
- `grep "findMany\|findFirst" services/key.service.ts` → 0 matches in assignKey
- `grep "keyValue" services/order.service.ts` → 0 matches
- `grep "walletBalance" services/wallet.service.ts` → UPDATE statement present
- `grep "Insufficient balance" services/wallet.service.ts` → throw present
