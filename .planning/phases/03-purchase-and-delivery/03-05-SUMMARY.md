---
plan: 03-05
phase: 03-purchase-and-delivery
status: complete
completed: 2026-05-03
---

## Summary

Restructured lib/payment/ as a multi-gateway plugin system with a common GatewayProvider interface.

## What Was Built

- **lib/payment/types.ts** — Exports `GatewayName`, `GatewayConfig`, `OrderWithProduct`, `GatewayInitiateResult`, `VerifyResult`, `GatewayProvider` interface
- **lib/payment/index.ts** — `getProvider(name)` dispatcher mapping all 5 gateway names + wallet to their providers
- **lib/payment/providers/zaincash.ts** — Full implementation: `initiate` signs a JWT payload and calls ZainCash init API; `verifyCallback` verifies JWT with shared secret, returns `{ valid, orderId, gatewayRef, status }`; invalid/tampered token caught and returns `{ valid: false }`
- **lib/payment/providers/qi-card.ts** — Stub, throws "QI Card gateway is not yet implemented"
- **lib/payment/providers/fib.ts** — Stub
- **lib/payment/providers/asia-pay.ts** — Stub
- **lib/payment/providers/fast-pay.ts** — Stub

## Key Decisions

- ZainCash uses JWT (not HMAC-SHA256 like the old gateway.ts) — matches actual ZainCash API spec
- `verifyCallback` never throws — wraps `jwt.verify` in try/catch, returns `{ valid: false }` on any error (prevents callback handler crashes)
- `wallet` provider slot exists in the dispatcher but throws on `initiate` — wallet purchases bypass the provider system entirely and go through the order route's transaction path

## Self-Check: PASSED

- `grep "jwt.verify" lib/payment/providers/zaincash.ts` → 1 match
- `grep "jwt.sign" lib/payment/providers/zaincash.ts` → 1 match
- All 5 provider files exist in `lib/payment/providers/`
- `lib/payment/types.ts` exports all 6 required types
