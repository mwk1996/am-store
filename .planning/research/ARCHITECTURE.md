# Architecture Patterns: Multi-Seller Digital Goods Marketplace

**Domain:** Multi-seller digital goods marketplace (licenses, game accounts, gift cards)
**Researched:** 2026-05-02
**Confidence:** HIGH — derived directly from existing codebase and schema

---

## Current State Assessment

The codebase is further along than a blank slate. The Prisma schema already defines the full
multi-seller model (User with Role enum, Wallet, Product with sellerId, Order with buyerId +
sellerId, Transaction, Dispute, Message, Notification). Service layer files exist for escrow,
wallet, key assignment, orders, and notifications. The auth layer has two tracks: NextAuth
(admin via AdminUser legacy table) and a custom JWT middleware (`lib/auth-middleware.ts`) used
by the new marketplace API routes.

The critical observation: the schema and services are designed for the target state. The gaps
are in the UI layer, the external payment top-up flow, the auto-confirm timer, and wiring the
existing auth split into a coherent single-token strategy.

---

## Recommended Architecture

### Domain Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App Router                       │
│                                                                 │
│  app/[locale]/                                                  │
│  ├── (public)/            # No auth — marketplace browsing      │
│  │   ├── page.tsx         # Home / featured listings            │
│  │   ├── marketplace/     # Browse + search + filter            │
│  │   └── products/[id]/   # Product detail + buy button         │
│  │                                                              │
│  ├── (auth)/              # Register / Login pages              │
│  │   ├── login/                                                 │
│  │   └── register/                                              │
│  │                                                              │
│  ├── (buyer)/             # Requires BUYER or SELLER role       │
│  │   ├── dashboard/       # Buyer overview                      │
│  │   ├── orders/          # Order list + detail                 │
│  │   │   └── [id]/        # Order detail, delivery confirmation │
│  │   ├── wallet/          # Balance, top-up, tx history         │
│  │   └── disputes/        # Dispute list + submit               │
│  │                                                              │
│  ├── (seller)/            # Requires SELLER role                │
│  │   ├── seller/                                                │
│  │   │   ├── dashboard/   # Earnings, pending actions           │
│  │   │   ├── products/    # CRUD for own products               │
│  │   │   ├── orders/      # Incoming orders, deliver action     │
│  │   │   └── withdrawals/ # Request payout                      │
│  │                                                              │
│  └── admin/               # Requires ADMIN role (NextAuth)      │
│      ├── dashboard/                                             │
│      ├── users/                                                 │
│      ├── products/                                              │
│      ├── orders/                                                │
│      ├── disputes/                                              │
│      └── withdrawals/                                           │
│                                                                 │
│  app/api/                                                       │
│  ├── auth/                # login, register, me (JWT custom)    │
│  ├── auth/[...nextauth]/  # ADMIN NextAuth only                 │
│  ├── marketplace/         # Public product listing + search     │
│  ├── products/            # Seller CRUD (owns product)          │
│  ├── orders/              # Create, list, deliver, confirm      │
│  ├── wallet/              # Balance, top-up, transactions       │
│  ├── reviews/             # Post-completion reviews             │
│  ├── disputes/            # Open/view disputes                  │
│  ├── messages/            # Chat messages per order             │
│  ├── notifications/       # Read/mark notifications             │
│  └── admin/               # Admin-scoped management             │
└─────────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Auth Required | Communicates With |
|-----------|---------------|---------------|-------------------|
| Public marketplace | Browse, search, filter products | None | `api/marketplace` |
| Product detail page | Show listing, stock count, buy CTA | None (buy requires login) | `api/marketplace`, `api/products/[id]` |
| Buyer dashboard | Order history, wallet balance summary | BUYER/SELLER | `api/orders`, `api/wallet` |
| Order detail page | View delivery, confirm receipt, open dispute | BUYER/SELLER (own order) | `api/orders/[id]`, `api/messages`, `api/disputes` |
| Wallet page | Top-up via payment gateway, tx history | BUYER/SELLER | `api/wallet`, `api/payment` |
| Seller products | CRUD own listings, bulk key upload | SELLER | `api/products`, `api/admin/upload` (keys) |
| Seller orders | Incoming orders, deliver action | SELLER | `api/orders/[id]/deliver` |
| Chat widget | Per-order real-time messaging | BUYER/SELLER (order party) | `api/messages`, polling or SSE |
| Admin panel | Full oversight, dispute resolution | ADMIN | `api/admin/*` |

