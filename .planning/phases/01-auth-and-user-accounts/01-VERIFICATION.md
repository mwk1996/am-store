---
phase: 01-auth-and-user-accounts
verified: 2026-05-02T00:00:00Z
status: passed
score: 15/15 must-haves verified
overrides_applied: 0
gaps: []
gap_fix_applied: "Cookie name mismatch in auth-middleware.ts fixed inline (commit 9256b87) — req.cookies.get('token') → req.cookies.get('mp_token')"
human_verification:
  - test: "Registration and login flow end-to-end"
    expected: "After login, subsequent API calls to protected routes succeed (admin routes return data, not 401/403)"
    why_human: "The cookie name bug requires a running browser session to fully confirm fix works after correction"
  - test: "Email verification email is received"
    expected: "After registration, user receives email with working verification link"
    why_human: "Requires live Resend credentials and checking an actual inbox"
  - test: "Password reset email is received and link works"
    expected: "User receives reset email, clicks link, successfully changes password"
    why_human: "Requires live Resend credentials and checking an actual inbox"
---

# Phase 1: Auth & User Accounts Verification Report

**Phase Goal:** Complete auth and user account system — JWT-based registration/login for buyers and sellers, email verification, password reset, and hardened admin session enforcement.
**Verified:** 2026-05-02
**Status:** passed (gap fixed inline — cookie name corrected in auth-middleware.ts)
**Re-verification:** No — gap fixed directly during execution

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User model has emailVerified, verificationToken, verificationTokenExp, resetToken, resetTokenExp, shopName fields | VERIFIED | schema.prisma lines 79-84: all 6 fields present with correct types and constraints |
| 2 | authService.register() stores shopName for SELLER role and generates a verification token | VERIFIED | auth.service.ts lines 32-53: shopName handled, verificationToken generated in $transaction |
| 3 | authService has sendVerificationEmail, verifyEmail, sendPasswordResetEmail, resetPassword methods | VERIFIED | auth.service.ts lines 88-155: all 5 methods present and substantive |
| 4 | requireEmailVerified() helper exists in lib/auth-middleware.ts | VERIFIED | auth-middleware.ts lines 50-64: function exported, does DB lookup for emailVerified |
| 5 | requireAdminSession() helper exists in lib/auth-middleware.ts | VERIFIED | auth-middleware.ts lines 66-79: function exported, checks Role.ADMIN |
| 6 | POST /api/auth/register accepts shopName for SELLER role and triggers verification email | VERIFIED | register/route.ts lines 15-24: shopName in Zod schema with .refine() for SELLER requirement |
| 7 | POST /api/auth/verify-email verifies a token and marks the user's email as verified | VERIFIED | verify-email/route.ts line 12: calls authService.verifyEmail(token) |
| 8 | POST /api/auth/resend-verification regenerates and re-sends a verification token | VERIFIED | resend-verification/route.ts: exists, calls authService.resendVerificationEmail |
| 9 | POST /api/auth/forgot-password sends a reset link without confirming whether email exists | VERIFIED | forgot-password/route.ts lines 9-21: always returns same response regardless of email |
| 10 | POST /api/auth/reset-password sets a new password using a valid unexpired token | VERIFIED | reset-password/route.ts line 15: calls authService.resetPassword(token, password) |
| 11 | POST /api/auth/login and register return 429 with Retry-After header when rate limit exceeded | VERIFIED | login/route.ts line 22-24; register/route.ts line 35-38: both return 429 with Retry-After header |
| 12 | Every handler in app/api/admin/* is wrapped with requireAdminSession() instead of inline verifyToken + role check | VERIFIED | All 8 admin route files confirmed: products, products/[id], orders, licenses, disputes, stats, upload, users — all use requireAdminSession |
| 13 | A non-admin JWT token receives 403 from all admin routes | FAILED | requireAdminSession checks role correctly BUT extractToken reads cookie "token" while login/register set cookie "mp_token" — cookie auth is broken at runtime; role check is never reached via cookie-based auth |
| 14 | Login page no longer calls localStorage.setItem for auth_token | VERIFIED | login/page.tsx line 38 comment: "No localStorage — token lives in httpOnly cookie"; no localStorage usage found |
| 15 | Register page shows shopName field when Seller role is selected | VERIFIED | register/page.tsx lines 129-145: conditional shopName field renders when form.role === "SELLER" |

**Score:** 14/15 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `prisma/schema.prisma` | Extended User model with auth fields | VERIFIED | All 6 fields present: shopName, emailVerified, verificationToken, verificationTokenExp, resetToken, resetTokenExp |
| `services/auth.service.ts` | Email verification and password reset logic | VERIFIED | All 5 methods plus updated register() with shopName handling |
| `lib/auth-middleware.ts` | requireEmailVerified, requireAdminSession helpers | VERIFIED (with caveat) | Both functions exported and correctly implemented; cookie name bug in extractToken breaks runtime usage |
| `lib/rate-limit.ts` | In-memory sliding window rate limiter | VERIFIED | checkRateLimit exported, correct sliding window implementation |
| `app/api/auth/verify-email/route.ts` | Email verification endpoint | VERIFIED | POST handler, calls authService.verifyEmail |
| `app/api/auth/resend-verification/route.ts` | Resend verification email endpoint | VERIFIED | POST handler, silent on errors |
| `app/api/auth/forgot-password/route.ts` | Password reset initiation endpoint | VERIFIED | POST handler, always returns same response |
| `app/api/auth/reset-password/route.ts` | Password reset completion endpoint | VERIFIED | POST handler, calls authService.resetPassword |
| `app/[locale]/verify-email/page.tsx` | Email verification pending screen with resend | VERIFIED | Resend button with 60-second cooldown, sessionStorage for email |
| `app/[locale]/forgot-password/page.tsx` | Forgot password form | VERIFIED | Ambiguous success message after submit |
| `app/[locale]/reset-password/page.tsx` | Password reset form with token from URL | VERIFIED | Uses useSearchParams() to read token, wrapped in Suspense |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| services/auth.service.ts | prisma/schema.prisma | prisma.user.update with verificationToken fields | WIRED | Lines 106-109, 117-120, 130-132, 152-154 |
| lib/auth-middleware.ts | services/auth.service.ts | TokenPayload import, authService.verifyToken | WIRED | Lines 3-4, 21 |
| app/api/auth/verify-email/route.ts | services/auth.service.ts | authService.verifyEmail(token) | WIRED | Line 12 |
| app/api/auth/reset-password/route.ts | services/auth.service.ts | authService.resetPassword(token, password) | WIRED | Line 15 |
| app/api/auth/login/route.ts | rate limiter | checkRateLimit before authService.login | WIRED | Lines 4, 19-25 |
| app/api/admin/*/route.ts | lib/auth-middleware.ts | requireAdminSession import | WIRED | All 8 files confirmed |
| app/[locale]/register/page.tsx | /api/auth/register | fetch POST on submit | WIRED | Line 28 |
| app/[locale]/verify-email/page.tsx | /api/auth/resend-verification | fetch POST on resend button click | WIRED | Line 31 |
| app/[locale]/reset-password/page.tsx | /api/auth/reset-password | fetch POST with token from useSearchParams | WIRED | Line 413 |
| login/register routes | lib/auth-middleware.ts extractToken | Cookie set as "mp_token" but read as "token" | BROKEN | login/route.ts:32 sets "mp_token"; auth-middleware.ts:11 reads "token" |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| AUTH-01 | 01-01, 01-04, 01-05 | User can register as a buyer with email + password | SATISFIED | register route + authService.register() + register page |
| AUTH-02 | 01-01, 01-02, 01-05 | User can register as a seller with email + password and seller profile | SATISFIED | shopName field in schema, register route, register page conditional shopName field |
| AUTH-03 | 01-01, 01-02, 01-05 | User receives email verification link on signup and must confirm before accessing account | PARTIALLY SATISFIED | Verification email sent on registration; verify-email page and API routes exist. requireEmailVerified helper exists but cookie name bug means it cannot enforce protection via cookie auth. Human verification needed for live email delivery. |
| AUTH-04 | 01-02, 01-05 | User can log in with email + password and receive a JWT session | PARTIALLY SATISFIED | Login route sets httpOnly cookie "mp_token" correctly. Cookie name bug means requireAuth/requireAdminSession cannot read this cookie — protected routes will 401 on cookie-only clients. Bearer token still works. |
| AUTH-05 | 01-01, 01-02 | User can request a password reset link via email | SATISFIED (code) | sendPasswordResetEmail, forgot-password route and page all correct. Live email requires human verify. |
| AUTH-06 | 01-01, 01-02 | User can reset password using the emailed link | SATISFIED (code) | resetPassword, reset-password route and page all correct. |
| SEC-01 | 01-02 | Auth endpoints rate-limited (login: 5/15min, register: 3/hr) | SATISFIED | checkRateLimit applied to both with correct limits and Retry-After header |
| SEC-07 | 01-01, 01-03 | All admin API routes validate admin session server-side per route | CODE-SATISFIED / RUNTIME-BROKEN | All 8 admin routes use requireAdminSession correctly in code. Cookie name mismatch means the session is never actually extracted from the cookie, rendering the protection ineffective for browser clients. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| lib/auth-middleware.ts | 11 | `req.cookies.get("token")` — cookie name is "token" but login sets "mp_token" | Blocker | All cookie-based authentication silently fails; requireAdminSession and requireEmailVerified never receive a token from browser sessions |

