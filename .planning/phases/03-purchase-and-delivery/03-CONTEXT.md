# Phase 3: Purchase & Delivery - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning

<domain>
## Phase Boundary

A buyer can complete a purchase (via Iraqi payment gateway or wallet balance) and receive their product — instantly for keys, or via a tracked manual delivery for game accounts. Includes order history and key re-access.

This phase does NOT include wallet top-up (Phase 4), reviews (Phase 5), or chat (Phase 6). It DOES include the schema migration to add buyerId/sellerId to orders, the payment gateway abstraction layer, commission recording, and the delivery auto-confirm cron.

</domain>

<decisions>
## Implementation Decisions

### Payment Flow

- **D-01:** Gateway is the primary payment path; wallet balance is the secondary/alternative path. ORDER-02 (direct gateway payment) is fully implemented in Phase 3 — not stubbed. ORDER-01 (wallet deduction) is available when the buyer has sufficient balance.
- **D-02:** Buyer selects their gateway at checkout. All major Iraqi gateways are supported: QI Card, ZainCash, FIB, Asia Pay, Fast Pay. The checkout page renders enabled gateways as selectable payment options; buyer picks one and is redirected to that gateway's payment page.
- **D-03:** `lib/payment/` exports a common gateway interface — `initiate(order, gateway): Promise<{redirectUrl}>`, `verify(ref, gateway): Promise<{success, gatewayRef}>`, and a webhook handler per gateway. Each gateway is a provider plugin implementing this interface. Phase 3 wires one gateway fully as the reference implementation (start with ZainCash); others slot in without changing checkout logic.
- **D-04:** Admin panel (Phase 7) controls which gateways are enabled. For Phase 3, all five gateways are treated as enabled but the abstraction layer must accept a gateway config that can be toggled.

### Order Schema Migration

- **D-05:** Add `buyerId String?` (FK → User) and `sellerId String?` (FK → User) to the Order model. Keep `guestEmail String?` as nullable — existing guest orders are preserved. All new orders created in Phase 3 and beyond require a `buyerId`; `guestEmail` is only for legacy data.
- **D-06:** Add `sellerAmount Decimal` and `commissionAmount Decimal` fields to the Order model. These are computed and stored at purchase time (not at payout). Commission = 10% of product price. Seller receives 90%. Storing on Order makes the audit trail clear and rate changes do not retroactively affect old orders.
- **D-07:** Add `disputeDeadline DateTime?` to the Order model. Set at order creation: `now() + 3 days` for INSTANT delivery, `confirmedAt + 14 days` for MANUAL delivery. Phase 5 trust layer reads this field.
- **D-08:** Add `confirmDeadline DateTime?` to the Order model (for MANUAL orders). Set at delivery time: `deliveredAt + 24 hours`. The cron job (DELIVERY-05) sweeps orders where `confirmDeadline < now()` and status = DELIVERED, auto-confirming them.

### Key Assignment & Race Condition

- **D-09:** Key assignment MUST use `SELECT FOR UPDATE SKIP LOCKED` (raw Prisma query or `$queryRaw`) to prevent duplicate key delivery. This is a hard requirement — no optimistic locking, no read-then-write.
- **D-10:** Wallet deduction (when used as payment) MUST be a single atomic `UPDATE wallet SET balance = balance - amount WHERE id = $id AND balance >= amount`. If rows affected = 0, payment fails with "Insufficient balance." No read-then-write.

### Manual Delivery

- **D-11:** Manual delivery window is **24 hours** from order creation. Seller must post credentials within this window. Auto-confirm fires via Vercel Cron after the deadline (DELIVERY-05).
- **D-12:** Seller delivers credentials via the Dashboard → Orders tab. Seller finds the pending order in their orders list, clicks "Deliver", and a modal/form appears with a textarea for credentials (e.g., "Email: x@y.com / Password: abc123"). On submit, the order status moves to DELIVERED, `deliveredAt` is set, `confirmDeadline` is calculated, and the buyer receives a notification email.
- **D-13:** Buyer sees delivery status on their Orders page: "Awaiting Delivery" → "Delivered — Confirm Receipt" → "Completed". A "Confirm Receipt" button triggers DELIVERY-04 (releases seller earnings). If buyer doesn't act within 24h, cron auto-confirms.

### Key Reveal & Re-access

- **D-14:** Instant key reveal: after successful payment, buyer is redirected to `/[locale]/orders/[id]` (or `/success?order=[id]`) where the key is shown inline. Key is decrypted server-side using `lib/crypto.ts` and returned only to the authenticated buyer who owns the order.
- **D-15:** Re-access from order history: `/[locale]/orders` lists all orders. For INSTANT delivery completed orders, a "Reveal Key" button makes an authenticated API call (`GET /api/orders/[id]/key`) that decrypts and returns the key. The key appears inline — no separate page required. Re-access is unlimited (no reveal-once restriction).
- **D-16:** Keys are NEVER included in list responses (`GET /api/orders` returns order metadata only). They are only returned by the single-order key endpoint, which verifies: (a) authenticated buyer, (b) buyer owns the order, (c) order status is PAID/COMPLETED.
- **D-17:** Dispute window: 3 days from payment for INSTANT delivery products; 14 days from `confirmedAt` for MANUAL delivery (game accounts).