---

## Seller Isolation

Seller isolation is enforced at three layers:

**1. Database Layer**
Every `Product` row has a `sellerId` foreign key. `ProductKey` rows cascade from Product, so
keys are implicitly scoped to the seller who owns the product. Order rows carry both `buyerId`
and `sellerId` denormalized — this avoids joins for the most common access pattern (list my
orders).

**2. Service / API Layer**
All seller-facing API routes must verify `product.sellerId === user.userId` before any mutation.
The existing `POST /api/orders/[id]/deliver` already enforces `order.sellerId !== user.userId`.
The pattern to follow in every seller route:
```typescript
if (resource.sellerId !== user.userId) return jsonError("Forbidden", 403);
```

**3. Route Group Layer (App Router)**
The `(seller)` route group layout runs a server-side role check. If the JWT token does not
carry `role: SELLER`, the layout redirects to `/login`. This prevents the page from even
rendering, independent of API guards.

Buyers cannot see other buyers' data. The `getByIdForUser` pattern in `orderService` checks
`order.buyerId === userId || order.sellerId === userId` and returns null otherwise — the
calling route then returns 404 (not 403, to avoid information leak).

---

## Delivery Flow: Instant vs Manual

### Instant Delivery (ProductType: SOFTWARE_KEY)

```
Buyer clicks Buy
       │
       ▼
POST /api/orders
  • Verify buyer is authenticated
  • Verify product.type === SOFTWARE_KEY
  • Verify at least 1 unused key exists (pre-check, not atomic)
  • Create Order (status: PENDING)
  • escrowService.holdFunds()
    └─ Deducts buyer wallet.balance
    └─ Increments buyer wallet.pendingBalance (platform hold)
    └─ Creates ESCROW_HOLD Transaction
    └─ Sets Order status: PAID
       │
       ▼
POST /api/orders/[id]/deliver  ← called immediately by system after PAID
  • keyService.assignKey() inside Prisma $transaction
    └─ Finds first unused key (optimistic, not SELECT FOR UPDATE)
    └─ Sets key.isUsed = true, key.orderId = orderId
  • Sets Order status: DELIVERED
  • Notifies buyer
       │
       ▼
Buyer views order detail  ← key revealed here (never on listing page)
       │
       ▼
Auto-confirm timer fires (e.g. 72h) OR buyer clicks Confirm
POST /api/orders/[id]/confirm
  • escrowService.releaseFunds()
    └─ Decrements buyer wallet.pendingBalance
    └─ Credits seller wallet.balance (amount - commission)
    └─ Creates ESCROW_RELEASE Transaction
    └─ Sets Order status: COMPLETED, escrowReleasedAt
  • Notifies seller
```

**Race condition note:** The current `keyService.assignKey` does a non-atomic findMany + update.
Under concurrent load this can double-assign. Fix: use a raw `SELECT ... FOR UPDATE SKIP LOCKED`
query inside the Prisma `$transaction`. This is a build-time concern for Phase 1.

### Manual Delivery (ProductType: GAME_ACCOUNT)

```
Buyer clicks Buy
       │
       ▼
POST /api/orders  (same as above, escrow held, status: PAID)
       │
       ▼
Seller receives notification → goes to seller/orders
       │
       ▼
Seller prepares account credentials
POST /api/orders/[id]/deliver
  • For GAME_ACCOUNT: no key assignment — seller sends credentials via Message
  • Sets Order status: DELIVERED
  • Notifies buyer with message to check chat
       │
       ▼
Buyer opens chat on order detail page
  • Seller has already posted account credentials in the per-order chat
  • Buyer verifies credentials work
       │
       ▼
Buyer clicks Confirm  (or auto-confirm after delivery window expires)
POST /api/orders/[id]/confirm  → same escrow release as instant flow
```

**Delivery window enforcement:** A background job (cron via Vercel Cron or a lightweight
queue) should auto-confirm orders that have been DELIVERED for more than N hours (72h
default). Without this, sellers are not paid if buyers ghost. This is a Phase 2 concern
but the schema already supports it (escrowReleasedAt timestamp).

**Dispute window:** Buyer can open a dispute only while Order.status is DELIVERED (before
confirmation). Once COMPLETED, escrow is released and a refund requires admin action on
the seller's wallet directly.

---

## Wallet / Escrow Flow

### Balance Model

