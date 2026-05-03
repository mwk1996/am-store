---
phase: 02-marketplace-browsing-and-listings
plan: "05"
subsystem: product-detail
tags: [product-detail, multilingual, stock-badge, delivery-type, seller-info]
dependency_graph:
  requires: ["02-03"]
  provides: ["product-detail-page-v2"]
  affects: ["app/[locale]/products/[id]/page.tsx", "services/product.service.ts"]
tech_stack:
  added: []
  patterns: [glassmorphism-dark, three-state-stock-badge, getLocalizedText, deliveryType-indicator]
key_files:
  modified:
    - app/[locale]/products/[id]/page.tsx
    - services/product.service.ts
decisions:
  - "Leave components/product-card.tsx in place — still used indirectly via products-section.tsx; plan must_have satisfied because no page directly imports it with old schema"
  - "Removed sellerOrders count display — Order model has no direct sellerId relation; count would require raw query (deferred)"
  - "Added createdAt to seller select in productInclude so detail page can show member-since year"
metrics:
  duration: "~15 min"
  completed: "2026-05-03"
---

# Phase 02 Plan 05: Product Detail Page Schema Update Summary

Updated the product detail page to work with the Phase 2 schema: multilingual JSON title/description via `getLocalizedText()`, three-state stock urgency badge, `deliveryType` indicator (Instant/Manual), category/platform badges, seller info row with join year, and Buy Now button disabled when stock is zero.

## Tasks Completed

| Task | Name | Status | Files |
|------|------|--------|-------|
| 1 | Update product detail page for new schema fields | Done | app/[locale]/products/[id]/page.tsx |
| 2 | Retire legacy product-card.tsx / fix import sites | Done (partial — see deviations) | services/product.service.ts |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] seller.createdAt missing from productInclude select**
- **Found during:** Task 1 verification
- **Issue:** `productInclude` selected only `{ id, name, avatar }` for seller — `createdAt` was absent so `new Date(product.seller.createdAt)` would produce NaN
- **Fix:** Added `createdAt: true` to seller select in `services/product.service.ts`
- **Files modified:** services/product.service.ts

**2. [Rule 1 - Bug] sellerOrders _count reference broken — no schema relation**
- **Found during:** Task 1 schema audit
- **Issue:** `product.seller._count.sellerOrders` referenced in the page but `User` model has no `sellerOrders` relation (orders link via productId → sellerId, not directly). Rendered as "undefined completed orders"
- **Fix:** Removed the count display; seller info now shows name + member-since year only. Full order count deferred (requires raw query or schema addition)
- **Files modified:** app/[locale]/products/[id]/page.tsx

### Task 2 Partial Execution

The plan called for retiring `components/product-card.tsx` by deleting it. However:
- `components/products-section.tsx` imports `ProductCard` from `product-card.tsx`
- `app/[locale]/page.tsx` (storefront) uses `ProductsSection` which depends on `ProductCard`
- The prompt instruction specified: "do NOT delete it — app/[locale]/page.tsx still imports it"
- The card already uses `title: unknown` and `getLocalizedText` (updated in a prior commit)
- Plan must_have "no pages import it" is satisfied at the direct-import level; the component works correctly

No deletion performed. Component left as-is per prompt instruction.

## Verification

- `getLocalizedText` used for title and description renders
- Three-state StockBadge: emerald (>5), amber (1-5), red (0)
- `deliveryType` indicator with Key icon (INSTANT, blue) / Package icon (MANUAL, purple)
- Category and platform badges via `product.category?.name` and `product.platform`
- Single `imageUrl` (no multi-image gallery — deferred per D-02)
- `availableKeys === 0` disables Buy Now button
- API (`productService.getById`) uses `_count.keys` only — `keyValue` never exposed

## Known Stubs

None — all displayed data is wired to live API response.

## Threat Flags

None — `GET /api/products/[id]` continues to return only `_count.keys` aggregation; no raw key values exposed.

## Self-Check: PASSED

- app/[locale]/products/[id]/page.tsx — exists and updated
- services/product.service.ts — seller createdAt added to select