### Delivery Event Logging (DELIVERY-06)

- **D-18:** Every delivery event is logged to an `AuditLog` table (or equivalent) with: `orderId`, `event` (KEY_REVEALED / CREDENTIALS_DELIVERED / BUYER_CONFIRMED / AUTO_CONFIRMED), `timestamp`, `ip`, `userAgent`. This is chargeback evidence — do not skip.

### Commission

- **D-19:** Platform commission is 10% of the product price, fixed for v1. Stored as `commissionAmount` on the Order at purchase time. Seller receives `price * 0.90` held in escrow until order is COMPLETED.

### Claude's Discretion

- Exact Prisma migration file naming and ordering
- Cron schedule for auto-confirm sweep (every 15 minutes is reasonable)
- Email template design for delivery notification and key email
- Loading states and skeleton UI on the orders page
- Error message copy for failed gateway redirects

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Code to Extend
- `prisma/schema.prisma` — current Order model (guestEmail, no buyerId/sellerId, no commission fields); must migrate
- `lib/crypto.ts` — `encryptKey()` / `decryptKey()` — use for key reveal in order endpoint
- `lib/auth-middleware.ts` — `requireAuth()` — wrap all order and delivery API routes
- `lib/payment/` — existing gateway logic; restructure around the abstract interface (D-03)
- `app/[locale]/dashboard/` — seller dashboard; extend Orders tab with delivery interface
- `app/[locale]/orders/` — buyer orders page; create or extend for order history + key reveal

### Requirements
- `.planning/REQUIREMENTS.md` — ORDER-01 through ORDER-04, DELIVERY-01 through DELIVERY-06

### Prior Phase Context
- `.planning/phases/01-auth-and-user-accounts/01-CONTEXT.md` — JWT auth pattern, `mp_token` cookie, `requireAuth()` usage
- `.planning/phases/02-marketplace-browsing-and-listings/02-CONTEXT.md` — Product schema (deliveryType, sellerId), key encryption decisions (D-15 through D-17)

### State Notes
- `.planning/STATE.md` — Critical implementation notes on race conditions (key assignment, wallet double-spend)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/crypto.ts` — `encryptKey` / `decryptKey` — already in place for key reveal
- `lib/auth-middleware.ts` — `requireAuth()` — wraps all protected routes
- `lib/email.ts` — email sending utility; use for delivery notification + key email
- `app/[locale]/dashboard/` — tabbed seller dashboard; Orders tab needs delivery UI
- `components/ui/` — Dialog, Button, Badge, Textarea from shadcn/ui — use for delivery modal

### Established Patterns
- `prisma.$transaction()` for all atomic operations (key assignment + order status update must be one transaction)
- `requireAuth()` on all buyer/seller API routes
- Zod schemas in API routes for request validation
- `NextResponse.json({ error: string })` for errors
- `getLocalizedText(json, locale, fallback)` for multilingual product fields

### Integration Points
- `app/api/orders/` — create new order endpoint + key reveal endpoint
- `app/api/payment/` — gateway initiate + callback/webhook endpoints
- Vercel Cron — `vercel.json` cron entry for auto-confirm sweep
- `app/[locale]/orders/` — buyer-facing order history and key reveal UI
- `app/[locale]/dashboard/` — seller Orders tab for manual delivery

</code_context>

<specifics>
## Specific Ideas

- Gateway selection at checkout: render as a grid of gateway logos/names (QI Card, ZainCash, FIB, Asia Pay, Fast Pay) — familiar to Iraqi buyers; visual selection beats a dropdown
- "Reveal Key" button: show the key in a monospace font inside a bordered box with a one-click copy button — reduces transcription errors
- Seller delivery modal: textarea for credentials + a preview of what the buyer will see — builds seller confidence
- Auto-confirm cron: log each auto-confirm to AuditLog with event=AUTO_CONFIRMED so admin can see which orders auto-resolved

</specifics>

<deferred>
## Deferred Ideas

- Wallet top-up (gateway → wallet balance) — Phase 4
- Buyer/seller in-order chat — Phase 6
- Admin gateway enable/disable UI — Phase 7
- ORDER-01 (wallet-balance purchase) — Phase 4 activates this once wallet top-up is live; Phase 3 includes the deduction logic but the path is only reachable if balance > 0
- Cryptocurrency payment support — v2 (out of scope)
- Real-time delivery status (WebSocket) — v2; polling or page refresh is sufficient for v1

</deferred>

---

*Phase: 03-purchase-and-delivery*
*Context gathered: 2026-05-03*
