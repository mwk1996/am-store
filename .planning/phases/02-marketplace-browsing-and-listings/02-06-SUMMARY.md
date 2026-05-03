---
phase: 02-marketplace-browsing-and-listings
plan: "06"
subsystem: seller-listing-management
tags: [listings, seller, forms, i18n, sec-05]
dependency_graph:
  requires: ["02-03"]
  provides: ["LISTING-01", "LISTING-02", "LISTING-13", "SEC-04", "SEC-05"]
  affects: ["dashboard", "products"]
tech_stack:
  added: []
  patterns:
    - localStorage Bearer token auth pattern (consistent with dashboard)
    - EN/AR tabbed bilingual form with dir=rtl on AR inputs
    - Blur-triggered inline field validation
    - SEC-05 active listing cap banner
key_files:
  created:
    - app/api/categories/route.ts
    - app/[locale]/dashboard/listings/new/page.tsx
    - app/[locale]/dashboard/listings/[id]/edit/page.tsx
  modified: []
decisions:
  - Added GET /api/categories lightweight endpoint to serve category options to the form (avoids hardcoding IDs)
  - Edit page shows success banner in-place rather than redirecting (seller may continue editing or navigate to key import)
  - Deactivate uses DELETE /api/products/[id] with window.confirm gate before calling API
metrics:
  duration: ~15min
  completed: 2026-05-03
  tasks_completed: 2
  files_created: 3
---

# Phase 2 Plan 06: Seller Listing Creation & Edit Forms Summary

Seller listing creation and edit forms with bilingual EN/AR content, full Phase 2 fields, SEC-05 cap enforcement, and deactivate support.

## What Was Done

### Task 1: GET /api/categories + Listing Creation Form

Created `app/api/categories/route.ts` — a lightweight Prisma-backed endpoint that returns all categories ordered by name. Used by both form pages to populate the Category select.

Created `app/[locale]/dashboard/listings/new/page.tsx` ("use client"):

- On mount: reads `localStorage.getItem("auth_token")`, redirects to login if missing; fetches `/api/auth/me` (Bearer), redirects if role !== SELLER; fetches `/api/categories` and `/api/products?sellerId=me&limit=100` to count active listings
- SEC-05 banner rendered when `activeCount >= 10` (amber, warns about 10-listing cap); Create button disabled in this state
- Form structure: glassmorphism card (`bg-card/60 backdrop-blur-sm border-white/8 rounded-2xl`), max-w-2xl
- shadcn Tabs for EN/AR: English tab with `titleEn`/`descEn` inputs; Arabic tab with `dir="rtl"` on both inputs
- Language-agnostic fields: price (number with $ prefix), category (Select from API), platform (Select from PLATFORMS constant), deliveryType (RadioGroup INSTANT/MANUAL with descriptions)
- Image URL text input with onBlur preview (`h-16 w-16 rounded-lg object-cover`)
- Blur-triggered validation with inline errors (`text-xs text-red-400 mt-1`)
- handleSubmit: validates all required fields, POSTs `/api/products` with Bearer header, redirects to `/${locale}/products/${data.id}` on 201, shows error banner on 403 (SEC-05) or other errors
- Loading spinner on submit button via Loader2

### Task 2: Listing Edit Form

Created `app/[locale]/dashboard/listings/[id]/edit/page.tsx` ("use client"):

- On mount: same auth check; fetches `GET /api/products/${productId}` and verifies `product.sellerId === me.id`; pre-populates all fields using `getLocalizedText()` from `@/lib/utils`
- Identical form layout to create page but headed "Edit Listing"
- On submit: calls `PUT /api/products/${productId}` with Bearer header; shows in-place success banner "Listing updated successfully." (no redirect)
- Note under DeliveryType: "Changing delivery type affects new orders only. Existing orders are unaffected."
- Deactivate Listing button (ghost, text-red-400): window.confirm gate → DELETE `/api/products/${productId}` → redirects to `/${locale}/dashboard` on 200

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both forms wire real API endpoints.

## Threat Flags

No new threat surface beyond what was already in the plan's threat model (T-02-15, T-02-16, T-02-17). API enforces ownership server-side; client forms are cosmetic guards only.

## Self-Check: PASSED

- `app/api/categories/route.ts` — exists, exports GET
- `app/[locale]/dashboard/listings/new/page.tsx` — exists, "use client", localStorage auth pattern, Tabs/bilingual, SEC-05 banner, dir=rtl
- `app/[locale]/dashboard/listings/[id]/edit/page.tsx` — exists, "use client", getLocalizedText pre-population, PUT call, Save Changes, Deactivate button
