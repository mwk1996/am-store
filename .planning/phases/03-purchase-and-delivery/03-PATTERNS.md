# Phase 3: Purchase & Delivery - Pattern Map

**Mapped:** 2026-05-03
**Files analyzed:** 18 new/modified files
**Analogs found:** 16 / 18

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `prisma/schema.prisma` | migration | CRUD | `prisma/schema.prisma` (current) | self — extend |
| `lib/payment/types.ts` | utility | request-response | `lib/payment/gateway.ts` | role-match |
| `lib/payment/index.ts` | utility | request-response | `lib/payment/gateway.ts` | exact |
| `lib/payment/providers/zaincash.ts` | service | request-response | `lib/payment/gateway.ts` | role-match |
| `services/key.service.ts` | service | CRUD | `services/key.service.ts` (current) | self — fix race |
| `services/order.service.ts` | service | CRUD | `services/order.service.ts` (current) | self — implement stubs |
| `services/audit.service.ts` | service | event-driven | `services/wallet.service.ts` | role-match |
| `app/api/orders/route.ts` | controller | request-response | `app/api/orders/route.ts` (current) | self — replace |
| `app/api/orders/[id]/route.ts` | controller | request-response | `app/api/orders/[id]/route.ts` (current) | self — extend |
| `app/api/orders/[id]/key/route.ts` | controller | request-response | `app/api/orders/[id]/deliver/route.ts` | exact |
| `app/api/orders/[id]/deliver/route.ts` | controller | request-response | `app/api/orders/[id]/deliver/route.ts` (current) | self — complete |
| `app/api/orders/[id]/confirm/route.ts` | controller | request-response | `app/api/orders/[id]/deliver/route.ts` | exact |
| `app/api/payment/initiate/route.ts` | controller | request-response | `app/api/payment/initiate/route.ts` (current) | self — replace |
| `app/api/payment/callback/route.ts` | controller | request-response | `app/api/payment/callback/route.ts` (current) | self — fix |
| `app/api/cron/auto-confirm/route.ts` | controller | batch | `app/api/marketplace/orders/route.ts` | partial |
| `app/[locale]/checkout/page.tsx` | component | request-response | `app/[locale]/checkout/page.tsx` (current) | self — extend |
| `app/[locale]/orders/page.tsx` | component | request-response | `app/[locale]/orders/page.tsx` (current) | self — replace |
| `app/[locale]/orders/[id]/page.tsx` | component | request-response | `app/[locale]/orders/[id]/page.tsx` (current) | self — wire APIs |
| `app/[locale]/dashboard/page.tsx` | component | CRUD | `app/[locale]/dashboard/page.tsx` (current) | self — extend orders tab |
| `vercel.json` | config | batch | none | no analog |

---

## Pattern Assignments

### `prisma/schema.prisma` (migration, CRUD)

**Analog:** `prisma/schema.prisma` (current file — extend in place)

**Current Order model** (lines 86–98) — replace `guestEmail String` with nullable and add new fields:
```prisma
model Order {
  id               String      @id @default(cuid())
  guestEmail       String?                          // nullable — legacy guest orders only
  buyerId          String?
  buyer            User?       @relation("BuyerOrders", fields: [buyerId], references: [id])
  sellerId         String?
  seller           User?       @relation("SellerOrders", fields: [sellerId], references: [id])
  productId        String
  product          Product     @relation(fields: [productId], references: [id])
  productKeyId     String?     @unique
  productKey       ProductKey?
  status           OrderStatus @default(PENDING)
  gatewayRef       String?
  locale           String      @default("en")
  sellerAmount     Decimal     @db.Decimal(10, 2) @default(0)
  commissionAmount Decimal     @db.Decimal(10, 2) @default(0)
  disputeDeadline  DateTime?
  confirmDeadline  DateTime?
  deliveredAt      DateTime?
  confirmedAt      DateTime?
  auditLogs        AuditLog[]
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt

  @@index([buyerId])
  @@index([sellerId])
  @@index([status])
}
```

**Add to OrderStatus enum** (line 16) — add FAILED:
```prisma
enum OrderStatus {
  PENDING
  PAID
  DELIVERED
  COMPLETED
  DISPUTED
  REFUNDED
  FAILED
}
```

