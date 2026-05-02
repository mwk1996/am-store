# Phase 1: Auth & User Accounts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-02
**Phase:** 1 — Auth & User Accounts
**Areas discussed:** Token security, Email verification, Seller registration fields

---

## Token Security

| Option | Description | Selected |
|--------|-------------|----------|
| HttpOnly cookie only | Secure — XSS can't read it. Remove localStorage | ✓ |
| Both cookie + localStorage | Current buggy state — localStorage is XSS-vulnerable | |

**User's choice:** HttpOnly cookie only — remove localStorage.setItem from login/register pages

| Option | Description | Selected |
|--------|-------------|----------|
| /api/auth/me call on mount | Works with httpOnly cookie, no token exposure | ✓ |
| Decode token in client JS | Requires readable token — less secure | |

**User's choice:** Lightweight /api/auth/me call on mount for client auth state

---

## Email Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Hard block on purchases + listings only | Browse freely, block transactional actions | ✓ |
| Hard block everything | No browsing until verified | |
| Soft reminder only | Banner, no hard block | |

**User's choice:** Hard block on transactional actions only — buyers can browse unverified

| Option | Description | Selected |
|--------|-------------|----------|
| Resend button on verification pending screen | Self-service resend | ✓ |
| User must contact support | No self-service | |

**User's choice:** Resend button on a verification pending screen

---

## Seller Registration Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Shop name only | Minimal extra field at signup | ✓ |
| Shop name + short description | Richer initial profile | |
| Same as buyer | No extra fields | |

**User's choice:** Shop name only at registration — rest configured in seller dashboard later

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed at registration | Choose buyer or seller when signing up | ✓ |
| Buyer can upgrade to seller later | Enable seller mode from profile | |

**User's choice:** Role fixed at registration — separate buyer/seller registration path

---

## Claude's Discretion

- Schema field placement (User model vs SellerProfile linked table)
- Error message security wording
- Loading states and skeleton UI patterns

## Deferred Ideas

- Admin auth migration to User model — deferred to Phase 7
- Remember me / extended sessions — v2
- OAuth / social login — out of scope v1
- Buyer-to-seller upgrade — fixed role in v1
