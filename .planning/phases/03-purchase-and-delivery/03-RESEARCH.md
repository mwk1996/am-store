# Phase 3: Purchase & Delivery - Research

**Researched:** 2026-05-03
**Domain:** Iraqi payment gateway integration, atomic key assignment, manual delivery workflow, Vercel Cron, order history
**Confidence:** HIGH (codebase analysis) / MEDIUM (ZainCash API specifics — no official sandbox docs accessible)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Gateway is primary payment path; wallet balance is secondary. ORDER-02 (gateway payment) fully implemented in Phase 3. ORDER-01 (wallet) is available when buyer has sufficient balance.
- **D-02:** Five Iraqi gateways supported: QI Card, ZainCash, FIB, Asia Pay, Fast Pay. Buyer selects gateway at checkout via a tile grid.
- **D-03:** `lib/payment/` exports a common interface: `initiate(order, gateway)`, `verify(ref, gateway)`, `webhook handler per gateway`. ZainCash is the reference implementation; others slot in without changing checkout logic.
- **D-04:** All five gateways treated as enabled in Phase 3. Abstraction layer must accept a config that can be toggled (Phase 7 enables/disables via admin panel).
- **D-05:** Add `buyerId String?` and `sellerId String?` to Order model. `guestEmail` remains as nullable for legacy records. All new Phase 3+ orders require `buyerId`.
- **D-06:** Add `sellerAmount Decimal` and `commissionAmount Decimal` to Order. Computed and stored at purchase time. Commission = 10%.
- **D-07:** Add `disputeDeadline DateTime?` to Order. INSTANT = now + 3 days; MANUAL = confirmedAt + 14 days.
- **D-08:** Add `confirmDeadline DateTime?` to Order (MANUAL orders). Set at delivery time: deliveredAt + 24 hours. Cron auto-confirms when past.
- **D-09:** Key assignment MUST use `SELECT FOR UPDATE SKIP LOCKED` (raw Prisma query). No optimistic locking.
- **D-10:** Wallet deduction MUST be a single atomic `UPDATE wallet SET balance = balance - amount WHERE id = $id AND balance >= amount`. rowsAffected = 0 means insufficient balance.
- **D-11:** Manual delivery window = 24 hours from order creation.
- **D-12:** Seller delivers credentials via Dashboard → Orders tab → "Deliver" modal with textarea.
- **D-13:** Buyer sees delivery status on Orders page: "Awaiting Delivery" → "Delivered — Confirm Receipt" → "Completed". Cron auto-confirms after 24h.
- **D-14:** Instant key reveal: buyer redirected to `/[locale]/orders/[id]` after payment; key decrypted server-side.
- **D-15:** Re-access from order history: "Reveal Key" button makes authenticated API call (`GET /api/orders/[id]/key`). Key appears inline. Unlimited re-access.
- **D-16:** Keys NEVER in list responses. Only returned by `/api/orders/[id]/key` with ownership + status verification.
- **D-17:** Dispute window: 3 days (INSTANT), 14 days from confirmedAt (MANUAL).
- **D-18:** Every delivery event logged to `AuditLog` table: orderId, event enum, timestamp, ip, userAgent.
- **D-19:** Commission = 10% fixed. `commissionAmount` stored on Order at purchase time.

### Claude's Discretion

- Exact Prisma migration file naming and ordering
- Cron schedule for auto-confirm sweep (every 15 minutes is reasonable)
- Email template design for delivery notification and key email
- Loading states and skeleton UI on the orders page
- Error message copy for failed gateway redirects

### Deferred Ideas (OUT OF SCOPE)

- Wallet top-up (Phase 4)
- Buyer/seller in-order chat (Phase 6)
- Admin gateway enable/disable UI (Phase 7)
- ORDER-01 (wallet-balance purchase) — Phase 4 activates; Phase 3 includes deduction logic only
- Cryptocurrency payment support (v2)
- Real-time delivery status WebSocket (v2)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ORDER-01 | Buyer can purchase using wallet balance | D-10 atomic deduction; wallet deduction path in checkout; escrow hold; Phase 4 activates top-up |
| ORDER-02 | Buyer can purchase via direct gateway payment | ZainCash plugin pattern; gateway abstraction interface; callback → key assignment flow |
| ORDER-03 | Buyer can view full order history with status | New `/api/orders` buyer endpoint; `orderService.listForUser` implementation; `/[locale]/orders` page redesign |
| ORDER-04 | Buyer can re-view/re-download purchased key | `GET /api/orders/[id]/key` endpoint with auth + ownership; inline key reveal in order history row |
| DELIVERY-01 | Instant key reveal on-screen after payment | Payment callback → key assignment in same transaction; order detail page shows decrypted key |
| DELIVERY-02 | Key sent via email after payment | `sendLicenseEmail` already exists in `lib/email.ts`; wire after successful key assignment |
| DELIVERY-03 | Seller posts credentials via delivery interface | Seller Orders tab in dashboard; DeliverCredentialsModal; `POST /api/orders/[id]/deliver` |
| DELIVERY-04 | Buyer confirms receipt, releasing escrow | `POST /api/orders/[id]/confirm`; sets status = COMPLETED; AuditLog event; disputeDeadline from confirmedAt |
| DELIVERY-05 | Auto-confirm after 24h if buyer doesn't confirm | Vercel Cron `GET /api/cron/auto-confirm`; sweep orders where confirmDeadline < now AND status = DELIVERED |
| DELIVERY-06 | Delivery events logged with timestamp, IP, userAgent | `AuditLog` table; log KEY_REVEALED, CREDENTIALS_DELIVERED, BUYER_CONFIRMED, AUTO_CONFIRMED |
</phase_requirements>

