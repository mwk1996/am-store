---
phase: 3
phase-slug: purchase-and-delivery
date: 2026-05-03
---

# Phase 3: Purchase & Delivery — Validation Strategy

## Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (configured in Wave 1 via Plan 03-02) |
| Config file | `vitest.config.ts` + `tests/setup.ts` with Prisma mock |
| Quick run command | `npx vitest run --reporter=dot` |
| Full suite command | `npx vitest run --reporter=verbose` |

## Requirement Coverage

| Req ID | Behavior | Test Type | Automated Command | File |
|--------|----------|-----------|-------------------|------|
| ORDER-01 | Wallet deduction fails when balance < amount | unit | `npx vitest run tests/wallet.test.ts` | `tests/wallet.test.ts` |
| ORDER-01 | Atomic deduction succeeds when balance >= amount | unit | `npx vitest run tests/wallet.test.ts` | `tests/wallet.test.ts` |
| ORDER-02 | Gateway initiate returns redirectUrl | unit | `npx vitest run tests/payment.test.ts` | `tests/payment.test.ts` |
| ORDER-02 | Callback with valid ZainCash JWT sets order PAID | unit | `npx vitest run tests/payment.test.ts` | `tests/payment.test.ts` |
| ORDER-02 | Idempotent callback (already PAID → skip) | unit | `npx vitest run tests/payment.test.ts` | `tests/payment.test.ts` |
| ORDER-02 | Bad JWT → order status set to FAILED | unit | `npx vitest run tests/payment.test.ts` | `tests/payment.test.ts` |
| ORDER-03 | Order history returns only caller's orders | unit | `npx vitest run tests/orders.test.ts` | `tests/orders.test.ts` |
| ORDER-04 | Key reveal rejected for wrong buyer | unit | `npx vitest run tests/orders.test.ts` | `tests/orders.test.ts` |
| ORDER-04 | Key reveal returns decrypted key for order owner | unit | `npx vitest run tests/orders.test.ts` | `tests/orders.test.ts` |
| DELIVERY-01 | assignKey() locks row — no duplicate assignment | unit | `npx vitest run tests/key.test.ts` | `tests/key.test.ts` |
| DELIVERY-05 | Auto-confirm cron updates expired DELIVERED orders | unit | `npx vitest run tests/cron.test.ts` | `tests/cron.test.ts` |
| DELIVERY-06 | AuditLog entry created on KEY_REVEALED | unit | `npx vitest run tests/audit.test.ts` | `tests/audit.test.ts` |
| DELIVERY-06 | AuditLog entry created on AUTO_CONFIRMED | unit | `npx vitest run tests/audit.test.ts` | `tests/audit.test.ts` |

## Manual-Only Tests

| Req | Behavior | How to Verify |
|-----|----------|---------------|
| DELIVERY-02 | Key email delivered to buyer | Staging environment with real mailbox — check email receipt after payment |
| DELIVERY-03 | Seller posts credentials via Dashboard modal | Browser smoke test — seller logs in, finds PENDING order, clicks Deliver, submits credentials |
| DELIVERY-04 | Buyer confirms receipt | Browser smoke test — buyer opens order detail, clicks "Confirm Receipt" |

## Sampling Schedule

| Gate | Command | When |
|------|---------|------|
| Per task | `npx vitest run --reporter=dot` | After each task commit |
| Per wave | `npx vitest run` | Before merging wave |
| Phase gate | `npx vitest run` — full suite green | Before `/gsd-verify-work` |

## Wave 0 Gaps (Created in Plan 03-02)

- [ ] `vitest.config.ts` — test framework config
- [ ] `tests/setup.ts` — Prisma mock setup
- [ ] `tests/key.test.ts` — DELIVERY-01 (assignKey race condition)
- [ ] `tests/payment.test.ts` — ORDER-02 (ZainCash JWT, callback idempotency, route-level tests)
- [ ] `tests/orders.test.ts` — ORDER-03, ORDER-04
- [ ] `tests/wallet.test.ts` — ORDER-01 (atomic deduction service function)
- [ ] `tests/cron.test.ts` — DELIVERY-05
- [ ] `tests/audit.test.ts` — DELIVERY-06

## Security Validation

| Threat | Test |
|--------|------|
| Callback replay | `tests/payment.test.ts` — idempotency test (already PAID → skip) |
| Key enumeration | `tests/orders.test.ts` — wrong buyer rejected with 403 |
| Cron endpoint exposure | Manual: call `/api/cron/auto-confirm` without `Authorization: Bearer CRON_SECRET` → 401 |
| Wallet double-spend | `tests/wallet.test.ts` — concurrent deduction test |
| Gateway callback forged | `tests/payment.test.ts` — bad JWT → FAILED |
| Key in list response | `tests/orders.test.ts` — `GET /api/orders` response contains no `keyValue` field |