**New AuditLog model and enum** (append after Order model):
```prisma
enum AuditEvent {
  KEY_REVEALED
  CREDENTIALS_DELIVERED
  BUYER_CONFIRMED
  AUTO_CONFIRMED
}

model AuditLog {
  id        String     @id @default(cuid())
  orderId   String
  order     Order      @relation(fields: [orderId], references: [id])
  event     AuditEvent
  ip        String
  userAgent String
  createdAt DateTime   @default(now())

  @@index([orderId])
  @@index([createdAt])
}
```

**User model** — add back-relations for buyer/seller orders (after existing `sellerProducts` line):
```prisma
  buyerOrders    Order[] @relation("BuyerOrders")
  sellerOrders   Order[] @relation("SellerOrders")
```

---

### `lib/payment/types.ts` (utility, request-response)

**Analog:** `lib/payment/gateway.ts` (lines 1–28) — existing interface definitions

**Pattern to extract and restructure** (gateway.ts lines 1–28):
```typescript
// lib/payment/types.ts — replaces the flat interface exports in gateway.ts
import { Order, Product } from "@prisma/client";

export type GatewayName = "zaincash" | "qi-card" | "fib" | "asia-pay" | "fast-pay" | "wallet";

export interface GatewayConfig {
  name: GatewayName;
  enabled: boolean;
  credentials: Record<string, string>;
  production: boolean;
}

export interface OrderWithProduct extends Order {
  product: Product;
}

export interface GatewayInitiateResult {
  redirectUrl: string;
  gatewayRef: string;
}

export interface VerifyResult {
  valid: boolean;
  orderId?: string;
  gatewayRef?: string;
  status?: "success" | "failure" | "pending";
}

export interface GatewayProvider {
  initiate(order: OrderWithProduct, config: GatewayConfig): Promise<GatewayInitiateResult>;
  verifyCallback(payload: Record<string, unknown>, config: GatewayConfig): VerifyResult;
}
```

---

### `lib/payment/index.ts` (utility, request-response)

**Analog:** `lib/payment/gateway.ts` — restructure as dispatcher

**Dispatcher pattern:**
```typescript
// lib/payment/index.ts
import { GatewayName, GatewayProvider } from "./types";
import { zaincashProvider } from "./providers/zaincash";

function stubProvider(gatewayName: string): GatewayProvider {
  return {
    async initiate() {
      throw new Error(`${gatewayName} not yet implemented`);
    },
    verifyCallback() {
      return { valid: false };
    },
  };
}

const providers: Record<GatewayName, GatewayProvider> = {
  zaincash: zaincashProvider,
  "qi-card": stubProvider("QI Card"),
  fib: stubProvider("FIB"),
  "asia-pay": stubProvider("Asia Pay"),
  "fast-pay": stubProvider("Fast Pay"),
  wallet: stubProvider("wallet"), // wallet path handled separately in order route
};

export function getProvider(name: GatewayName): GatewayProvider {
  const p = providers[name];
  if (!p) throw new Error(`Unknown gateway: ${name}`);
  return p;
}
```

---

### `lib/payment/providers/zaincash.ts` (service, request-response)

**Analog:** `lib/payment/gateway.ts` — existing `initiatePayment` and `verifyCallback` functions (lines 41–142)

**Existing signature pattern to follow** (gateway.ts lines 41–52, 97–99):
```typescript
// gateway.ts uses: const secret = process.env.PAYMENT_GATEWAY_SECRET
// zaincash.ts uses dedicated env vars: ZAINCASH_MSISDN, ZAINCASH_MERCHANT_ID, ZAINCASH_SECRET

import jwt from "jsonwebtoken";
import { GatewayProvider, GatewayConfig, GatewayInitiateResult, VerifyResult, OrderWithProduct } from "../types";

export const zaincashProvider: GatewayProvider = {
  async initiate(order: OrderWithProduct, config: GatewayConfig): Promise<GatewayInitiateResult> {
    // Build JWT payload — see RESEARCH.md Pattern 3 for full payload shape
    // POST to ZAINCASH_INIT_URL, receive { id }, return redirectUrl + gatewayRef
  },
  verifyCallback(payload: Record<string, unknown>, config: GatewayConfig): VerifyResult {
    // jwt.verify(payload.token, config.credentials.secret)
    // Return { valid, orderId, gatewayRef, status }
  },
};
```