---

## Summary

Phase 3 is the most technically dense phase of the project. It touches six distinct problem domains: payment gateway abstraction, atomic database operations for concurrency safety, schema migration with backward-compatible nullable fields, a complete order lifecycle UI for both buyer and seller, a background cron job for auto-confirmation, and an audit logging table for chargeback defense.

The existing codebase already has significant scaffolding that needs to be completed rather than created from scratch. `lib/payment/gateway.ts` has a single-gateway placeholder that must be refactored into a multi-gateway plugin system. `services/key.service.ts` has `assignKey()` but it uses a read-then-write pattern (findFirst + update) without `SELECT FOR UPDATE SKIP LOCKED` — this is the critical race condition that D-09 requires fixing. `services/order.service.ts`, `app/api/orders/[id]/confirm/route.ts`, and `app/api/orders/[id]/deliver/route.ts` exist as stubs returning 501 or empty arrays.

The buyer orders page (`/[locale]/orders`) currently uses a guest email-lookup pattern — Phase 3 replaces this with an authenticated buyer view. The order detail page (`/[locale]/orders/[id]`) has a sophisticated UI already built (EscrowTimeline, OrderActions, ChatWindow components referenced) but pulls from APIs that are not yet implemented.

**Primary recommendation:** Fix the key assignment race condition first (D-09), then migrate the schema, then complete the API stubs, then wire the gateway abstraction, then build the cron and audit log last.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Payment initiation | API / Backend | — | Must never expose gateway secrets to browser |
| Gateway callback / webhook | API / Backend | — | Must verify signature server-side before any state change |
| Atomic key assignment | Database (Prisma $transaction + raw SQL) | API / Backend | SELECT FOR UPDATE SKIP LOCKED requires DB-level locking |
| Wallet deduction | Database (raw UPDATE) | API / Backend | Single-statement CAS prevents double-spend |
| Order creation | API / Backend | — | Validates product stock, creates pending order, returns orderId |
| Buyer order history | Frontend Server (Server Component) | API / Backend | Auth check server-side; list data fetched server-side |
| Key reveal (re-access) | API / Backend | Frontend Client | Authenticated endpoint; client renders decrypted value |
| Seller delivery modal | Frontend Client | API / Backend | Interactive form, must be client component |
| Delivery status timeline | Frontend Client | — | Pure display component driven by order status field |
| Auto-confirm sweep | Vercel Cron (API Route) | Database | Cron calls API route; API route issues bulk update |
| Audit logging | API / Backend | Database | Written synchronously inside the same transaction as the triggering event |
| Commission calculation | API / Backend | — | Computed at order creation; stored on Order row |

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | existing | ORM + `$queryRaw` for raw SQL | Already in use; `$queryRaw` supports typed raw queries including FOR UPDATE |
| `jsonwebtoken` | existing (implied) | JWT sign/verify for ZainCash | ZainCash uses JWT as its token format |
| `next-intl` | existing | i18n for all new page strings | Established in Phase 1 |
| `zod` | existing | Request validation | Established pattern in all API routes |
| shadcn/ui | existing | RadioGroup, Dialog, Textarea, Toast, Table, Badge | All components needed for Phase 3 already available |
| `lucide-react` | existing | Icons: Zap, Clock, Key, Send, Copy, Check, Loader2 | Established icon library |

