# Phase 2: Marketplace Browsing & Listings - Context

**Gathered:** 2026-05-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the seller-side listing creation flow and the buyer-side marketplace discovery experience: sellers can create and manage product listings with bilingual content and bulk key upload; buyers can browse, filter, search, and view product details.

This phase does NOT include the purchase/checkout flow, wallet top-up, order management, or reviews — those come in Phases 3, 4, and 5. It DOES include key encryption at rest (SEC-02) and seller trust constraints (SEC-04, SEC-05, SEC-06) that must be enforced before any listing or key touches the database.

</domain>

<decisions>
## Implementation Decisions

### Product Schema
- **D-01:** Product `title` and `description` are stored as multilingual JSON `{ "en": "...", "ar": "..." }` — consistent with Phase 1's AR+EN-only decision and the existing schema convention. The new marketplace code using plain English strings must be updated to read from JSON.
- **D-02:** Single `imageUrl String?` per product — seller pastes a URL or uploads one image. Multi-image gallery is deferred to v2.
- **D-03:** `deliveryType` enum lives on the Product model: `INSTANT` (key revealed immediately on payment) or `MANUAL` (seller posts credentials). All keys for a product share the same delivery type.
- **D-04:** Categories are a predefined seeded list — no admin CRUD needed in Phase 2. Seed: Game Accounts, Software Keys, Gift Cards, In-Game Items, Other.
- **D-05:** Platform is a predefined dropdown — no free-text. Seed: PC, PlayStation, Xbox, Nintendo Switch, Mobile, Multiple Platforms, Other. Stored as a `platform String` field on Product.
- **D-06:** Product must have a `status` field: `ACTIVE | INACTIVE`. Deleting a listing sets status=INACTIVE (soft delete). Out-of-stock products remain ACTIVE but the buy button is disabled.
- **D-07:** `isFeatured Boolean @default(false)` field on Product. Admin sets this in Phase 7's admin panel — the field and query support must exist in Phase 2 so featured listings appear at the top of marketplace results.
- **D-08:** `sellerId` foreign key on Product — every product belongs to an authenticated seller (User with role=SELLER).

### Seller Listing Dashboard
- **D-09:** Sellers manage listings at `/[locale]/dashboard` — a tabbed dashboard with Listings, Orders, and Earnings tabs. Creating a new listing opens `/[locale]/dashboard/listings/new`.
- **D-10:** The listing creation form has tabbed EN / AR inputs for title and description (matching the existing admin product editor pattern). Other fields (price, category, platform, deliveryType, imageUrl) are single-language.
- **D-11:** After successful listing creation, redirect seller to the new listing's detail page (`/[locale]/products/[id]`) so they can immediately add keys.
- **D-12:** Bulk key upload via textarea paste: seller pastes keys one-per-line. The UI parses and shows a count preview ("23 keys detected") before confirming import. Each key is validated for non-empty, trimmed, de-duplicated within the batch.
- **D-13:** Sellers can edit listing title, description, price, imageUrl, platform, and deliveryType after creation. Keys cannot be un-imported — only new keys can be added.
- **D-14:** Sellers can soft-delete (deactivate) a listing. Status changes to INACTIVE. Active orders on that listing are unaffected.

### Key Encryption (SEC-02 + SEC-03)
- **D-15:** License keys are encrypted at rest using AES-256-GCM via Node.js built-in `crypto` module. Encryption key stored in env var `KEY_ENCRYPTION_SECRET` (32-byte hex). Keys are encrypted on import and stored as `keyValue String` (ciphertext).
- **D-16:** Keys are decrypted ONLY in `GET /api/orders/[id]` — the authenticated buyer's order detail endpoint. The buyer must own the order and it must be in `paid` status. Keys NEVER appear in any product list, marketplace browse, or product detail API response (SEC-03).
- **D-17:** A `lib/crypto.ts` utility exports `encryptKey(plaintext: string): string` and `decryptKey(ciphertext: string): string`. All key import and reveal routes use this utility — never raw crypto calls inline.

### Listing Limits & Stock Display
- **D-18:** SEC-05 (10-listing cap for new sellers): enforced server-side — API returns 403 if seller has ≥10 ACTIVE listings AND has no completed orders. On the dashboard, show a counter badge "7/10 listings" and disable the "Create listing" button with tooltip "Complete your first sale to unlock unlimited listings" when the cap is reached.
- **D-19:** SEC-04 (7-day earnings hold): backend enforcement only in Phase 2 (wallet service handles it in Phase 4). On the seller dashboard, show a dismissible info banner: "Your first earnings are held for 7 days before they're available for withdrawal." Banner hides once seller has at least one completed order.
- **D-20:** SEC-06 (first withdrawal always requires admin review): enforced in Phase 4's wallet service. No Phase 2 UI needed.
- **D-21:** Stock count display on product cards and detail page: show exact count when >5 (e.g. "12 in stock"). Show "Only N left" warning badge in amber when ≤5 and >0. Show "Out of stock" badge in red and disable buy button when count is 0.