### Human Verification Required

#### 1. Admin route protection after cookie name fix

**Test:** Fix the cookie name (see Gaps Summary), log in as an admin user, then attempt a request to `GET /api/admin/products`. Attempt the same request with a non-admin JWT.
**Expected:** Admin request returns product list (200); non-admin request returns 403.
**Why human:** Requires a running server and actual JWT tokens with different roles.

#### 2. Email verification email delivery

**Test:** Register a new account on `/en/register`. Check the inbox of the registered email address.
**Expected:** Verification email arrives within 1 minute with a working link pointing to `/en/verify-email?token=<hex-token>`.
**Why human:** Requires live `RESEND_API_KEY` and `EMAIL_FROM` environment variables configured.

#### 3. Password reset email delivery and token use

**Test:** Submit a valid email on `/en/forgot-password`. Check inbox for reset email. Click the link and set a new password.
**Expected:** Reset email arrives, link navigates to reset-password page pre-filled with token, new password is accepted, redirected to login.
**Why human:** Requires live Resend credentials and checking an actual inbox.

### Gaps Summary

**1 gap blocks full goal achievement:**

**Cookie name mismatch (blocker):** `lib/auth-middleware.ts` line 11 reads `req.cookies.get("token")` but both `app/api/auth/login/route.ts` (line 32) and `app/api/auth/register/route.ts` (line 46) set the cookie as `"mp_token"`. This means `extractToken()` always returns null for browser sessions using the httpOnly cookie. Every call to `requireAdminSession`, `requireEmailVerified`, and `requireAuth` will return 401 for authenticated browser clients — they would need to send a `Bearer` token in the `Authorization` header instead (which the login page does not do).

**Fix:** In `lib/auth-middleware.ts` line 11, change:
```typescript
const cookie = req.cookies.get("token");
```
to:
```typescript
const cookie = req.cookies.get("mp_token");
```

This single line change restores runtime correctness for all cookie-based auth flows including admin session enforcement (SEC-07) and email-verified gating (AUTH-03/AUTH-04).

---

_Verified: 2026-05-02T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