### New for Phase 3
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zaincash` npm package | latest | Reference ZainCash integration | Reference for JWT payload structure; may not be used directly — implement natively to control all five gateways |

**Version verification note:** The `zaincash` npm package (`hamdongunner/zaincash`) is a community package. Do not install it as a dependency. Use it as a reference to understand the JWT payload shape and endpoint URLs, then implement natively in `lib/payment/providers/zaincash.ts`.

**Installation:** No new packages required. All needed libraries (jsonwebtoken, prisma, next-intl, zod, shadcn/ui) are already installed.

---

## Architecture Patterns

### System Architecture Diagram

```
Buyer Browser
     │
     ├── POST /api/orders           → Create PENDING order (productId, buyerId)
     │                                ├── Validate product has stock
     │                                ├── Compute sellerAmount + commissionAmount
     │                                └── Set disputeDeadline (INSTANT: +3d)
     │
     ├── POST /api/payment/initiate → Build JWT, call ZainCash init endpoint
     │   { orderId, gateway }         └── Return redirectUrl
     │
     │   [Browser redirects to ZainCash payment page]
     │
     ←── ZainCash POSTs callback → POST /api/payment/callback
                                    ├── Verify JWT signature (shared secret)
                                    ├── Idempotency check (order.status === PAID → skip)
                                    ├── $transaction {
                                    │     SELECT FOR UPDATE SKIP LOCKED on ProductKey
                                    │     UPDATE ProductKey SET isUsed=true, orderId
                                    │     UPDATE Order SET status=PAID, productKeyId
                                    │     INSERT AuditLog KEY_REVEALED
                                    │   }
                                    ├── sendLicenseEmail (async, non-blocking)
                                    └── Redirect → /[locale]/orders/[id]

Buyer Browser ──── GET /api/orders/[id]/key
                    ├── requireAuth()
                    ├── Verify buyer owns order
                    ├── Verify status IN (PAID, COMPLETED)
                    ├── decryptKey(productKey.keyValue)
                    ├── INSERT AuditLog KEY_REVEALED
                    └── Return { key: plaintext }

Seller Browser ─── POST /api/orders/[id]/deliver
                    ├── requireAuth(SELLER)
                    ├── Verify seller owns product
                    ├── Verify status === PAID
                    ├── $transaction {
                    │     UPDATE Order SET status=DELIVERED, deliveredAt, confirmDeadline=+24h
                    │     INSERT AuditLog CREDENTIALS_DELIVERED
                    │   }
                    └── sendDeliveryEmail to buyer

Buyer Browser ──── POST /api/orders/[id]/confirm
                    ├── requireAuth(BUYER)
                    ├── Verify buyer owns order
                    ├── Verify status === DELIVERED
                    ├── $transaction {
                    │     UPDATE Order SET status=COMPLETED, confirmedAt, disputeDeadline=+14d
                    │     INSERT AuditLog BUYER_CONFIRMED
                    │   }
                    └── (Phase 4 escrow release goes here)

Vercel Cron ─────── GET /api/cron/auto-confirm (every 15 min)
                    ├── Verify CRON_SECRET header
                    ├── Query: Orders WHERE status=DELIVERED AND confirmDeadline < now()
                    ├── For each: UPDATE status=COMPLETED, INSERT AuditLog AUTO_CONFIRMED
                    └── Return { confirmed: count }
```

### Recommended Project Structure (changes from current)

```
lib/payment/
├── types.ts                    # GatewayInterface, GatewayConfig, PaymentResult
├── index.ts                    # Dispatcher: initiate(order, gateway), verify(token, gateway)
└── providers/
    ├── zaincash.ts             # Reference implementation
    ├── qi-card.ts              # Stub (same interface)
    ├── fib.ts                  # Stub
    ├── asia-pay.ts             # Stub
    └── fast-pay.ts             # Stub

services/
├── key.service.ts              # Fix assignKey() → SELECT FOR UPDATE SKIP LOCKED
├── order.service.ts            # Implement listForUser(), getByIdForUser() with buyerId check
├── audit.service.ts            # NEW: logEvent(orderId, event, ip, userAgent)
└── escrow.service.ts           # Remains stub — Phase 4

app/api/
├── orders/
│   ├── route.ts                # POST: create order (add buyerId, sellerId, commission)
│   ├── [id]/
│   │   ├── route.ts            # GET: order detail (buyer auth + ownership)
│   │   ├── key/route.ts        # NEW: GET decrypted key (auth + ownership + status check)
│   │   ├── deliver/route.ts    # Complete stub → implement seller delivery
│   │   └── confirm/route.ts    # Complete stub → implement buyer confirm
├── payment/
│   ├── initiate/route.ts       # Refactor to accept { orderId, gateway }
│   └── callback/
│       └── [gateway]/route.ts  # Per-gateway webhook (or single with gateway param)
└── cron/
    └── auto-confirm/route.ts   # NEW: Vercel Cron handler

app/[locale]/
├── orders/
│   ├── page.tsx                # Replace email-lookup with authenticated order history
│   └── [id]/page.tsx           # Complete — key reveal wired to /api/orders/[id]/key
├── checkout/page.tsx           # Add gateway selector, add buyerId to order creation
└── dashboard/page.tsx          # Add Orders tab content with delivery interface
```

### Pattern 1: SELECT FOR UPDATE SKIP LOCKED (Key Assignment)

**What:** Prevents two concurrent payment callbacks from assigning the same key.
**When to use:** Inside any transaction that needs to claim exactly one row from a pool.

```typescript
// Source: Prisma docs + PostgreSQL docs [VERIFIED: github.com/prisma/prisma/issues/5983]
// In services/key.service.ts — replaces the current findFirst + update pattern