### Marketplace Browse & Search
- **D-22:** The existing `app/[locale]/marketplace/page.tsx` is the correct browse page — update it to read multilingual JSON fields and connect to the updated schema. Keep the existing filter sidebar (category, type, price range, search).
- **D-23:** Featured listings (`isFeatured: true`) appear at the top of marketplace results, above the paginated regular results. Within featured, order by `createdAt DESC`. Pagination applies only to non-featured results.
- **D-24:** Search (LISTING-07) uses Prisma `contains` + `mode: insensitive` on the EN title field. No full-text search engine in Phase 2 — simple substring match is sufficient.

### Claude's Discretion
- Exact Prisma schema field names beyond what's specified above
- Pagination page size (12 per page is the existing default — keep it)
- Form validation error messages (be specific but friendly)
- Loading skeletons and empty state copy
- API error shapes (follow existing `{ error: string }` convention)
- Whether to add a `platform` filter to the existing marketplace filter sidebar (yes, add it — it's logical)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Marketplace Code (Update, Don't Rewrite)
- `app/[locale]/marketplace/page.tsx` — browse page with filters + pagination; update to use new schema fields
- `components/marketplace/ProductCard.tsx` — product card with seller info, ratings, delivery badge; update for multilingual JSON
- `components/marketplace/ProductFilters.tsx` — sidebar filters; add platform filter
- `app/[locale]/products/[id]/page.tsx` — product detail page; update for multilingual JSON + stock display
- `components/product-card.tsx` — legacy card (old single-seller design); reconcile or replace with marketplace/ProductCard.tsx

### Existing Schema (Must Extend, Not Replace)
- `prisma/schema.prisma` — current Product model (name Json, no sellerId, no deliveryType, no status, no isFeatured, no platform); must migrate to multi-seller schema

### Existing Services
- `services/product.service.ts` — exists; review and extend for seller-scoped operations
- `services/key.service.ts` — exists; extend with AES-256-GCM encryption on import

### Requirements
- `.planning/REQUIREMENTS.md` — LISTING-01 through LISTING-07, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06

### Auth Foundation (Phase 1 Output)
- `lib/auth-middleware.ts` — `requireAuth()` for seller-only routes
- `app/api/auth/me/route.ts` — used for client-side seller identity check

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/marketplace/ProductCard.tsx` — rich card with seller info, rating stars, delivery type badge, stock badge; needs multilingual JSON update
- `components/marketplace/ProductFilters.tsx` — filter sidebar with category, type, price range, search; add platform filter
- `app/[locale]/marketplace/page.tsx` — server component with Prisma query, pagination, and filter parsing; update schema fields
- `app/[locale]/products/[id]/page.tsx` — full detail page with image gallery, seller info, reviews, buy button
- `app/[locale]/dashboard/` — buyer dashboard exists; extend for seller tabs (Listings, Orders, Earnings)
- `components/ui/` — shadcn/ui components (Badge, Button, Input, Tabs, Dialog, Textarea) — use these, don't write custom

### Established Patterns
- `prisma.$transaction()` for atomic key imports (must use — prevents partial imports)
- `requireAuth()` wrapping all seller API routes (established in Phase 1)
- Zod schemas in API routes for request validation
- `NextResponse.json({ error: string })` shape for errors
- `getLocalizedText(json, locale, fallback)` utility in `lib/utils.ts` — use for reading multilingual JSON fields
- httpOnly cookie `mp_token` identifies seller — `requireAuth()` extracts this

### Integration Points
- Dashboard at `/[locale]/dashboard` — extend with seller listings tab (sellers see it, buyers don't)
- Marketplace at `/[locale]/marketplace` — primary buyer browse entry point
- `app/api/products/` — existing product API routes; extend for seller CRUD
- Prisma schema migration required before any new code runs

</code_context>

<specifics>
## Specific Ideas

- Listing creation form: tabs for EN/AR content (matching the existing admin product editor pattern — `app/[locale]/admin/` uses this style)
- The existing card style (rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm) should be used for the seller listing form too — visual consistency
- Bulk key import textarea: show a live preview count as the user types ("23 keys detected") — improves confidence before submitting
- Low-stock threshold: ≤5 keys triggers "Only N left" amber badge — creates purchase urgency without being deceptive

</specifics>

<deferred>
## Deferred Ideas

- Multi-image gallery per product — v2
- Buyer-facing seller profile page (profile stats, all listings, reviews) — Phase 5 or v2
- Full-text search with Postgres `pg_trgm` or external engine — v2; substring match is enough for Phase 2
- Real-time stock countdown ("3 people viewing this") — v2
- Category CRUD admin UI — Phase 7

</deferred>

---

*Phase: 02-marketplace-browsing-and-listings*
*Context gathered: 2026-05-03*
