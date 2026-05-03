---
plan: 03-02
phase: 03-purchase-and-delivery
status: complete
completed: 2026-05-03
---

## Summary

Set up the complete Phase 3 test scaffold — vitest configuration, a Prisma mock, and 6 failing test files covering every Phase 3 requirement in RED state.

## What Was Built

- **vitest.config.ts** — Node environment, global APIs, path alias `@/` pointing to project root, setup file wired in
- **tests/setup.ts** — Global Prisma mock via `vi.mock("@/lib/prisma")`, `mockTx` helper for transaction mocks, `beforeEach(vi.clearAllMocks)`
- **tests/key.test.ts** — DELIVERY-01: assignKey must use `$queryRaw` (SELECT FOR UPDATE SKIP LOCKED), not findFirst; throws on empty pool
- **tests/payment.test.ts** — ORDER-02: ZainCash JWT verify (valid/tampered); callback idempotency (already-PAID → no re-assignment); happy path call chain; invalid JWT → FAILED status; DELIVERY-02 todo stub
- **tests/orders.test.ts** — ORDER-03/04: listForUser filters by buyerId, never exposes keyValue; ownership enforcement contract documented; DELIVERY-03/04 todo stubs
- **tests/wallet.test.ts** — ORDER-01: atomic `$executeRaw` deduction; rowsAffected=0 → "Insufficient balance" throw
- **tests/cron.test.ts** — DELIVERY-05: auto-confirm sweep contract documented
- **tests/audit.test.ts** — DELIVERY-06: auditService.log creates AuditLog record with correct shape

## Key Decisions

- Used `vi.doMock` for per-test service mocks (avoids module cache collisions)
- Tests import services dynamically (`await import(...)`) so they fail gracefully with import errors when services don't exist yet — correct RED state
- `mockTx` exported from setup.ts so all test files share the same mock transaction shape

## Self-Check: PASSED

- vitest installed (^4.1.5), config exists at project root
- All 6 test files exist under `tests/`
- tests/payment.test.ts contains `already-PAID` idempotency test and DELIVERY-02 todo
- tests/orders.test.ts contains DELIVERY-03 and DELIVERY-04 todo stubs
- tests/wallet.test.ts references `"User"` table and `walletBalance` column