async assignKey(tx: Prisma.TransactionClient, productId: string, orderId: string) {
  // Raw query for SELECT FOR UPDATE SKIP LOCKED — Prisma has no native API for this
  const keys = await tx.$queryRaw<Array<{ id: string; keyValue: string }>>`
    SELECT id, "keyValue"
    FROM "ProductKey"
    WHERE "productId" = ${productId}
      AND "isUsed" = false
      AND "orderId" IS NULL
    ORDER BY "createdAt" ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `;

  if (keys.length === 0) {
    throw new Error("No available keys for this product");
  }

  const key = keys[0];

  return tx.productKey.update({
    where: { id: key.id },
    data: { isUsed: true, usedAt: new Date(), orderId },
  });
}
```

**Critical:** This ONLY works inside a `prisma.$transaction(async (tx) => { ... })` interactive transaction. The lock is released when the transaction commits or rolls back.

### Pattern 2: Gateway Plugin Interface

**What:** Each gateway is a module implementing a common interface. The dispatcher in `lib/payment/index.ts` selects the right provider by name.

```typescript
// Source: D-03 from CONTEXT.md + existing lib/payment/gateway.ts [VERIFIED: codebase]

// lib/payment/types.ts
export type GatewayName = "zaincash" | "qi-card" | "fib" | "asia-pay" | "fast-pay" | "wallet";

export interface GatewayProvider {
  initiate(order: OrderWithProduct, config: GatewayConfig): Promise<{ redirectUrl: string; gatewayRef: string }>;
  verifyCallback(payload: Record<string, unknown>, config: GatewayConfig): VerifyResult;
}

// lib/payment/index.ts
import { zaincashProvider } from "./providers/zaincash";
const providers: Record<GatewayName, GatewayProvider> = {
  "zaincash": zaincashProvider,
  "qi-card": stubProvider("QI Card"),
  "fib": stubProvider("FIB"),
  "asia-pay": stubProvider("Asia Pay"),
  "fast-pay": stubProvider("Fast Pay"),
};

export function getProvider(name: GatewayName): GatewayProvider {
  const p = providers[name];
  if (!p) throw new Error(`Unknown gateway: ${name}`);
  return p;
}
```

### Pattern 3: ZainCash JWT Flow

**What:** ZainCash uses JWT (signed with a shared secret) to pass payment data. The same secret is used to decode the callback token.

```typescript
// Source: github.com/hamdongunner/zaincash + npm package reverse-engineering [MEDIUM confidence]
// lib/payment/providers/zaincash.ts

import jwt from "jsonwebtoken";

const ZAINCASH_INIT_URL_PROD = "https://api.zaincash.iq/transaction/init";
const ZAINCASH_INIT_URL_TEST = "https://test.zaincash.iq/transaction/init";
const ZAINCASH_PAY_URL_PROD = "https://api.zaincash.iq/transaction/pay";
const ZAINCASH_PAY_URL_TEST = "https://test.zaincash.iq/transaction/pay";

interface ZainCashConfig {
  msisdn: string;       // Merchant wallet phone: "9647XXXXXXXXX"
  merchantId: string;   // Provided by ZainCash
  secret: string;       // Shared JWT secret from ZainCash
  production: boolean;
}

