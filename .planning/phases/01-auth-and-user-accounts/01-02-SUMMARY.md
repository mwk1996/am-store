---
phase: 01-auth-and-user-accounts
plan: "02"
subsystem: auth
tags: [rate-limiting, auth-routes, email-verification, password-reset, zod]
dependency_graph:
  requires:
    - 01-01 (authService methods, Prisma User model)
  provides:
    - In-memory rate limiter utility (lib/rate-limit.ts)
    - POST /api/auth/login with rate limiting
    - POST /api/auth/register with rate limiting and shopName
    - POST /api/auth/verify-email
    - POST /api/auth/resend-verification
    - POST /api/auth/forgot-password
    - POST /api/auth/reset-password
  affects:
    - UI auth pages in Wave 3 plans (login, register, verify-email, reset-password pages)
tech_stack:
  added: []
  patterns:
    - In-memory sliding window rate limiter (Map-based, no external dependency)
    - Identical responses for sensitive operations (forgot-password, resend-verification)
    - httpOnly cookie for JWT, token never in JSON response body
    - 410 Gone for expired tokens (vs 400 for invalid)
key_files:
  created:
    - lib/rate-limit.ts
    - app/api/auth/login/route.ts
    - app/api/auth/register/route.ts
    - app/api/auth/verify-email/route.ts
    - app/api/auth/resend-verification/route.ts
    - app/api/auth/forgot-password/route.ts
    - app/api/auth/reset-password/route.ts
  modified: []
decisions:
  - "Use in-memory Map for rate limiting (no @upstash/ratelimit in package.json; Redis note added as prod TODO)"
  - "Return 410 Gone for expired tokens, 400 for invalid — semantically distinct"
  - "resend-verification and forgot-password always return 200/success to prevent email enumeration"
  - "login route: token in cookie only (not JSON), matching register pattern"
metrics:
  duration: ~5 minutes
  completed: "2026-05-02"
  tasks_completed: 2
  files_changed: 7
---

# Phase 01 Plan 02: Auth Routes and Rate Limiting Summary

Rate-limited login and register routes plus four transactional auth flow endpoints (verify-email, resend-verification, forgot-password, reset-password) delegating to the authService from Plan 01.

## What Was Built

### Task 1 — Rate limiter + login + register routes (commit: 860b887)

Created `lib/rate-limit.ts` — an in-memory sliding window rate limiter using a Map keyed by arbitrary string (e.g. `login:{ip}`). No external dependency required.

Created `app/api/auth/login/route.ts`:
- 5 attempts per 15 minutes per IP (T-02-01 mitigation)
- Returns 429 with `Retry-After` header on limit exceeded
- JWT returned as httpOnly cookie only

Created `app/api/auth/register/route.ts`:
- 3 attempts per hour per IP (T-02-02 mitigation)
- Zod schema with `shopName` field (min 2, max 30, `[a-zA-Z0-9_-]+` pattern)
- `.refine()` requiring shopName when `role === SELLER`
- 409 Conflict for duplicate email or shop name
- Token in cookie only, `{ user }` in JSON body

### Task 2 — Four transactional auth routes (commit: 9bd10e5)

Created `app/api/auth/verify-email/route.ts`:
- Accepts `{ token }`, calls `authService.verifyEmail(token)`
- 410 on expired token, 400 on invalid

Created `app/api/auth/resend-verification/route.ts`:
- Always returns `{ success: true }` — silent on unknown email (T-02-04)

Created `app/api/auth/forgot-password/route.ts`:
- Always returns same message whether email exists or not (T-02-03)

Created `app/api/auth/reset-password/route.ts`:
- Accepts `{ token, password }`, calls `authService.resetPassword(token, password)`
- 410 on expired token, 400 on invalid

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all routes are fully wired to authService methods.

## Threat Surface Scan

All threat model mitigations implemented:
- T-02-01: login rate limit 5/15min with 429+Retry-After
- T-02-02: register rate limit 3/hr with 429+Retry-After
- T-02-03: forgot-password identical response (information disclosure prevented)
- T-02-04: resend-verification silent return (information disclosure prevented)
- T-02-05: X-Forwarded-For accepted as-is (noted for prod hardening with Redis + trusted proxy)
- T-02-06: reset token expiry handled by authService (32-byte random, 1-hour, cleared after use)

## Self-Check: PASSED

- lib/rate-limit.ts exists: FOUND
- app/api/auth/login/route.ts exists: FOUND
- app/api/auth/register/route.ts exists: FOUND
- app/api/auth/verify-email/route.ts exists: FOUND
- app/api/auth/resend-verification/route.ts exists: FOUND
- app/api/auth/forgot-password/route.ts exists: FOUND
- app/api/auth/reset-password/route.ts exists: FOUND
- Commits 860b887, 9bd10e5: FOUND in git log
