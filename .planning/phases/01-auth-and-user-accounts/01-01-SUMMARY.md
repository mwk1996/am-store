---
phase: 01-auth-and-user-accounts
plan: "01"
subsystem: auth
tags: [prisma, schema, auth-service, middleware, email-verification, password-reset]
dependency_graph:
  requires: []
  provides:
    - User model with auth fields in schema.prisma
    - authService with email verification and password reset logic
    - requireEmailVerified and requireAdminSession middleware helpers
  affects:
    - All Wave 2 plans that consume authService methods
    - All API routes using requireEmailVerified or requireAdminSession
tech_stack:
  added:
    - jsonwebtoken (JWT signing/verification)
    - resend (email delivery, dynamic import)
  patterns:
    - Fire-and-forget email on register (never fail registration)
    - Silent return on unknown email for reset/resend (T-01-03 mitigation)
    - 32-byte crypto.randomBytes for all tokens (T-01-01 mitigation)
key_files:
  created:
    - services/auth.service.ts
    - lib/auth-middleware.ts
  modified:
    - prisma/schema.prisma
    - package.json
decisions:
  - "Use jsonwebtoken for JWT (consistent with main project pattern)"
  - "Token expiry: 24h for email verification, 1h for password reset (plan spec)"
  - "shopName only set for SELLER role on create; null for BUYER/ADMIN"
metrics:
  duration: ~12 minutes
  completed: "2026-05-02"
  tasks_completed: 3
  files_changed: 4
---

# Phase 01 Plan 01: Auth Schema and Service Foundation Summary

JWT auth service with email verification and password reset using crypto.randomBytes tokens and Resend email delivery.

## What Was Built

### Task 1 — Extend Prisma User model (commit: 31ad75b)

Added the User model and Role enum to `prisma/schema.prisma` (the model did not previously exist in this codebase branch):

- `Role` enum: BUYER, SELLER, ADMIN
- `User` model with all base fields plus:
  - `shopName String? @unique` — SELLER store identifier
  - `emailVerified Boolean @default(false)`
  - `verificationToken String? @unique`
  - `verificationTokenExp DateTime?`
  - `resetToken String? @unique`
  - `resetTokenExp DateTime?`
- Indexes on `shopName`, `verificationToken`, `resetToken`

### Task 2 — Create services/auth.service.ts (commit: a962101)

Created `services/auth.service.ts` with the full `authService` object:

- `register()` — accepts `shopName`, checks uniqueness for SELLER, generates 24h verification token, fires verification email asynchronously
- `login()` — validates password, returns JWT
- `signToken()` / `verifyToken()` — JWT using jsonwebtoken
- `sendVerificationEmail()` — dynamic Resend import, sends 24h expiry link
- `verifyEmail()` — validates token, clears token fields on success
- `resendVerificationEmail()` — silent on unknown/already-verified email (T-01-03)
- `sendPasswordResetEmail()` — silent on unknown email, 1h expiry token
- `resetPassword()` — validates token, bcrypt-hashes new password, clears token

Also added `jsonwebtoken` and `@types/jsonwebtoken` to `package.json` (Rule 3 — missing dependency required by the service).

### Task 3 — Create lib/auth-middleware.ts (commit: 73222ce)

Created `lib/auth-middleware.ts` with all required exports:

- `extractToken()` — reads from Authorization header or `token` cookie
- `verifyToken()` — wraps authService.verifyToken, returns null on failure
- `requireAuth()` — role-gated handler wrapper
- `jsonError()` / `jsonOk()` — response helpers
- `requireEmailVerified()` — DB lookup on `emailVerified`, returns 403 with redirect hint if not verified
- `requireAdminSession()` — checks `role === Role.ADMIN`, returns 403 otherwise (T-01-04 mitigation)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Missing dependency] Added jsonwebtoken to package.json**
- **Found during:** Task 2
- **Issue:** `services/auth.service.ts` uses `import jwt from "jsonwebtoken"` but the package was not in package.json (the worktree was based on the pre-phase initial commit which predates the marketplace schema work)
- **Fix:** Added `"jsonwebtoken": "^9.0.2"` to dependencies and `"@types/jsonwebtoken": "^9.0.6"` to devDependencies
- **Files modified:** package.json
- **Commit:** a962101

**2. [Rule 2 - Missing functionality] Created User model from scratch**
- **Found during:** Task 1
- **Issue:** The plan context described extending an existing User model, but the worktree's schema (reset to d539ad6) had no User model — only the legacy store schema with Product/LicenseKey/Order/AdminUser
- **Fix:** Added Role enum and full User model with all required fields. No other models modified.
- **Files modified:** prisma/schema.prisma
- **Commit:** 31ad75b

**3. [Rule 2 - Missing functionality] Created auth-middleware.ts from scratch**
- **Found during:** Task 3
- **Issue:** `lib/auth-middleware.ts` did not exist in the worktree (same base commit reason as above)
- **Fix:** Created file with all exports specified in the plan interfaces block
- **Files modified:** lib/auth-middleware.ts
- **Commit:** 73222ce

## Known Stubs

None — all methods are fully implemented with real logic.

## Threat Surface Scan

No new network endpoints introduced in this plan. All changes are schema and service layer. Threat model mitigations T-01-01 through T-01-04 are implemented as specified.

## Self-Check: PASSED

- `prisma/schema.prisma` exists with all 6 new User fields: FOUND
- `services/auth.service.ts` exists with all 5 new methods: FOUND
- `lib/auth-middleware.ts` exists with requireEmailVerified and requireAdminSession: FOUND
- Commits 31ad75b, a962101, 73222ce: FOUND in git log