async function initiate(order, config: ZainCashConfig) {
  const payload = {
    amount: Number(order.product.price),  // IQD, minimum 250
    serviceType: "Other",                 // "Book"|"Food"|"Grocery"|"Pharmacy"|"Transportation"|"Other"
    msisdn: config.msisdn,
    orderId: order.id,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback/zaincash`,
    production: config.production,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 4, // 4h expiry
  };

  const token = jwt.sign(payload, config.secret);
  const initUrl = config.production ? ZAINCASH_INIT_URL_PROD : ZAINCASH_INIT_URL_TEST;

  const res = await fetch(initUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, merchantId: config.merchantId, lang: "ar" }),
  });
  const data = await res.json();
  // data.id = ZainCash transaction ID
  const payUrl = config.production ? ZAINCASH_PAY_URL_PROD : ZAINCASH_PAY_URL_TEST;
  return {
    redirectUrl: `${payUrl}?id=${data.id}`,
    gatewayRef: data.id,
  };
}

function verifyCallback(payload, config: ZainCashConfig) {
  // ZainCash sends: { token: "JWT..." } to redirectUrl
  const { token } = payload;
  const decoded = jwt.verify(token, config.secret) as {
    status: "success" | "failed";
    orderId: string;
    id: string;        // ZainCash transaction ID
    msg?: string;
  };
  return {
    valid: true,
    orderId: decoded.orderId,
    gatewayRef: decoded.id,
    status: decoded.status === "success" ? "success" : "failure",
  };
}
```

**WARNING:** ZainCash endpoint URLs and JWT payload field names are based on community sources [MEDIUM confidence]. Verify against actual ZainCash merchant documentation before going live. The field `serviceType` must match one of their allowed values.

### Pattern 4: Vercel Cron Setup

**What:** A scheduled GET handler that sweeps expired DELIVERED orders.
**When to use:** Auto-confirm DELIVERY-05.

```json
// vercel.json [VERIFIED: vercel.com/docs/cron-jobs]
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/auto-confirm",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

```typescript
// app/api/cron/auto-confirm/route.ts [VERIFIED: vercel.com/docs/cron-jobs/quickstart]
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditService } from "@/services/audit.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const expired = await prisma.order.findMany({
    where: {
      status: "DELIVERED",
      confirmDeadline: { lt: now },
    },
    select: { id: true },
  });

  let confirmed = 0;
  for (const order of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED", confirmedAt: now },
      });
      await auditService.log(tx, {
        orderId: order.id,
        event: "AUTO_CONFIRMED",
        ip: "cron",
        userAgent: "vercel-cron",
      });
    });
    confirmed++;
  }

  return NextResponse.json({ confirmed });
}
```

**Cron only fires in production deployments.** For local testing, call the endpoint manually with the `CRON_SECRET` header.

### Pattern 5: AuditLog Table + Service

```typescript
// Schema addition [ASSUMED: standard audit log pattern]
model AuditLog {
  id        String   @id @default(cuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])
  event     AuditEvent
  ip        String
  userAgent String
  createdAt DateTime @default(now())

  @@index([orderId])
  @@index([createdAt])
}