**HMAC approach from gateway.ts** (lines 53–58) — replace with jwt.sign for ZainCash:
```typescript
// EXISTING (gateway.ts line 54-57) — do NOT copy:
const signature = crypto.createHmac("sha256", secret).update(sigPayload).digest("hex");

// ZAINCASH pattern — use jsonwebtoken instead:
const token = jwt.sign(payload, config.credentials.secret);
```

---

### `services/key.service.ts` (service, CRUD)

**Analog:** `services/key.service.ts` (current — fix `assignKey`, keep rest)

**Current broken pattern** (key.service.ts lines 11–17) — REPLACE this:
```typescript
// BROKEN — read-then-write race condition. DO NOT COPY.
const keys = await tx.productKey.findMany({
  where: { productId, isUsed: false, orderId: null },
  take: 1,
  orderBy: { createdAt: "asc" },
});
```

**Correct pattern** — replace with `$queryRaw` FOR UPDATE SKIP LOCKED:
```typescript
async assignKey(tx: Prisma.TransactionClient, productId: string, orderId: string) {
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

  return tx.productKey.update({
    where: { id: keys[0].id },
    data: { isUsed: true, usedAt: new Date(), orderId },
  });
},
```

**Keep unchanged** (lines 36–53): `countAvailable()` and `bulkCreate()` — no changes needed.

---

### `services/order.service.ts` (service, CRUD)

**Analog:** `services/order.service.ts` (current — implement stubs)

**Import pattern** (order.service.ts lines 1–2):
```typescript
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
```

**Implement `listForUser`** (currently returns empty stub at line 8):
```typescript
async listForUser(userId: string, role: "buyer" | "seller", page = 1, limit = 20) {
  const where = role === "buyer" ? { buyerId: userId } : { sellerId: userId };
  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        product: { select: { id: true, title: true, imageUrl: true, deliveryType: true } },
        productKey: { select: { id: true } }, // never expose keyValue (D-16)
      },
    }),
    prisma.order.count({ where }),
  ]);
  return { items, total, page, limit };
},
```

**Implement `getByIdForUser`** (currently no ownership check at line 21):
```typescript
async getByIdForUser(orderId: string, userId: string) {
  return prisma.order.findFirst({
    where: {
      id: orderId,
      OR: [{ buyerId: userId }, { sellerId: userId }],
    },
    include: {
      product: { select: { id: true, title: true, imageUrl: true, deliveryType: true, sellerId: true } },
      productKey: { select: { id: true } }, // keyValue excluded — use /key endpoint
    },
  });
},
```

---

### `services/audit.service.ts` (service, event-driven)

**Analog:** `services/wallet.service.ts` — singleton exported service object pattern (lines 1–18)

**Wallet singleton pattern to copy** (wallet.service.ts lines 2–18):
```typescript
// wallet.service.ts — exported as singleton object
export const walletService = {
  async getOrCreate(_userId: string) { ... },
  ...
};
```

**Apply same pattern for audit:**
```typescript
// services/audit.service.ts
import { Prisma, AuditEvent } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const auditService = {
  async log(
    tx: Prisma.TransactionClient | typeof prisma,
    params: { orderId: string; event: AuditEvent; ip: string; userAgent: string }
  ) {
    return tx.auditLog.create({ data: params });
  },
};
```

---

### `app/api/orders/route.ts` (controller, request-response)

**Analog:** `app/api/orders/route.ts` (current — replace guest model with buyer-auth model)