```
User.Wallet
├── balance          — spendable by user
└── pendingBalance   — platform-held escrow (buyer view: "in escrow", seller view: N/A)
```

The `pendingBalance` field on the buyer wallet acts as the escrow ledger. The platform
does not hold a separate platform wallet account in the current schema. This is an
acceptable simplification for v1: the pending amount is real money already debited from
the buyer but not yet credited to anyone.

### Money States

```
State               balance  pendingBalance  Note
────────────────────────────────────────────────────────────────
After top-up        +X       0               Buyer wallet funded
After purchase      -X       +X              Escrow hold
After confirm       -X       -X (seller +Y)  Released (Y = X - commission)
After refund        +X       -X              Returned to buyer
```

### Wallet Top-Up Flow

```
Buyer → POST /api/wallet/topup
  • Creates a payment initiation with Iraqi gateway / Stripe
  • Records a PENDING Transaction (type: CREDIT)
  
Payment gateway → POST /api/payment/callback
  • Verifies gateway signature
  • Finds PENDING Transaction by gateway reference
  • Updates wallet.balance += amount
  • Sets Transaction.status = COMPLETED
```

This is the same idempotency pattern as the original license store. The callback must
check if the Transaction is already COMPLETED before incrementing to handle duplicate
callbacks.

### Seller Withdrawal Flow

```
Seller → POST /api/wallet/withdraw (amount)
  • Checks wallet.balance >= amount
  • Creates WithdrawalRequest (status: PENDING)
  • Does NOT deduct balance yet (admin must approve)

Admin → PATCH /api/admin/withdrawals/[id]
  • If APPROVED:
    └─ Deducts wallet.balance
    └─ Creates WITHDRAWAL Transaction
    └─ Sets WithdrawalRequest.status = APPROVED
  • If REJECTED:
    └─ Sets WithdrawalRequest.status = REJECTED (no balance change)
```

---

## Auth Architecture: Two-Track Problem

The codebase currently has two authentication systems running in parallel:

| Track | Used For | Mechanism |
|-------|----------|-----------|
| NextAuth (JWT session cookie) | Admin panel | `getServerSession`, `useSession` |
| Custom JWT (Bearer / `mp_token` cookie) | Buyer/Seller APIs | `lib/auth-middleware.ts` verifyToken |

The `AdminUser` legacy model is separate from the `User` model. This means an admin cannot
also be a buyer/seller in the current schema.

**Recommended resolution for v1:**
- Migrate admin login to use the `User` model with `role: ADMIN` — the schema already has it.
- Replace `AdminUser` lookups in `lib/auth.ts` with `User` lookups.
- Keep NextAuth for admin session (cookie-based, standard SSR pattern).
- Keep the custom JWT middleware for buyer/seller API routes.
- The middleware.ts must protect `(seller)` and `(buyer)` route groups using the custom JWT,
  not NextAuth, because NextAuth session cookies are not available in Edge middleware on
  App Router without explicit config.

**Alternative (simpler for v1):** Extend NextAuth to handle all three roles, drop the
custom JWT entirely, and use `getServerSession` in API routes. This reduces code surface
but requires refactoring the existing custom JWT routes.

The two-track approach is already coded and works. Unifying is a Phase 2 cleanup item.

---

## DB Schema: What Needs Adding

The current schema is largely complete for the target feature set. Gaps:

| Gap | Change Needed | Priority |
|-----|---------------|----------|
| No `deliveryType` on Product | Add `deliveryType` enum: `INSTANT` / `MANUAL` to Product | Phase 1 — needed before order flow |
| No auto-confirm deadline | Add `confirmDeadline DateTime?` to Order (set on DELIVERED) | Phase 1 |
| No seller profile / bio | Add `SellerProfile` model or extend `User` with `bio`, `storeName` | Phase 2 |
| No product-level stock count denormalized | Add `stockCount Int @default(0)` to Product, keep in sync via trigger or service layer | Phase 2 (performance) |
| Key encryption not enforced by schema | Schema comment says "stored encrypted" but no encryption layer exists yet | Phase 1 security |
| No payment gateway reference on wallet top-up | Transaction has `orderId?` but top-up transactions need a `gatewayRef` field | Phase 1 wallet |

**Migration order:**
1. Add `deliveryType` to Product + `confirmDeadline` to Order (migrate before building order flow)
2. Migrate AdminUser → User ADMIN (before building admin panel revamp)
3. Add seller profile fields (before seller onboarding UI)
4. Add `gatewayRef` to Transaction (before wallet top-up)