enum AuditEvent {
  KEY_REVEALED
  CREDENTIALS_DELIVERED
  BUYER_CONFIRMED
  AUTO_CONFIRMED
}
```

```typescript
// services/audit.service.ts
export const auditService = {
  async log(tx: Prisma.TransactionClient | typeof prisma, params: {
    orderId: string; event: AuditEvent; ip: string; userAgent: string;
  }) {
    return tx.auditLog.create({ data: params });
  },
};
```

### Anti-Patterns to Avoid

- **findFirst + update (read-then-write) for key assignment:** The existing `keyService.assignKey()` does this. MUST be replaced with `$queryRaw` SELECT FOR UPDATE SKIP LOCKED. Two simultaneous callbacks can both read the same key before either updates it.
- **Gateway callback without idempotency check:** The existing callback handler has an idempotency check (`if order.status === 'PAID' return already`). Keep this. Gateway callbacks can fire multiple times.
- **Returning key in list API responses:** `GET /api/orders` must never include `keyValue`. Key is only returned by `GET /api/orders/[id]/key` (D-16).
- **Running cron logic in middleware:** Cron handler must be its own route (`/api/cron/auto-confirm`), not called from middleware. Middleware timeout is too short.
- **Storing commission as percentage:** Store the computed `commissionAmount` decimal, not the rate. Rate changes must not retroactively affect old orders (D-06).
- **Using `status: "FAILED"` enum value:** The current `OrderStatus` enum in `schema.prisma` has no `FAILED` value. The existing `callback/route.ts` uses `"FAILED" as any` — Phase 3 must either add FAILED to the enum or use PENDING (let the order expire). Add to enum is cleaner.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT sign/verify | Custom crypto | `jsonwebtoken` (already in node_modules via NextAuth) | Timing-safe, standard, handles exp/iat |
| Row locking | Optimistic lock retry loops | `$queryRaw` FOR UPDATE SKIP LOCKED | Database-native, no retry needed, no starvation |
| Wallet CAS | Read balance, check, then update | Single `UPDATE ... WHERE balance >= amount` | Eliminates TOCTOU race entirely |
| Cron scheduling | Custom polling server | Vercel Cron + vercel.json | Zero infrastructure, integrates with deployment |
| Clipboard copy | `document.execCommand('copy')` | `navigator.clipboard.writeText()` | Modern API, already used in order detail page |
| Email sending | Raw SMTP | `lib/email.ts` (`sendLicenseEmail`) | Already implemented and tested |

**Key insight:** The database is the correct place to enforce uniqueness and exclusivity for key assignment. Application-level locks (Redis, in-memory) are unnecessary complexity when PostgreSQL row-level locking is available.

---

## Common Pitfalls

### Pitfall 1: Schema Migration Breaks Existing Routes

**What goes wrong:** Adding `buyerId String?` to Order makes it nullable, but existing `POST /api/orders` creates orders without `buyerId` (guest model). Phase 3 changes `POST /api/orders` to require `buyerId`. This will break the old guest checkout flow.

**Why it happens:** The checkout page (`/[locale]/checkout`) currently collects email (not JWT auth). It must be replaced.

**How to avoid:** Migrate schema first with buyerId as nullable. Then update the checkout page to redirect to login if no auth token. Simultaneously update `POST /api/orders` to set `buyerId` from the authenticated user. Old guest orders (guestEmail set, buyerId null) remain valid for read queries.

**Warning signs:** TypeScript errors in any route that previously used `order.guestEmail` for identity checks — that pattern must be replaced with `order.buyerId === user.userId`.

### Pitfall 2: ZainCash Callback is a GET Redirect, Not POST Webhook

**What goes wrong:** ZainCash sends the buyer back to `redirectUrl?token=JWT` via browser GET redirect. This is NOT a server-to-server webhook — it is a browser redirect. The buyer can manipulate URL parameters.

**Why it happens:** ZainCash's architecture differs from Stripe/PayPal (which send separate server-to-server webhooks). ZainCash embeds the result in a JWT sent as a query parameter to the redirect URL.

**How to avoid:** The callback endpoint must handle GET (browser redirect with `?token=JWT`). Verify the JWT signature using the shared secret. Never trust any other URL parameter. The JWT verification is the only trust anchor.

**Warning signs:** Treating the `orderId` query param directly without JWT decode first; using `verifyCallback(req.nextUrl.searchParams)` instead of decoding the JWT token parameter.

### Pitfall 3: Cron Runs in Production Only

**What goes wrong:** Vercel Cron does not fire for preview deployments or local dev. DELIVERY-05 appears to work in production but is untestable locally.

**Why it happens:** Vercel design — cron is a production-only feature.

**How to avoid:** The cron endpoint (`GET /api/cron/auto-confirm`) must be callable manually from the terminal with a curl command or a test script. Document the local test command in the task. Add an admin UI trigger in Phase 7 if needed.

**Warning signs:** Only testing auto-confirm via deployment — must be testable locally via direct API call.

### Pitfall 4: confirmDeadline vs disputeDeadline Confusion

**What goes wrong:** `confirmDeadline` (D-08) is for the cron to auto-confirm (24h from deliveredAt). `disputeDeadline` (D-07) is for Phase 5 trust layer (3d INSTANT, 14d MANUAL from confirmedAt). They are set at different times and mean different things.

**How to avoid:** Set `confirmDeadline` when seller delivers (`deliveredAt + 24h`). Set `disputeDeadline` when order reaches COMPLETED (`confirmedAt + 14d` for MANUAL, or at creation `createdAt + 3d` for INSTANT). These are two separate fields written at two separate moments.

### Pitfall 5: Key Reveal Before Payment Confirmed

**What goes wrong:** If the gateway sends a `pending` status callback and the handler returns early, but the user lands on the success page anyway (e.g., ZainCash browser redirect fires before the backend callback), the key reveal endpoint would show nothing. User sees a blank key box.

**How to avoid:** The order detail page must poll or show a "payment confirming..." state when status is PENDING. Only show the key reveal button when `order.status === "PAID" || order.status === "COMPLETED"`. The `GET /api/orders/[id]/key` endpoint must reject requests on PENDING orders.

### Pitfall 6: `FAILED` OrderStatus Missing from Enum

**What goes wrong:** The existing `callback/route.ts` uses `"FAILED" as any` because the `OrderStatus` enum has no FAILED value. This will cause TypeScript errors and silent failures in Phase 3 if not fixed.

**How to avoid:** Add `FAILED` to the `OrderStatus` enum in `schema.prisma` and run `prisma generate`. This requires a migration.

---

## Code Examples

### Order Creation (POST /api/orders) — Phase 3 Pattern

```typescript
// Source: existing /app/api/orders/route.ts + D-05, D-06, D-07 [VERIFIED: codebase + CONTEXT.md]
const createOrderSchema = z.object({
  productId: z.string().min(1),
  gateway: z.enum(["zaincash", "qi-card", "fib", "asia-pay", "fast-pay", "wallet"]),
  locale: z.string().default("en"),
});

export async function POST(req: NextRequest) {
  const user = verifyToken(req);
  if (!user) return jsonError("Unauthorized", 401);

  const { productId, gateway, locale } = createOrderSchema.parse(await req.json());
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { _count: { select: { keys: { where: { isUsed: false } } } } },
  });

  if (!product || product._count.keys === 0) {
    return jsonError("Product out of stock", 409);
  }

  const price = Number(product.price);
  const commissionAmount = price * 0.10;
  const sellerAmount = price * 0.90;
  const disputeDeadline = product.deliveryType === "INSTANT"
    ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    : null; // MANUAL: set at confirmedAt

  const order = await prisma.order.create({
    data: {
      buyerId: user.userId,
      sellerId: product.sellerId,
      productId,
      locale,
      commissionAmount,
      sellerAmount,
      disputeDeadline,
      status: "PENDING",
    },
  });

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
```

### Atomic Wallet Deduction (ORDER-01 path)

```typescript
// Source: D-10 from CONTEXT.md [VERIFIED: design decision]
// Must be raw SQL — Prisma update() does not support WHERE with balance check