**Existing Zod + error handling pattern** (orders/route.ts lines 5–48):
```typescript
// Copy this structure: schema → parse → product check → create → return
const createOrderSchema = z.object({
  productId: z.string().min(1),
  gateway: z.enum(["zaincash", "qi-card", "fib", "asia-pay", "fast-pay", "wallet"]),
  locale: z.string().default("en"),
});

export async function POST(req: NextRequest) {
  try {
    const user = verifyToken(req); // from lib/auth-middleware.ts line 16
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { productId, locale } = createOrderSchema.parse(body); // line 14 pattern

    const product = await prisma.product.findUnique({ ... }); // line 17-23 pattern

    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 }); // line 25
    if (product._count.keys === 0) return NextResponse.json({ error: "..." }, { status: 409 }); // line 29

    // Compute commission (D-06):
    const price = Number(product.price);
    const commissionAmount = price * 0.10;
    const sellerAmount = price * 0.90;

    const order = await prisma.order.create({ data: { buyerId: user.userId, sellerId: product.sellerId, ... } });

    return NextResponse.json({ orderId: order.id }, { status: 201 }); // line 41
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 }); // line 43
    console.error("...", err); // line 45
    return NextResponse.json({ error: "Internal server error." }, { status: 500 }); // line 47
  }
}
```

---

### `app/api/orders/[id]/route.ts` (controller, request-response)

**Analog:** `app/api/orders/[id]/route.ts` (current — add auth + ownership check)

**Current pattern** (orders/[id]/route.ts lines 1–26) — extend with auth:
```typescript
// Add these imports to existing:
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { orderService } from "@/services/order.service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(req); // ADD
  if (!user) return jsonError("Unauthorized", 401); // ADD

  // Replace prisma.order.findUnique with service ownership check:
  const order = await orderService.getByIdForUser(params.id, user.userId); // REPLACE line 9-16

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 }); // line 18 pattern
  return NextResponse.json(order); // line 22 pattern
}
```

---

### `app/api/orders/[id]/key/route.ts` (controller, request-response)

**Analog:** `app/api/orders/[id]/deliver/route.ts` (lines 1–33) — same auth+ownership+transaction structure

**Copy auth + ownership pattern** (deliver/route.ts lines 1–20):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, jsonError } from "@/lib/auth-middleware";
import { decryptKey } from "@/lib/crypto"; // lib/crypto.ts — encryptKey/decryptKey
import { auditService } from "@/services/audit.service";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic"; // deliver/route.ts line 7

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = verifyToken(req); // deliver/route.ts line 10
  if (!user) return jsonError("Unauthorized", 401); // deliver/route.ts line 11

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { productKey: { select: { keyValue: true } } },
  });

  if (!order) return jsonError("Order not found", 404); // deliver/route.ts line 18
  if (order.buyerId !== user.userId) return jsonError("Forbidden", 403); // deliver/route.ts line 19 pattern
  if (!["PAID", "COMPLETED"].includes(order.status)) return jsonError("Key not available", 403);
  if (!order.productKey) return jsonError("No key assigned", 404);

  const plaintext = decryptKey(order.productKey.keyValue); // lib/crypto.ts line 36

  // Log audit event (non-blocking):
  await auditService.log(prisma, {
    orderId: order.id,
    event: "KEY_REVEALED",
    ip: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "unknown",
  });

  return NextResponse.json({ key: plaintext });
}
```

---

### `app/api/orders/[id]/deliver/route.ts` (controller, request-response)

**Analog:** `app/api/orders/[id]/deliver/route.ts` (current — complete the stub, add credentials field, AuditLog)

**Current transaction structure to extend** (deliver/route.ts lines 22–32):
```typescript
await prisma.$transaction(async (tx) => {
  // ADD: credentials field on Order (must add to schema first)
  await tx.order.update({
    where: { id: order.id },
    data: {
      status: OrderStatus.DELIVERED,
      deliveredAt: new Date(),
      confirmDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // D-08: +24h
      credentials: body.credentials, // new field on Order
    },
  });
  // ADD: AuditLog entry
  await auditService.log(tx, {
    orderId: order.id,
    event: "CREDENTIALS_DELIVERED",
    ip: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "unknown",
  });
});
// ADD: send delivery email (non-blocking, like callback/route.ts lines 80-88)
```

**Zod body validation to add** (follow orders/route.ts line 6 pattern):
```typescript
const deliverSchema = z.object({ credentials: z.string().min(1).max(2000) });
```

---

### `app/api/orders/[id]/confirm/route.ts` (controller, request-response)

**Analog:** `app/api/orders/[id]/deliver/route.ts` — exact same structure (auth → ownership → status check → transaction → audit)

**Pattern to copy from deliver/route.ts** (lines 1–33) with these changes:
- Buyer check: `order.buyerId !== user.userId` (not seller)
- Status check: `order.status !== OrderStatus.DELIVERED`
- Transaction updates: `status: COMPLETED`, `confirmedAt: new Date()`, `disputeDeadline: +14d for MANUAL / already set for INSTANT`
- AuditLog event: `BUYER_CONFIRMED`

---

### `app/api/payment/initiate/route.ts` (controller, request-response)

**Analog:** `app/api/payment/initiate/route.ts` (current — add gateway selection, auth)

**Existing structure to keep** (initiate/route.ts lines 1–65) — minimal changes:
```typescript
// ADD to schema (line 7):
const schema = z.object({
  orderId: z.string().min(1),
  gateway: z.enum(["zaincash", "qi-card", "fib", "asia-pay", "fast-pay"]), // ADD
});