---

## Build Order Implications

The dependency graph drives phase ordering:

```
Phase 1: Auth + User Accounts
  • Register/Login for buyers and sellers (custom JWT track)
  • Wallet creation on registration
  • Role-based middleware for route groups
  └─ Unblocks: everything else

Phase 2: Marketplace + Seller Listings
  • Seller can create products, upload keys
  • Public browse/search (no auth)
  • Product detail page with stock count
  └─ Unblocks: purchase flow

Phase 3: Purchase + Delivery Flow
  • Order creation → escrow hold
  • Instant delivery (key reveal)
  • Manual delivery (seller posts credentials via chat)
  • Buyer confirm → escrow release
  └─ Unblocks: reviews, disputes

Phase 4: Wallet + Payments
  • Wallet top-up via payment gateway
  • Transaction history
  • Seller withdrawal requests
  └─ Can partially parallel with Phase 3

Phase 5: Trust Layer
  • Reviews (post-COMPLETED orders only)
  • Disputes (DELIVERED orders only)
  • Admin dispute resolution
  └─ Depends on Phase 3

Phase 6: Real-time Chat + Notifications
  • Per-order messaging (polling first, SSE/WebSocket later)
  • Notification bell + mark-read
  └─ Can start in Phase 3 for manual delivery, formalize in Phase 6
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Exposing Key Values in Listing or Order List APIs
**What:** Returning `assignedKey.keyValue` in order list responses or product APIs
**Why bad:** Keys leak to any request that can list orders (e.g. a different buyer's session bug)
**Instead:** Return `keyValue` only in the single order detail endpoint, after verifying
`order.buyerId === user.userId` and `order.status IN (DELIVERED, COMPLETED)`

### Anti-Pattern 2: Mutating Wallet Balance Outside a Prisma $transaction
**What:** Updating `wallet.balance` and creating a `Transaction` record in two separate Prisma calls
**Why bad:** A failure between the two calls leaves the ledger inconsistent
**Instead:** Always use `prisma.$transaction()` for any wallet mutation — the existing
`escrowService` and `walletService` already do this correctly

### Anti-Pattern 3: Trusting `product.sellerId` From the Request Body
**What:** Accepting sellerId in the order creation body and using it directly
**Why bad:** Buyer can spoof the sellerId
**Instead:** Always read `product.sellerId` from the database after finding the product by
productId — never trust client-provided seller identity (existing code does this correctly)

### Anti-Pattern 4: Single-Step Order + Key Assignment
**What:** Trying to create the order and assign a key in one non-transactional block
**Why bad:** Payment can succeed but key assignment fails, leaving order PAID with no key
**Instead:** Use `prisma.$transaction()` for the deliver step, as the existing
`/deliver` route already does for SOFTWARE_KEY products

### Anti-Pattern 5: Building Chat With WebSockets Before Core Flow Works
**What:** Prioritizing real-time chat infra in early phases
**Why bad:** Significant infrastructure complexity (Pusher, Ably, or self-hosted socket server)
that blocks delivery of core purchase value
**Instead:** Use polling (`/api/messages?orderId=X&after=timestamp`) for chat in Phase 3.
Upgrade to SSE or WebSocket only after the core transaction flow is stable.

---

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| Key assignment race | Fix with SELECT FOR UPDATE | Already handled | Partition key table by productId |
| Wallet balance reads | Direct DB query | Add Redis cache for balance | Read replica |
| Product search | ILIKE on title | Add pg_trgm index + full-text search | Dedicated search service (Typesense/Meilisearch) |
| Notifications | Synchronous create in API handlers | Move to background job queue | Fan-out service |
| Chat messages | Poll every 5s | SSE with 30s keepalive | WebSocket with Redis pub/sub |
| Order auto-confirm | Vercel Cron (1/day) | Vercel Cron (hourly) | Queue-based scheduler |

---

## Sources

- Derived from existing codebase: `prisma/schema.prisma`, `services/escrow.service.ts`,
  `services/key.service.ts`, `services/order.service.ts`, `services/wallet.service.ts`,
  `lib/auth-middleware.ts`, `app/api/orders/route.ts`,
  `app/api/orders/[id]/deliver/route.ts`, `app/api/orders/[id]/confirm/route.ts`
- Confidence: HIGH — all claims are grounded in the existing code, not inferred from external sources