const result = await prisma.$executeRaw`
  UPDATE "Wallet"
  SET balance = balance - ${amount}
  WHERE id = ${walletId}
    AND balance >= ${amount}
`;

if (result === 0) {
  throw new Error("Insufficient balance");
}
// result === 1 means success
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Guest email-based order lookup | Authenticated buyer order history (JWT) | Phase 3 | Old `/[locale]/orders` page replaced |
| Single gateway (placeholder) | Multi-gateway plugin system | Phase 3 | `lib/payment/` restructured |
| findFirst + update key assignment | SELECT FOR UPDATE SKIP LOCKED | Phase 3 | Eliminates duplicate key delivery |
| 501 stub for deliver/confirm | Full implementation | Phase 3 | DELIVERY-03, DELIVERY-04 become live |

**Deprecated/outdated from existing code:**
- `app/[locale]/orders/page.tsx` email lookup form — replaced with authenticated order history
- `app/api/orders/route.ts` guest order creation (guestEmail required) — replaced with buyer-auth order creation
- `lib/payment/gateway.ts` single-function gateway — restructured as plugin system

---

## Open Questions (RESOLVED)

1. **ZainCash sandbox credentials** — RESOLVED: Use mock/placeholder credentials for Phase 3 development. Real merchant credentials needed only for production deployment. ZainCash uses `production: boolean` toggle in the provider config.

2. **`FAILED` in OrderStatus enum** — RESOLVED: Add `FAILED` to the `OrderStatus` enum (Plan 01 implements this). This removes the `as any` cast in the callback handler and is semantically correct.

3. **Wallet model missing from schema** — RESOLVED: Per CONTEXT.md deferred section, ORDER-01 wallet path is activated by Phase 4 once wallet top-up is live. Phase 3 MUST include the wallet deduction service logic (D-10 atomic `$executeRaw`) even though the path cannot be triggered without a positive balance. No separate Wallet model needed — add `walletBalance Decimal @default(0)` to the User model in the Phase 3 migration. The deduction service function `walletService.deductBalance(userId, amount, tx)` lives in `services/wallet.service.ts` and is called from the order creation route behind a `gateway === "wallet"` branch.

4. **`confirmedAt` field missing from schema** — RESOLVED: Add `confirmedAt DateTime?` to Order model in the Phase 3 migration (Plan 01 implements this).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Prisma + FOR UPDATE SKIP LOCKED | ✓ (existing) | existing | — |
| Node.js jsonwebtoken | ZainCash JWT | ✓ (via NextAuth) | existing | — |
| Vercel CLI / deployment | Cron jobs | — (local dev) | — | Manual API call with curl + CRON_SECRET |
| ZainCash merchant credentials | ORDER-02 live | ✗ | — | Mock/placeholder flow for dev |

**Missing dependencies with no fallback:**
- ZainCash merchant credentials (msisdn, merchantId, secret) — required for live payment. Phase 3 implementation can use mock/placeholder; needs real credentials for production.

**Missing dependencies with fallback:**
- Vercel Cron (local) — test via direct GET to `/api/cron/auto-confirm` with Authorization header.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, vitest.config, or test/ directory |
| Config file | None — Wave 0 must create |
| Quick run command | `npx vitest run --reporter=verbose` (after setup) |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ORDER-01 | Wallet deduction fails when balance < amount | unit | `npx vitest run tests/wallet.test.ts` | ❌ Wave 0 |
| ORDER-02 | Gateway initiate returns redirectUrl | unit | `npx vitest run tests/payment.test.ts` | ❌ Wave 0 |
| ORDER-02 | Callback with valid JWT sets order PAID | unit | `npx vitest run tests/payment.test.ts` | ❌ Wave 0 |
| ORDER-02 | Idempotent callback (already PAID → skip) | unit | `npx vitest run tests/payment.test.ts` | ❌ Wave 0 |
| ORDER-03 | Order history returns only caller's orders | unit | `npx vitest run tests/orders.test.ts` | ❌ Wave 0 |
| ORDER-04 | Key reveal rejected for wrong buyer | unit | `npx vitest run tests/orders.test.ts` | ❌ Wave 0 |
| DELIVERY-01 | assignKey() locks row — no duplicate assignment | unit | `npx vitest run tests/key.test.ts` | ❌ Wave 0 |
| DELIVERY-05 | Auto-confirm cron updates expired DELIVERED orders | unit | `npx vitest run tests/cron.test.ts` | ❌ Wave 0 |
| DELIVERY-06 | AuditLog entry created on KEY_REVEALED | unit | `npx vitest run tests/audit.test.ts` | ❌ Wave 0 |

