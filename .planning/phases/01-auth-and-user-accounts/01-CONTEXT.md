# Phase 1: Auth & User Accounts - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a complete, secure authentication system for buyers and sellers: registration with role selection, email verification, login with httpOnly JWT cookie, password reset via email, and seller shop-name profile. Rate limiting on auth endpoints. Admin API routes hardened with per-route session checks.

This phase does NOT include seller product listings, wallet top-up, or admin UI — only the identity and auth foundation everything else depends on.

</domain>

<decisions>
## Implementation Decisions

### Token Security
- **D-01:** JWT token stored in httpOnly cookie ONLY (`mp_token`). Remove the `localStorage.setItem("auth_token", ...)` call from login and register pages — this is a security bug (XSS-readable). The cookie setup already in the API routes is correct.
- **D-02:** Client-side auth state is determined by calling `GET /api/auth/me` on mount. The nav/header uses this to know if a user is logged in. No client-side token parsing — token stays opaque.

### Email Verification
- **D-03:** Hard block only on transactional actions: buying, selling (creating listings), and accessing the wallet. Unverified users can browse the marketplace freely.
- **D-04:** When an unverified user tries a blocked action, redirect them to a "Verify your email" screen with a resend button. The resend endpoint regenerates a token and re-sends the verification email.
- **D-05:** Verification tokens expire after 24 hours. Clicking an expired link shows a clear error with the resend option.

### Seller Registration
- **D-06:** Sellers provide a `shopName` field at registration (in addition to name, email, password). This is stored on the User model (or a linked SellerProfile — planner decides the schema approach based on what's cleaner with existing Prisma schema).
- **D-07:** Role is fixed at registration. The registration form has a role toggle (Buyer / Seller). Buyers cannot upgrade to sellers after signup in v1.
- **D-08:** A seller's shop name must be unique across the platform (like a username for their store).

### Password Reset
- **D-09:** Password reset uses a time-limited token (1 hour expiry) sent by email. The reset link takes the user to a page where they enter a new password. Standard flow — no extra confirmation step beyond submitting the new password.

### Admin Auth (deferred)
- **D-10 (DEFERRED):** Migrating AdminUser to User with role=ADMIN is deferred to Phase 7. In Phase 1, the existing NextAuth + AdminUser path stays untouched. Only buyer/seller JWT auth is in scope.

### Rate Limiting
- **D-11:** Apply rate limiting to: POST /api/auth/login (5 attempts per 15 min per IP), POST /api/auth/register (3 per hour per IP). Use `@upstash/ratelimit` with the existing Redis setup (or a lightweight in-memory fallback for dev). Return 429 with a `Retry-After` header.

### Claude's Discretion
- Schema changes: whether to add `emailVerified`, `verificationToken`, `verificationTokenExpiry`, `resetToken`, `resetTokenExpiry`, `shopName` directly to the User model or via a linked table — planner decides based on Prisma schema conventions.
- Error messages: keep vague for security (e.g., "If an account with that email exists, a reset link was sent" — don't confirm email existence).
- Loading states and skeleton UI: standard Next.js patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Auth Implementation
- `lib/auth-middleware.ts` — `requireAuth()`, `verifyToken()`, `extractToken()` — extend, don't replace
- `lib/auth.ts` — NextAuth config for admin (do NOT modify in Phase 1, admin auth is deferred)
- `services/auth.service.ts` — `register()`, `login()`, `signToken()`, `verifyToken()` — extend with email verification fields
- `app/api/auth/login/route.ts` — sets httpOnly cookie correctly; remove any localStorage references in calling UI
- `app/api/auth/register/route.ts` — correct; needs email verification trigger added
- `app/api/auth/me/route.ts` — correct; used for client-side auth state

### Existing UI
- `app/[locale]/login/page.tsx` — BUG: remove `localStorage.setItem("auth_token", ...)` line
- `app/[locale]/register/page.tsx` — add role toggle (Buyer/Seller), add shopName field for sellers; remove localStorage

### Database Schema
- `prisma/schema.prisma` — User model (add emailVerified, verificationToken fields), no AdminUser changes

### Requirements
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-06, SEC-01, SEC-07

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `authService.register()` / `authService.login()` — core logic exists; needs email verification side-effects added
- `requireAuth()` in `lib/auth-middleware.ts` — already wraps API handlers; use on all new auth-protected routes
- `app/[locale]/login/page.tsx` and `register/page.tsx` — UI exists, needs bug fix + seller fields extension
- Wallet creation is already atomic with user creation in `authService.register()` — keep this pattern

### Established Patterns
- httpOnly cookie `mp_token` is the session mechanism for buyers/sellers — do not introduce a second token type
- `prisma.$transaction()` used for user+wallet creation — use same pattern for any new atomic operations
- Zod schemas in API routes for validation — follow this pattern for new routes (password-reset, verify-email)
- `NextResponse.json()` with consistent error shape `{ error: string }` — maintain this convention

### Integration Points
- `middleware.ts` — check if it needs updating for new `/verify-email` and `/reset-password` routes (should be public)
- `Nav` component — needs to show logged-in state from `/api/auth/me` response
- `app/[locale]/dashboard/` — buyer/seller landing after login; ensure redirect logic in login page routes BUYER → /dashboard, SELLER → /dashboard (seller view)

</code_context>

<specifics>
## Specific Ideas

- Shop name uniqueness: validate at registration time with a real-time availability check (debounced) — improves UX vs failing on submit
- Verification pending screen: simple page at `/[locale]/verify-email` that shows "Check your inbox for [email]" with a resend button and countdown to prevent spam (e.g., resend available after 60 seconds)
- The existing form UI style (rounded-2xl border, bg-card/60, backdrop-blur-sm) should be reused for password-reset and verify-email pages for visual consistency

</specifics>

<deferred>
## Deferred Ideas

- Admin auth migration (AdminUser → User with role=ADMIN) — deferred to Phase 7
- "Remember me" / extended session option — defer to v2
- OAuth / social login (Google, Discord) — out of scope v1
- Buyer-to-seller account upgrade — deferred; role is fixed at registration in v1

</deferred>

---

*Phase: 01-auth-and-user-accounts*
*Context gathered: 2026-05-02*