// REPLACE initiatePayment() call (line 34) with:
const provider = getProvider(gateway); // from lib/payment/index.ts
const result = await provider.initiate(order, gatewayConfig);

// Keep existing error handling pattern (lines 45-48, 57-64)
```

---

### `app/api/payment/callback/route.ts` (controller, request-response)

**Analog:** `app/api/payment/callback/route.ts` (current — fix race condition, add gateway param, AuditLog)

**Key fix — replace findFirst+update** (callback/route.ts lines 56–78) with keyService + auditService inside transaction:
```typescript
// REPLACE lines 56-78 (broken race) with:
const assignedKey = await prisma.$transaction(async (tx) => {
  const key = await keyService.assignKey(tx, order.productId, orderId); // fixed service
  await tx.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.PAID, productKeyId: key.id, gatewayRef },
  });
  await auditService.log(tx, {  // D-18
    orderId,
    event: "KEY_REVEALED",
    ip: req.headers.get("x-forwarded-for") ?? "unknown",
    userAgent: req.headers.get("user-agent") ?? "unknown",
  });
  return key;
});
```

**Keep unchanged:** idempotency check (lines 39–41), email send pattern (lines 80–88), GET handler (lines 99–121).

**Fix FAILED enum cast** (line 46) — remove `as any` after adding FAILED to enum:
```typescript
// BEFORE (line 46):
data: { status: "FAILED" as any, gatewayRef: gatewayRef ?? order.gatewayRef },
// AFTER:
data: { status: OrderStatus.FAILED, gatewayRef: gatewayRef ?? order.gatewayRef },
```

---

### `app/api/cron/auto-confirm/route.ts` (controller, batch)

**Analog:** `app/api/marketplace/orders/route.ts` (lines 1–15) — auth pattern; no exact batch analog exists

**CRON_SECRET auth pattern** (from RESEARCH.md Pattern 4 — verified against Vercel docs):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditService } from "@/services/audit.service";
import { OrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic"; // deliver/route.ts line 7

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const expired = await prisma.order.findMany({
    where: { status: OrderStatus.DELIVERED, confirmDeadline: { lt: now } },
    select: { id: true },
  });

  let confirmed = 0;
  for (const order of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.COMPLETED, confirmedAt: now },
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

---

### `app/[locale]/checkout/page.tsx` (component, request-response)

**Analog:** `app/[locale]/checkout/page.tsx` (current — extend with gateway selector, auth)

**Existing patterns to keep** (checkout/page.tsx):
- Import pattern (lines 1–13): shadcn/ui Button, Input, Label, Select, useToast
- Two-step flow pattern (lines 64–98): create order → initiate payment → router.push(redirectUrl)
- Form submit error handling (lines 91–97): toast on catch
- Order summary sidebar (lines 195–263): product name via `getLocalizedText`, price via `formatPrice`

**Gateway selector — add between product selector and submit button:**
```typescript
// New state: const [selectedGateway, setSelectedGateway] = useState<string>("");
// Render as tile grid after product selector — replace email field (buyer is now auth'd):
const GATEWAYS = [
  { id: "zaincash", label: "ZainCash" },
  { id: "qi-card", label: "QI Card" },
  { id: "fib", label: "FIB" },
  { id: "asia-pay", label: "Asia Pay" },
  { id: "fast-pay", label: "Fast Pay" },
];
// Render as <RadioGroup> from shadcn/ui — tile grid layout
```

**Auth redirect** — add at top of component (follow dashboard/page.tsx lines 86–88):
```typescript
// dashboard/page.tsx lines 86-88:
const tok = localStorage.getItem("auth_token");
if (!tok) { router.push(`/${locale}/login`); return; }
```

**Update order creation call** (lines 65–69) — add gateway, remove email:
```typescript
body: JSON.stringify({ productId: selectedProductId, gateway: selectedGateway, locale }),
headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
```

---

### `app/[locale]/orders/page.tsx` (component, request-response)

**Analog:** `app/[locale]/orders/page.tsx` (current — replace email lookup with authenticated list)

**Table rendering pattern to keep** (orders/page.tsx lines 141–202): the `<table>` structure, STATUS_STYLES, `formatDate`, monospace key display with eye toggle.

**Replace lookup form** (lines 37–61) with authenticated fetch:
```typescript
// Follow dashboard/page.tsx pattern (lines 86-110):
const tok = localStorage.getItem("auth_token");
if (!tok) { router.push(`/${locale}/login`); return; }