**Manual-only tests:**
- DELIVERY-02: Email delivery (Resend/SMTP) — verify in staging with real mailbox
- DELIVERY-03/04: Seller modal + buyer confirm — verify via browser smoke test

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=dot` (fast subset)
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/key.test.ts` — covers DELIVERY-01 (assignKey race condition)
- [ ] `tests/payment.test.ts` — covers ORDER-02 (ZainCash JWT verify, callback idempotency)
- [ ] `tests/orders.test.ts` — covers ORDER-03, ORDER-04
- [ ] `tests/wallet.test.ts` — covers ORDER-01 (atomic deduction)
- [ ] `tests/cron.test.ts` — covers DELIVERY-05
- [ ] `tests/audit.test.ts` — covers DELIVERY-06
- [ ] `vitest.config.ts` and `tests/setup.ts` with Prisma mock

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `requireAuth()` on all order/delivery routes; JWT from `mp_token` cookie |
| V3 Session Management | no | JWT stateless — no session store needed |
| V4 Access Control | yes | Buyer ownership check on key reveal; seller ownership check on deliver |
| V5 Input Validation | yes | Zod schemas on all POST bodies; gateway enum validation |
| V6 Cryptography | yes | AES-256-GCM (`lib/crypto.ts`) for keys; JWT HMAC-SHA256 for ZainCash |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Callback replay — gateway sends same callback twice | Repudiation | Idempotency check: if order.status === PAID, return already-paid |
| Key enumeration — buyer calls /api/orders/[id]/key for other buyers' orders | Spoofing | Verify `order.buyerId === user.userId` before decrypting |
| Cron endpoint called by external actor | Elevation of Privilege | Verify `Authorization: Bearer CRON_SECRET` on every request |
| Wallet double-spend — two concurrent deductions | Tampering | Atomic `UPDATE ... WHERE balance >= amount`; rowsAffected check |
| Gateway callback forged — attacker crafts success payload | Tampering | JWT signature verification with shared secret; reject any unverified payload |
| Seller delivers to wrong order | Spoofing | Verify `product.sellerId === user.userId` before accepting delivery |
| Key revealed in list response | Information Disclosure | `GET /api/orders` never includes `keyValue`; only `GET /api/orders/[id]/key` does |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ZainCash callback is a browser GET redirect with `?token=JWT`, not a server-to-server POST webhook | ZainCash Pattern / Pitfall 2 | If it IS a POST webhook, the callback route handler type (GET vs POST) and payload parsing need to change |
| A2 | ZainCash init endpoint returns `{ id: transactionId }` and pay URL is `payUrl?id={transactionId}` | Code Examples | If URL structure differs, the redirectUrl construction in zaincash.ts is wrong |
| A3 | The `zaincash` npm package's JWT payload fields (amount, serviceType, msisdn, orderId, redirectUrl, production, merchantId, secret) are the actual ZainCash API fields | ZainCash Pattern | Some fields may be named differently in current ZainCash v2 API |
| A4 | Adding `confirmedAt DateTime?` to Order is needed for Phase 3 | Open Questions | If confirmedAt is already tracked via updatedAt, a separate field is redundant |
| A5 | jsonwebtoken is already available in node_modules (via NextAuth dependency) | Standard Stack | If not available, `npm install jsonwebtoken @types/jsonwebtoken` needed |

---

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `prisma/schema.prisma`, `lib/payment/gateway.ts`, `lib/crypto.ts`, `lib/auth-middleware.ts`, `services/key.service.ts`, `services/order.service.ts`, `app/api/orders/`, `app/api/payment/` — direct file reads
- `.planning/phases/03-purchase-and-delivery/03-CONTEXT.md` — locked decisions D-01 through D-19
- `.planning/phases/03-purchase-and-delivery/03-UI-SPEC.md` — component inventory and screen contracts
- [Vercel Cron Jobs docs](https://vercel.com/docs/cron-jobs) — cron schedule format, CRON_SECRET pattern, App Router GET handler
- [Prisma raw queries](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries) — `$queryRaw` typed template literal usage

### Secondary (MEDIUM confidence)
- [github.com/hamdongunner/zaincash](https://github.com/hamdongunner/zaincash) — ZainCash JWT payload field names via npm package README
- [github.com/prisma/prisma/issues/5983](https://github.com/prisma/prisma/issues/5983) — confirmed Prisma has no native FOR UPDATE; raw query is the only path

### Tertiary (LOW confidence)
- ZainCash endpoint URLs (test/prod) — inferred from multiple community Laravel/PHP integrations; not verified against official docs.zaincash.iq (403 blocked)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are already installed and in use
- Architecture: HIGH — based on direct codebase analysis
- Key assignment pattern: HIGH — PostgreSQL FOR UPDATE SKIP LOCKED is well-documented
- ZainCash API specifics: MEDIUM — community sources; official docs inaccessible
- Pitfalls: HIGH — identified from existing code defects (race condition in key.service.ts, FAILED enum missing, guest model vs auth model conflict)

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (ZainCash API section: 2026-05-17 — verify before implementation)
