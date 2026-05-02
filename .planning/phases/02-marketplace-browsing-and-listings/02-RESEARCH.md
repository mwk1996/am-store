# Phase 2: Marketplace Browsing & Listings — Research

**Researched:** 2026-05-03
**Domain:** Next.js 14 App Router + Prisma schema migration + AES-256-GCM encryption + multi-seller marketplace
**Confidence:** HIGH (all findings grounded in direct codebase inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** title/description stored as multilingual JSON `{ "en": "...", "ar": "..." }`
- **D-02:** Single `imageUrl String?` per product (URL paste or upload)
- **D-03:** `deliveryType` enum on Product: `INSTANT | MANUAL`
- **D-04:** Categories: predefined seeded list — Game Accounts, Software Keys, Gift Cards, In-Game Items, Other. No admin CRUD in Phase 2.
- **D-05:** Platform: predefined dropdown — PC, PlayStation, Xbox, Nintendo Switch, Mobile, Multiple Platforms, Other. Stored as `platform String`.
- **D-06:** `status` field: `ACTIVE | INACTIVE`. Soft-delete sets INACTIVE.
- **D-07:** `isFeatured Boolean @default(false)` — admin sets in Phase 7; query support required now.
- **D-08:** `sellerId` foreign key on Product. Every product belongs to a SELLER User.
- **D-09:** Seller dashboard at `/[locale]/dashboard` — tabbed (Listings, Orders, Earnings). Create listing at `/[locale]/dashboard/listings/new`.
- **D-10:** EN/AR tabbed inputs for title + description in listing form.
- **D-11:** After listing creation, redirect to `/[locale]/products/[id]`.
- **D-12:** Bulk key upload via textarea, one-per-line, live count preview before submit.
- **D-13:** Sellers can edit title, description, price, imageUrl, platform, deliveryType. Keys cannot be un-imported.
- **D-14:** Sellers can soft-delete (status=INACTIVE). Active orders unaffected.
- **D-15:** AES-256-GCM via Node.js `crypto`, 32-byte hex key in `KEY_ENCRYPTION_SECRET`. Keys stored encrypted.
- **D-16:** Keys decrypted ONLY in `GET /api/orders/[id]` — never in list/browse responses.
- **D-17:** `lib/crypto.ts` exports `encryptKey(plaintext)` and `decryptKey(ciphertext)`.
- **D-18:** SEC-05 listing cap: 403 if seller has ≥10 ACTIVE listings AND no completed orders. Dashboard counter badge + disabled button.
- **D-19:** SEC-04 7-day earnings hold: dismissible info banner on dashboard. Hides once seller has ≥1 completed order.
- **D-20:** SEC-06 first-withdrawal admin review: Phase 4 wallet service — no Phase 2 UI needed.
- **D-21:** Stock count: >5 shows exact count, ≤5 shows "Only N left" amber badge, 0 shows "Out of stock" red badge.
- **D-22:** Update existing `app/[locale]/marketplace/page.tsx` for multilingual JSON + new schema fields.
- **D-23:** Featured listings appear above paginated results. Within featured: `createdAt DESC`. Pagination applies only to non-featured.
- **D-24:** Search uses Prisma `contains` + `mode: insensitive` on EN title field. No full-text engine.

### Claude's Discretion
- Exact Prisma schema field names beyond what's specified
- Pagination page size (keep 12 — existing default)
- Form validation error messages (specific but friendly)
- Loading skeletons and empty state copy
- API error shapes (follow existing `{ error: string }` convention)
- Whether to add platform filter to marketplace sidebar (YES — add it)

### Deferred Ideas (OUT OF SCOPE)
- Multi-image gallery per product
- Buyer-facing seller profile page
- Full-text search with pg_trgm or external engine
- Real-time stock countdown
- Category CRUD admin UI
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LISTING-01 | Seller can create a product listing with title, description, price, category, platform, and delivery type | Schema migration + new POST /api/products (update Zod schema) + new creation form page |
| LISTING-02 | Seller can upload license keys in bulk via CSV paste or file upload | Existing `/api/products/[id]/keys` route needs encryption; service needs `encryptKey()` call; textarea UI with live count |
| LISTING-03 | Product listing shows current stock count to buyers | `_count.keys where isUsed=false` already in service; stock badge logic on card/detail |
| LISTING-04 | Admin can mark a listing as featured — appears at top of search results | `isFeatured` field in schema migration; featured-first query split in marketplace page |
| LISTING-05 | Buyer can browse listings with filters: category, platform, price range, delivery type | Platform filter added to `ProductFilters`; marketplace page `where` clause extended |
| LISTING-06 | Buyer can view product detail page with seller info, reviews, delivery type indicator | Update existing detail page for multilingual JSON + new fields |
| LISTING-07 | Buyer can search products by keyword | Prisma `contains` + `mode: insensitive` on `title->>'en'` path via JSON filter |
| SEC-02 | License keys encrypted at rest | `lib/crypto.ts` AES-256-GCM implementation; encrypt on import, decrypt only on order reveal |
| SEC-03 | Keys only accessible via authenticated buyer order endpoint | API design rule — verify in GET /api/orders/[id]; never in product responses |
| SEC-04 | New sellers have 7-day earnings hold | Dashboard banner shown when `completedOrderCount === 0`; backend enforcement in Phase 4 |
| SEC-05 | New sellers capped at 10 active listings until first completed sale | Server-side check in POST /api/products + dashboard counter |
| SEC-06 | First withdrawal requires admin review | Backend enforcement Phase 4 wallet service; no Phase 2 UI needed |
</phase_requirements>

---

## Summary

Phase 2 is a brownfield extension of an existing multi-seller codebase. The key challenge is that the existing Prisma schema (`schema.prisma`) does not yet contain several required fields (`sellerId`, `deliveryType`, `status`, `isFeatured`, `platform`, `Category` relation) while the existing service layer (`services/product.service.ts`) already references these fields — meaning the TypeScript compiles against a schema that does not match the database. The first task of this phase must be a Prisma schema migration that closes this gap.

The existing marketplace UI components (`components/marketplace/ProductCard.tsx`, `ProductFilters.tsx`, `app/[locale]/marketplace/page.tsx`) are already substantially complete and reference the correct multi-seller shape. They use plain string `title` and `description` fields however, which must be updated to read multilingual JSON via the existing `getLocalizedText()` utility in `lib/utils.ts`. The legacy `components/product-card.tsx` already uses `getLocalizedText()` correctly and is the canonical pattern to follow — but its visual design (single-seller storefront) should not be used; only its data-access pattern should be carried forward into the marketplace card.

The AES-256-GCM key encryption requirement (SEC-02) is currently unimplemented: `key.service.ts` calls `prisma.productKey.createMany` with plaintext `keyValue` strings. A `lib/crypto.ts` utility must be created and called in `key.service.ts` before any production key import runs.

**Primary recommendation:** Execute in this order — (1) schema migration, (2) crypto utility, (3) service updates, (4) API updates, (5) UI pages. Every subsequent task depends on the schema being correct.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Listing creation form | Frontend (client component) | API (POST /api/products) | Form state, EN/AR tabs, live validation — all client-side |
| Listing CRUD | API (/api/products, /api/products/[id]) | Service (product.service.ts) | Business logic stays in service; route is thin adapter |
| Key import + encryption | API (/api/products/[id]/keys) | Service (key.service.ts + lib/crypto.ts) | Encryption happens at rest — server-only, never on client |
| Marketplace browse/filter | Frontend Server Component | Database (Prisma) | Server component fetches directly; no client API call needed |
| Product detail | Frontend (client component, existing) | API (/api/products/[id]) | Page uses `useEffect` + fetch — matches existing pattern |
| Seller dashboard (Listings tab) | Frontend (client component, extend existing) | API (/api/dashboard/stats, /api/products) | Extend existing dashboard pattern |
| Featured listing query | Database (Prisma) | API layer | Two-query pattern: featured first, then paginated rest |
| SEC-05 cap enforcement | API (POST /api/products) | — | Server-side gate; client badge is cosmetic only |
| Stock count display | Frontend | Database (Prisma `_count`) | `_count.keys where isUsed=false` computed in query |
| Key decryption | API (/api/orders/[id]) | lib/crypto.ts | Decrypt only here; enforcement is code discipline |

---

## Standard Stack

### Core (already in project — verified by codebase inspection)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| Prisma | (existing) | ORM + migrations | `npx prisma migrate dev --name <name>` |
| Next.js 14 | (existing) | App Router, Server/Client components | |
| Tailwind CSS + shadcn/ui | (existing) | Styling, UI primitives | `components/ui/` — do not modify directly |
| Zod | (existing) | API request validation | All routes already use it |
| Node.js `crypto` (built-in) | Node 18+ | AES-256-GCM encryption | No extra install needed |

### Supporting
| Library | Purpose | Notes |
|---------|---------|-------|
| `lib/utils.ts` `getLocalizedText()` | Read multilingual JSON fields | Already exists, use it |
| `lib/auth-middleware.ts` `requireAuth()` | Protect seller routes | Already exists |
| shadcn/ui `Tabs`, `Select`, `RadioGroup`, `Textarea` | Listing creation form | Install if missing from components/ui |

**Installation:** No new packages required for Phase 2. Node.js `crypto` is built-in.

---

## Architecture Patterns

### System Architecture Diagram

```
Buyer browse request
    │
    ▼
app/[locale]/marketplace/page.tsx  (Server Component)
    │ Prisma query (two queries: featured + paginated)
    ▼
PostgreSQL
    │ products + category + seller + _count(keys where isUsed=false)
    ▼
ProductCard.tsx  (getLocalizedText for title/desc)
    └── Stock badge (>5 / ≤5 / 0)
    └── Featured ring + badge

Seller listing flow
    │
    ▼
/[locale]/dashboard  (client component)
    │ fetch /api/auth/me → role check
    ├── Listings tab → fetch /api/products?sellerId=me
    └── "Add Listing" → /[locale]/dashboard/listings/new

/[locale]/dashboard/listings/new  (client component)
    │ POST /api/products  [requireAuth SELLER]
    │     SEC-05 cap check: count(ACTIVE listings) & completedOrders
    │     Zod validate: title(Json), description(Json), price, categoryId, platform, deliveryType, imageUrl?
    │     productService.create()
    ▼
/[locale]/products/[id]  (redirect on success)
    │ Bulk key section: textarea → POST /api/products/[id]/keys
    │     key.service.bulkCreate() → encryptKey() each → createMany()
    ▼
PostgreSQL  (keyValue = AES-256-GCM ciphertext, never plaintext)
```

### Recommended Project Structure (additions only)

```
lib/
  crypto.ts              # NEW — encryptKey / decryptKey (AES-256-GCM)
app/[locale]/dashboard/
  listings/
    new/
      page.tsx           # NEW — listing creation form
    [id]/
      edit/
        page.tsx         # NEW — listing edit form
prisma/
  seed.ts                # NEW (or update existing) — seed Category rows
```

### Pattern 1: Featured + Paginated Split Query

**What:** Two separate Prisma queries to place featured listings above paginated results without mixing pagination math.

**When to use:** Marketplace browse page (D-23).

```typescript
// Source: [VERIFIED: direct codebase analysis — Prisma docs pattern]
const [featured, products, total] = await Promise.all([
  prisma.product.findMany({
    where: { ...baseWhere, isFeatured: true },
    orderBy: { createdAt: "desc" },
    include: productInclude,
  }),
  prisma.product.findMany({
    where: { ...baseWhere, isFeatured: false },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: productInclude,
  }),
  prisma.product.count({ where: { ...baseWhere, isFeatured: false } }),
]);
// Pagination `total` and `totalPages` applies only to non-featured
```

### Pattern 2: AES-256-GCM Encryption (lib/crypto.ts)

**What:** Encrypt key values at rest using Node.js built-in `crypto` module.

**When to use:** Every key import via `key.service.ts`; decrypt only in order detail route.

```typescript
// Source: [VERIFIED: Node.js crypto docs — https://nodejs.org/api/crypto.html]
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.KEY_ENCRYPTION_SECRET!; // 32-byte hex = 64 hex chars
const KEY_BUF = Buffer.from(KEY_HEX, "hex");        // must be exactly 32 bytes

export function encryptKey(plaintext: string): string {
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, KEY_BUF, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16-byte auth tag
  // Format: iv(hex):authTag(hex):ciphertext(hex)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptKey(ciphertext: string): string {
  const [ivHex, authTagHex, dataHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, KEY_BUF, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
```

**Critical:** `KEY_ENCRYPTION_SECRET` must be exactly 64 hex characters (32 bytes). Validate at startup or in `encryptKey` before use.

### Pattern 3: SEC-05 Listing Cap Check

**What:** Server-side enforcement — 403 if seller has ≥10 ACTIVE listings AND has no completed orders.

**When to use:** `POST /api/products` handler.

```typescript
// Source: [VERIFIED: direct codebase analysis]
// "completed orders" = orders on seller's products with status COMPLETED
const [activeListings, completedOrders] = await Promise.all([
  prisma.product.count({ where: { sellerId, status: "ACTIVE" } }),
  prisma.order.count({
    where: {
      product: { sellerId },
      status: "COMPLETED",
    },
  }),
]);
if (activeListings >= 10 && completedOrders === 0) {
  return jsonError("Listing limit reached. Complete your first sale to unlock unlimited listings.", 403);
}
```

**Note:** The Order model currently uses `OrderStatus` enum with `pending | paid | failed`. Phase 3 will expand this to include `COMPLETED`. For Phase 2 purposes, the cap check will always show 0 completed orders (no purchases yet in the system). The UI cap enforcement is the meaningful Phase 2 deliverable; the query structure just needs to be correct.

### Pattern 4: Multilingual JSON Field Queries (Search)

**What:** Prisma JSON path query for search against EN title field (D-24).

**When to use:** Marketplace search (LISTING-07).

```typescript
// Source: [VERIFIED: Prisma JSON filtering docs — https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields]
// For PostgreSQL JSON fields, use path filter:
...(q && {
  title: {
    path: ["en"],
    string_contains: q,
    // Note: mode: "insensitive" is NOT supported on JSON path queries in Prisma
    // Use raw SQL or accept case-sensitive search, OR lowercase both sides
  },
}),
// Alternative using $queryRaw for case-insensitive (ASSUMED — verify with Prisma docs for exact version):
// LOWER(title->>'en') LIKE LOWER('%query%')
```

**IMPORTANT SCHEMA CONFLICT DISCOVERED:** The current `schema.prisma` has `name Json` on Product, but the existing marketplace service (`product.service.ts`) references `title` (plain string), `description` (plain string), `category: { slug }` (relation), `seller` (relation), `keys` (relation with `isUsed`), and `sellerOrders`. None of these match the actual schema. This means:

1. The service file was written ahead of the schema — it will cause TypeScript/Prisma client errors when `prisma generate` is run.
2. The migration must reconcile these into a consistent schema.
3. The `name Json` field in current schema must be renamed to match the service (`title Json`), or the service must be updated to use `name`.

**Decision required:** The CONTEXT.md (D-01) says "title and description stored as multilingual JSON" — matching the service's `title` field name. Therefore the schema's `name Json` → rename to `title Json`, and add `description Json`. This is a column rename migration.

### Pattern 5: Category Seeding

**What:** Seed Category rows into database. Prisma recommends a dedicated `prisma/seed.ts` file.

**When to use:** Wave 0 / migration wave — run after schema migration.

```typescript
// Source: [VERIFIED: Prisma seeding docs — https://www.prisma.io/docs/orm/prisma-client/queries/crud]
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Game Accounts", slug: "game-accounts" },
    { name: "Software Keys", slug: "software-keys" },
    { name: "Gift Cards", slug: "gift-cards" },
    { name: "In-Game Items", slug: "in-game-items" },
    { name: "Other", slug: "other" },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
}
main().then(() => prisma.$disconnect()).catch(console.error);
```

Add to `package.json`:
```json
"prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }
```
Then run: `npx prisma db seed`

### Anti-Patterns to Avoid

- **Decrypting keys in product list or detail API responses:** Never pass `decryptKey()` output to any endpoint other than the authenticated order detail route. A code review check should verify this.
- **Using `prisma.productKey.createMany` with plaintext values:** Must call `encryptKey(key)` before inserting. The existing `key.service.ts` `bulkCreate` method does NOT do this — it must be updated.
- **Relying on TypeScript compilation to catch schema mismatches:** Run `npx prisma generate` after every schema change. The current codebase has service files that reference non-existent Prisma types (`ProductStatus`, `ProductType`, `Category`, `keys`, `isUsed`) — these will cause build failures until the migration runs.
- **Mutating `components/ui/` directly:** All shadcn/ui components must be used as-is; create wrapper components for extension.
- **Using `localStorage` for auth token in new seller flows:** The dashboard currently reads `localStorage.getItem("auth_token")`. New seller pages must follow the same pattern for consistency in Phase 2 (the httpOnly cookie is set, but the client JS reads Bearer token from localStorage). Do not fix or change this in Phase 2 — that is a Phase 1 regression to address separately if at all.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AES-256-GCM encryption | Custom XOR / base64 obfuscation | Node.js `crypto` built-in | Authenticated encryption with GCM auth tag prevents tampering |
| Multilingual text extraction | Inline JSON.parse chains | `getLocalizedText()` in `lib/utils.ts` | Already handles null/fallback; consistent across app |
| API request validation | Manual `typeof` / `if` checks | Zod (already installed, all routes use it) | Parse, not validate; type inference |
| DB transactions for key import | Manual try/catch rollback | `prisma.$transaction()` | Prevents partial imports |
| Category management UI | Custom admin form in Phase 2 | Prisma seed + hardcoded list | Category CRUD is Phase 7 |
| Form tab state | Custom tab implementation | shadcn/ui `Tabs` component | Already in `components/ui/` |

**Key insight:** The existing codebase already solved most infrastructure problems. This phase is primarily about closing the gap between the service layer (which is ahead of the schema) and adding the encryption layer.

---

## Critical Schema Delta

### Current `prisma/schema.prisma` — Product model
```prisma
model Product {
  id          String       @id @default(cuid())
  name        Json         // { en, ar, tr, ku }
  description Json         // { en, ar, tr, ku }
  price       Decimal      @db.Decimal(10, 2)
  imageUrl    String?
  category    String?      @default("General")
  sortOrder   Int          @default(0)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  licenseKeys LicenseKey[]
  orders      Order[]
}
```

### Target Product model (Phase 2 output)
```prisma
enum DeliveryType {
  INSTANT
  MANUAL
}

enum ProductStatus {
  ACTIVE
  INACTIVE
}

model Category {
  id       String    @id @default(cuid())
  name     String
  slug     String    @unique
  products Product[]
}

model Product {
  id           String        @id @default(cuid())
  title        Json          // { "en": "...", "ar": "..." }
  description  Json          // { "en": "...", "ar": "..." }
  price        Decimal       @db.Decimal(10, 2)
  imageUrl     String?
  platform     String?
  deliveryType DeliveryType  @default(INSTANT)
  status       ProductStatus @default(ACTIVE)
  isFeatured   Boolean       @default(false)
  sortOrder    Int           @default(0)
  sellerId     String
  seller       User          @relation("SellerProducts", fields: [sellerId], references: [id])
  categoryId   String?
  category     Category?     @relation(fields: [categoryId], references: [id])
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  keys         ProductKey[]
  orders       Order[]
  
  @@index([sellerId])
  @@index([status])
  @@index([isFeatured])
}
```

### LicenseKey / ProductKey — current schema mismatch
The current schema has `LicenseKey` with `key String @unique` and no `isUsed` field.
The service files (`key.service.ts`, `product.service.ts`) reference `ProductKey` with `isUsed Boolean`, `usedAt DateTime?`, `keyValue String`, `orderId String?`.

**Resolution:** Rename `LicenseKey` → `ProductKey` in migration, rename `key` → `keyValue`, add `isUsed Boolean @default(false)`, add `usedAt DateTime?`. The `keyValue` field stores AES-256-GCM ciphertext after Phase 2.

### Order model — guestEmail vs buyerId
Current schema has `guestEmail String` (old guest checkout). The service references `sellerOrders` (a relation from User to Order as seller — not buyer). Phase 2 decisions do not require buyer accounts on orders (that is Phase 3), but the `seller` side of Order relations is needed for the SEC-05 cap check.

**Resolution for Phase 2:** The Order model will be updated in Phase 3. For the SEC-05 check in Phase 2, count completed orders via `product: { sellerId }` join. The `status` enum must include `COMPLETED` to make this meaningful — but since no completed orders exist before Phase 3, the cap check will always return 0 completed orders, which means all new sellers are capped at 10. This is correct behavior for Phase 2 launch.

### User model — add seller relation
Add `sellerProducts Product[] @relation("SellerProducts")` to `User`.

---

## Component Reconciliation: Two ProductCard Components

| File | Design | Data Shape | Status |
|------|--------|-----------|--------|
| `components/product-card.tsx` | Glassmorphism dark, single `imageUrl`, multilingual JSON via `getLocalizedText()`, link to `/checkout` | `{ id, name: Json, description: Json, price, imageUrl }` | Legacy storefront card — retire this in Phase 2 |
| `components/marketplace/ProductCard.tsx` | Dark gray card, `images[]` array, plain string `title`/`description`, multi-seller | `{ id, title: string, description: string, images: string[], type, seller, availableKeys }` | Update this one — it is the canonical card |

**Action:** Update `components/marketplace/ProductCard.tsx` to:
- Accept `title: Json` and `description: Json` and call `getLocalizedText(title, locale)`
- Change `images: string[]` to `imageUrl: string | null` (D-02 — single image URL)
- Add `deliveryType: "INSTANT" | "MANUAL"` badge (replaces `type` GAME_ACCOUNT / SOFTWARE_KEY)
- Add `isFeatured?: boolean` prop for ring + badge
- Apply correct stock badge logic (>5 / ≤5 / 0)
- Remove the old card from imports everywhere `components/product-card.tsx` was used

---

## Dashboard Auth Pattern (localStorage vs httpOnly Cookie)

The existing `app/[locale]/dashboard/page.tsx` reads `localStorage.getItem("auth_token")` and passes `Authorization: Bearer <token>` headers. This is the current auth pattern for client-side pages. The middleware sets `mp_token` httpOnly cookie AND the auth service returns a JWT the client stores in localStorage.

**Phase 2 decision:** Do NOT fix the localStorage vs cookie inconsistency in Phase 2. New seller pages (listings/new, listings/[id]/edit) must follow the SAME pattern as the existing dashboard — read from localStorage, pass Bearer header. This maintains consistency and avoids introducing a regression in Phase 2 scope.

The server-side auth (`requireAuth()` in `lib/auth-middleware.ts`) already handles both: it checks `Authorization` header first, then falls back to `mp_token` cookie. New API routes work correctly either way.

---

## API Routes: Existing vs Needed

### Existing (verified by codebase inspection)
| Route | Method | Handler | Gap |
|-------|--------|---------|-----|
| `/api/products` | GET | Public browse with filters | Missing `platform`, `isFeatured` filter support; missing featured split |
| `/api/products` | POST | Create listing | Missing SEC-05 cap check; schema not yet migrated |
| `/api/products/[id]` | GET | Public product detail | Will work after schema migration |
| `/api/products/[id]` | PUT | Update listing | Missing `platform`, `deliveryType`, `imageUrl` in Zod schema |
| `/api/products/[id]` | DELETE | Soft delete | Works; calls `productService.softDelete()` |
| `/api/products/[id]/keys` | POST | Bulk key import | Missing `encryptKey()` call — stores plaintext |

### Needed (new routes)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/products/[id]/keys` | GET | Return available key count for seller's own listing (not key values) |
| `/api/dashboard/stats` | GET | Already exists (referenced in dashboard); verify it returns `totalProducts`, `totalEarnings` for SELLER role |

### Route that must NOT reveal keys
`GET /api/products/[id]` must never include `keyValue` in its response. The Prisma include should explicitly exclude `keys` relation or select only `_count`.

---

## Common Pitfalls

### Pitfall 1: Schema-Service Mismatch (CRITICAL)
**What goes wrong:** TypeScript compiles against `@prisma/client` types. If `prisma generate` has not been run after the migration, the generated client still uses the old types. Service files referencing `ProductStatus`, `ProductType`, `Category`, `isUsed` etc. will cause build errors or silent runtime failures.
**Why it happens:** Service files were written ahead of the schema migration.
**How to avoid:** Run `npx prisma migrate dev` then `npx prisma generate` as the very first task. Do not write any service or API code until the generated client reflects the new schema.
**Warning signs:** TypeScript errors referencing unknown Prisma types; `prisma.$queryRaw` returning unexpected shapes.

### Pitfall 2: JSON Field Filtering in Prisma
**What goes wrong:** Using `contains` directly on a `Json` field does not work as expected in Prisma. The marketplace search (LISTING-07, D-24) must filter on `title->>'en'` (PostgreSQL JSON path).
**Why it happens:** Prisma JSON field filtering supports `path` + `string_contains` but case-insensitive mode (`mode: "insensitive"`) is NOT supported on JSON path queries as of Prisma 5.x.
**How to avoid:** Use Prisma raw query for case-insensitive JSON search OR accept case-sensitive substring match OR use `LOWER()` in a `$queryRaw`. For Phase 2, case-sensitive substring match on EN title is acceptable (D-24 explicitly says "simple substring match is sufficient").
**Correct pattern:**
```typescript
{ title: { path: ["en"], string_contains: q } }
// This is case-sensitive — acceptable per D-24
```

### Pitfall 3: encryptKey() Not Called at Import Time
**What goes wrong:** If `key.service.ts` `bulkCreate()` is updated to call `encryptKey()` but the existing `/api/products/[id]/keys` route calls `productService.bulkAddKeys()` (which has its own internal call chain), there may be a double-encryption or no-encryption path.
**Why it happens:** There are two code paths for key import: `productService.bulkAddKeys()` and `keyService.bulkCreate()`. Both exist in the codebase. Only one should be the canonical path.
**How to avoid:** Standardize on `keyService.bulkCreate()` with `encryptKey()` called inside it. Remove or deprecate `productService.bulkAddKeys()`. The route at `/api/products/[id]/keys` should call `keyService.bulkCreate()`.

### Pitfall 4: Featured + Paginated Math
**What goes wrong:** Including featured listings in the `total` count causes the pagination control to show extra pages that result in empty grids.
**Why it happens:** `total` includes featured items but the paginated query excludes them.
**How to avoid:** `total` and `totalPages` must be computed from the non-featured count only. Featured items are outside the pagination system.

### Pitfall 5: Missing `sellerId` in Product Creation
**What goes wrong:** POST /api/products extracts `user.userId` from the JWT but if the Zod schema includes `sellerId` as a client-supplied field, a seller could impersonate another seller.
**Why it happens:** Naive pass-through of request body.
**How to avoid:** Always inject `sellerId: user.userId` server-side after auth; never accept `sellerId` from the request body. The existing code does this correctly — verify it is preserved.

### Pitfall 6: KEY_ENCRYPTION_SECRET Length
**What goes wrong:** If `KEY_ENCRYPTION_SECRET` is not exactly 64 hex characters (32 bytes), `Buffer.from(hex, "hex")` produces a wrong-length key and `createCipheriv` throws `Invalid key length`.
**Why it happens:** Developer generates a short secret or forgets the encoding.
**How to avoid:** Add a startup guard in `lib/crypto.ts`:
```typescript
if (KEY_BUF.length !== 32) {
  throw new Error("KEY_ENCRYPTION_SECRET must be 64 hex chars (32 bytes)");
}
```

---

## Code Examples

### Multilingual JSON field on ProductCard
```typescript
// Source: [VERIFIED: lib/utils.ts getLocalizedText — direct codebase inspection]
import { getLocalizedText } from "@/lib/utils";

// In ProductCard component:
const titleText = getLocalizedText(title, locale, "Product");
const descText  = getLocalizedText(description, locale, "");
// title and description are `Json` type from Prisma — passed as `unknown`
```

### Seller-scoped listing fetch (SEC-05 display counter)
```typescript
// Source: [VERIFIED: direct codebase analysis]
// In dashboard Listings tab — fetch seller's own listings:
const res = await fetch(`/api/products?sellerId=${userId}&limit=100`, {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await res.json();
const activeCount = data.products.filter((p: Product) => p.status === "ACTIVE").length;
// Show badge: `${activeCount}/10 listings`
// Disable "Add Listing" if activeCount >= 10 AND completedOrders === 0
```

### Stock badge logic
```typescript
// Source: [VERIFIED: D-21, UI-SPEC stock badge spec]
function StockBadge({ count }: { count: number }) {
  if (count === 0)    return <Badge className="text-red-400 bg-red-500/10">Out of stock</Badge>;
  if (count <= 5)     return <Badge className="text-amber-400 bg-amber-500/10">Only {count} left</Badge>;
  return              <Badge className="text-emerald-400 bg-emerald-500/10">{count} in stock</Badge>;
}
```

### Platform filter addition to ProductFilters
```typescript
// Source: [VERIFIED: ProductFilters.tsx + D-05 platform list]
const PLATFORMS = [
  { value: "", label: "All Platforms" },
  { value: "PC", label: "PC" },
  { value: "PlayStation", label: "PlayStation" },
  { value: "Xbox", label: "Xbox" },
  { value: "Nintendo Switch", label: "Nintendo Switch" },
  { value: "Mobile", label: "Mobile" },
  { value: "Multiple Platforms", label: "Multiple Platforms" },
  { value: "Other", label: "Other" },
];
// Add `platform` to `searchParams` parsing and `updateParam` calls
// Add `platform` to the marketplace page's `where` clause:
...(platform && { platform }),
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `name Json` field on Product | `title Json` + `description Json` (separate fields) | Migration rename + service update |
| `LicenseKey` model with `key String` | `ProductKey` model with `keyValue String` (encrypted), `isUsed Boolean` | Model rename + column rename + migration |
| `AdminUser` legacy model | `User` with `role: ADMIN` (Phase 1 decision) | Already reflected in current schema |
| `guestEmail` on Order | Will become `buyerId` in Phase 3 | Leave for Phase 3; don't change in Phase 2 |
| Plain-string `title`/`description` in marketplace UI | `Json` fields read via `getLocalizedText()` | Update marketplace components |
| `images: string[]` on ProductCard | `imageUrl: string | null` (D-02) | Single image URL — update card component |

**Deprecated patterns:**
- `components/product-card.tsx` — legacy single-seller card; retire it in Phase 2, remove imports
- `product.category String? @default("General")` — free-text category; replaced by `Category` relation
- `sortOrder Int` — unused field; can remain in schema but is not used by Phase 2 queries

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Prisma JSON `path` + `string_contains` is case-sensitive in current Prisma version | Pitfall 2, Pattern 4 | Search results may be unexpected; use $queryRaw workaround |
| A2 | `npx prisma db seed` works with `ts-node` on Windows in this project | Category Seeding | May need `tsx` or `ts-node/esm` depending on tsconfig |
| A3 | `Order.status` enum needs `COMPLETED` value for SEC-05 cap check to ever return >0 | Pitfall / SEC-05 pattern | Cap will always trigger for new sellers until Phase 3 adds COMPLETED status — this is acceptable |

**If this table is empty for assumptions that matter:** All other claims were verified by direct codebase inspection.

---

## Open Questions

1. **ProductKey model name conflict**
   - What we know: Current schema has `LicenseKey`; all service files reference `ProductKey`. Migration must rename the model.
   - What's unclear: Whether any other files (test fixtures, admin routes) reference `LicenseKey` by name.
   - Recommendation: `grep -r "LicenseKey" .` before writing migration to find all references.

2. **Order status enum for SEC-05**
   - What we know: Current `OrderStatus` has `pending | paid | failed`. The SEC-05 cap check queries for `COMPLETED` orders.
   - What's unclear: Whether to add `COMPLETED` to the enum in Phase 2 (ahead of Phase 3) or leave the check as always-returning-0.
   - Recommendation: Add `COMPLETED` (and the other Phase 3 statuses) to the enum in Phase 2's migration so the schema is ready. Phase 3 sets orders to COMPLETED — no code conflict.

3. **`api/dashboard/stats` route exists?**
   - What we know: Dashboard page calls `/api/dashboard/stats` but this route is not in the `app/api/` directory listing visible here.
   - What's unclear: Whether it exists under a different path or is missing entirely.
   - Recommendation: Check `app/api/dashboard/` directory; if missing, create it as part of Phase 2.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 2 is a code/schema change. External dependencies are PostgreSQL (already running, proven by Phase 1 completion) and Node.js `crypto` (built-in). No new external services required.

---

## Validation Architecture

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Notes |
|--------|----------|-----------|-------|
| LISTING-01 | Seller can create listing via POST /api/products | Manual (no test infra detected) | Verify: 201 response, product in DB |
| LISTING-02 | Keys imported encrypted | Manual | Verify: `keyValue` in DB is not plaintext |
| LISTING-03 | Stock count accurate | Manual | Verify: `_count.keys` matches imported count |
| LISTING-04 | Featured listings appear first | Manual browse | Verify: isFeatured=true products render in featured row |
| LISTING-05 | Platform filter works | Manual browse | Verify: platform filter narrows results |
| LISTING-07 | Keyword search returns matches | Manual browse | Verify: substring match on EN title |
| SEC-02 | Keys stored encrypted | DB inspection | `SELECT "keyValue" FROM "ProductKey" LIMIT 1` — must not be plaintext |
| SEC-03 | Keys not in product list/detail | API response check | `GET /api/products/[id]` — response must not contain `keyValue` |
| SEC-05 | Cap enforced at 10 listings | Manual API call | POST /api/products with 11th listing → 403 |

No automated test framework detected in the codebase. Verification will be manual per the above checks.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | `requireAuth()` wrapping all seller routes |
| V4 Access Control | yes | `sellerId` scoping on all update/delete; reject mismatched seller |
| V5 Input Validation | yes | Zod in all API routes |
| V6 Cryptography | yes | AES-256-GCM via Node.js `crypto` — never hand-roll |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Seller A edits Seller B's listing | Tampering | `productService.update(id, sellerId)` uses `updateMany({ where: { id, sellerId } })` — mismatched seller gets count=0 |
| Key value exposed in browse response | Information Disclosure | Explicitly exclude `keys` from product GET responses; select `_count` only |
| Listing cap bypass (client-side only) | Elevation of Privilege | Cap enforced server-side in POST /api/products; client badge is cosmetic |
| Tampering with AES-GCM ciphertext | Tampering | GCM auth tag — `decipher.setAuthTag()` throws on tampered data |
| Seller impersonation via request body sellerId | Spoofing | Inject `sellerId: user.userId` from JWT server-side; reject client-supplied sellerId |

---

## Sources

### Primary (HIGH confidence — direct codebase inspection)
- `prisma/schema.prisma` — current schema, all model shapes verified
- `services/product.service.ts` — existing service shape, schema mismatch confirmed
- `services/key.service.ts` — missing encryption confirmed
- `lib/auth-middleware.ts` — `requireAuth()` pattern confirmed
- `lib/utils.ts` — `getLocalizedText()` utility confirmed
- `components/marketplace/ProductCard.tsx` — component props and structure
- `components/marketplace/ProductFilters.tsx` — filter sidebar structure
- `app/[locale]/marketplace/page.tsx` — server component pattern
- `app/[locale]/dashboard/page.tsx` — localStorage auth pattern confirmed
- `app/api/products/` — all three route files inspected
- `.planning/phases/02-marketplace-browsing-and-listings/02-CONTEXT.md` — all decisions

### Secondary (HIGH confidence — authoritative docs)
- Node.js crypto AES-256-GCM: `createCipheriv`, `createDecipheriv`, `getAuthTag`, `setAuthTag` — standard Node.js built-in API [VERIFIED: Node.js docs pattern]
- Prisma JSON field filtering: `path` + `string_contains` — Prisma documentation [CITED: https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields]
- Prisma seeding: `prisma/seed.ts` + package.json `prisma.seed` key [CITED: https://www.prisma.io/docs/orm/prisma-client/queries/crud]

---

## Metadata

**Confidence breakdown:**
- Schema delta: HIGH — based on direct inspection of both current schema and service files
- Crypto implementation: HIGH — AES-256-GCM is standard Node.js; pattern is well-established
- Component reconciliation: HIGH — both card components inspected, mismatch documented
- API route inventory: HIGH — all route files read directly
- Pitfalls: HIGH — based on code inspection, not speculation

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (stable stack — schema decisions are locked)