// Replace handleLookup with useEffect fetch:
useEffect(() => {
  fetch("/api/marketplace/orders", { headers: { Authorization: `Bearer ${tok}` } })
    .then(r => r.json()).then(data => setOrders(data.items ?? []));
}, []);
```

**Key reveal — change to API call** (instead of current inline display):
```typescript
// Current: order.licenseKey.key inline (line 177)
// Phase 3: fetch from /api/orders/[id]/key on reveal button click:
async function revealKey(orderId: string) {
  const res = await fetch(`/api/orders/${orderId}/key`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    const { key } = await res.json();
    setRevealedKeys(prev => new Map(prev).set(orderId, key));
  }
}
```

---

### `app/[locale]/orders/[id]/page.tsx` (component, request-response)

**Analog:** `app/[locale]/orders/[id]/page.tsx` (current — wire key reveal endpoint, add delivery status)

**Existing patterns to keep** (orders/[id]/page.tsx):
- Auth fetch pattern (lines 49–65): `fetchOrder()` with localStorage token + Promise.all
- Copy button pattern (lines 69–73): `navigator.clipboard.writeText()`, `setCopied(true)` + timeout
- Key display box (lines 150–165): emerald-bordered code block with Copy button
- EscrowTimeline, OrderActions component wiring (lines 122, 215): keep as-is

**Key reveal — change assignedKey source:**
```typescript
// CURRENT (line 55): order includes assignedKey from API
// PHASE 3: order detail API never returns keyValue (D-16)
// Add separate key reveal state:
const [revealedKey, setRevealedKey] = useState<string | null>(null);

async function fetchKey() {
  const res = await fetch(`/api/orders/${orderId}/key`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (res.ok) {
    const { key } = await res.json();
    setRevealedKey(key);
  }
}
```

---

### `app/[locale]/dashboard/page.tsx` (Orders tab, component, CRUD)

**Analog:** `app/[locale]/dashboard/page.tsx` (current — extend Orders tab with Deliver button + modal)

**Existing Orders tab pattern** (dashboard/page.tsx lines 389–427) — add Deliver action to each row:

```typescript
// ADD to orders tab — seller-only "Deliver" button per PAID order:
// Follow modal pattern from listings tab (lines 306-386) for the DeliverCredentialsModal

// DeliverCredentialsModal state (add to component):
const [deliverModalOrderId, setDeliverModalOrderId] = useState<string | null>(null);
const [credentials, setCredentials] = useState("");
const [delivering, setDelivering] = useState(false);

async function handleDeliver() {
  if (!deliverModalOrderId || !credentials.trim()) return;
  setDelivering(true);
  const res = await fetch(`/api/orders/${deliverModalOrderId}/deliver`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ credentials }),
  });
  if (res.ok) {
    setDeliverModalOrderId(null);
    // refresh orders
  }
  setDelivering(false);
}
```

**Modal — use shadcn/ui Dialog** (already in components/ui/):
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
// Dialog wrapping pattern follows existing shadcn/ui usage in the codebase
```

---

### `vercel.json` (config, batch)

**No analog** — new file. Pattern from RESEARCH.md Pattern 4 (verified against Vercel docs):
```json
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

---

## Shared Patterns

### Authentication — `verifyToken` + `jsonError`
**Source:** `lib/auth-middleware.ts` lines 16–24, 42–44
**Apply to:** All new API routes (`/api/orders/*`, `/api/payment/*`, `/api/cron/auto-confirm`)
```typescript
import { verifyToken, jsonError } from "@/lib/auth-middleware";

const user = verifyToken(req);
if (!user) return jsonError("Unauthorized", 401);
```

### Role-based access — ownership check pattern
**Source:** `app/api/orders/[id]/deliver/route.ts` lines 13–20
**Apply to:** `/api/orders/[id]/key`, `/api/orders/[id]/confirm`, `/api/orders/[id]/deliver`
```typescript
const order = await prisma.order.findUnique({ where: { id: params.id }, include: { product: ... } });
if (!order) return jsonError("Order not found", 404);
if (order.product.sellerId !== user.userId) return jsonError("Forbidden", 403);  // seller routes
if (order.buyerId !== user.userId) return jsonError("Forbidden", 403);           // buyer routes
```

### Transaction pattern — `prisma.$transaction`
**Source:** `app/api/payment/callback/route.ts` lines 56–78; `app/api/orders/[id]/deliver/route.ts` lines 22–32
**Apply to:** callback/route.ts (key assignment), deliver/route.ts (status update), confirm/route.ts (status update), cron (auto-confirm loop)
```typescript
await prisma.$transaction(async (tx) => {
  // All state changes together — tx is Prisma.TransactionClient
  await tx.order.update({ where: { id }, data: { status: ..., ... } });
  await auditService.log(tx, { orderId: id, event: "...", ip: "...", userAgent: "..." });
});
```

### Zod validation — parse-or-400
**Source:** `app/api/orders/route.ts` lines 5–8, 43–44
**Apply to:** All POST routes
```typescript
const schema = z.object({ ... });
// Inside try/catch:
const body = schema.parse(await req.json());
// In catch:
if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 });
```

### Error handling — try/catch with typed ZodError
**Source:** `app/api/orders/route.ts` lines 42–48
**Apply to:** All API routes
```typescript
} catch (err) {
  if (err instanceof z.ZodError) {
    return NextResponse.json({ error: err.errors }, { status: 400 });
  }
  console.error("POST /api/[route] error:", err);
  return NextResponse.json({ error: "Internal server error." }, { status: 500 });
}
```

### Non-blocking email after transaction
**Source:** `app/api/payment/callback/route.ts` lines 80–88
**Apply to:** callback/route.ts (key email), deliver/route.ts (delivery notification)
```typescript
try {
  await sendLicenseEmail({ to: ..., productName: ..., licenseKey: ..., orderId, locale });
} catch (emailErr) {
  console.error("Failed to send license email:", emailErr);
  // do NOT rethrow — email failure must not fail the order
}
```

### Client-side auth redirect
**Source:** `app/[locale]/dashboard/page.tsx` lines 86–88
**Apply to:** `orders/page.tsx`, `checkout/page.tsx`, `orders/[id]/page.tsx`
```typescript
const tok = localStorage.getItem("auth_token");
if (!tok) { router.push(`/${locale}/login`); return; }
setToken(tok);
```

### Localized text
**Source:** `app/[locale]/dashboard/page.tsx` line 13 import; used on line 443
**Apply to:** All pages displaying product titles
```typescript
import { getLocalizedText } from "@/lib/utils";
const title = getLocalizedText(product.title as Record<string, string> | string, locale);
```

### `export const dynamic = "force-dynamic"`
**Source:** `app/api/orders/[id]/deliver/route.ts` line 7
**Apply to:** All new API route files that read from DB per-request (orders, payment, cron)

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `vercel.json` | config | batch | No existing Vercel config in the project |
| `lib/payment/providers/qi-card.ts` `fib.ts` `asia-pay.ts` `fast-pay.ts` | service | request-response | Stub files with no real implementation — use `stubProvider()` from `lib/payment/index.ts` |

---

## Metadata

**Analog search scope:** `app/api/`, `app/[locale]/`, `services/`, `lib/`, `prisma/`
**Files scanned:** 22 source files read
**Pattern extraction date:** 2026-05-03
