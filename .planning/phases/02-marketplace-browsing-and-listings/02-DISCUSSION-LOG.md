# Phase 2: Marketplace Browsing & Listings - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-03
**Phase:** 2 — Marketplace Browsing & Listings
**Areas discussed:** Product listing schema & taxonomy, Seller listing dashboard UX, Key encryption (SEC-02), Listing limits & stock display

---

## Product Listing Schema & Taxonomy

| Option | Description | Selected |
|--------|-------------|----------|
| Multilingual JSON (en + ar) | Sellers fill EN + AR title/description; buyers see their locale | ✓ |
| Plain English only | One English listing for all buyers | |

**User's choice:** Multilingual JSON (EN + AR)
**Notes:** Consistent with Phase 1 AR+EN decision.

| Option | Description | Selected |
|--------|-------------|----------|
| Predefined seeded categories | Fixed list seeded at migration; no admin UI in Phase 2 | ✓ |
| Admin-managed (dynamic) | Admin adds/edits categories from admin panel | |

**User's choice:** Predefined seeded list

| Option | Description | Selected |
|--------|-------------|----------|
| Predefined platform dropdown | Fixed list: PC, PlayStation, Xbox, Nintendo Switch, Mobile, Multiple Platforms, Other | ✓ |
| Free-text field | Sellers type any platform name | |

**User's choice:** Predefined dropdown

| Option | Description | Selected |
|--------|-------------|----------|
| Single image URL | One imageUrl field; seller pastes URL or uploads one image | ✓ |
| Multiple images (gallery) | Up to 5 images; multi-image gallery | |

**User's choice:** Single image URL per product

| Option | Description | Selected |
|--------|-------------|----------|
| deliveryType on Product | All keys for a product share delivery type | ✓ |
| Per-key / per-order | Each key or order has individual delivery type | |

**User's choice:** On the Product

---

## Seller Listing Dashboard UX

| Option | Description | Selected |
|--------|-------------|----------|
| Seller dashboard at /dashboard | Listings, Orders, Earnings tabs; new listing at /dashboard/listings/new | ✓ |
| Dedicated /seller section | Separate /seller/listings route tree | |

**User's choice:** Dashboard at /dashboard

| Option | Description | Selected |
|--------|-------------|----------|
| Textarea paste (CSV or newline-separated) | Keys one-per-line; count preview before confirming | ✓ |
| CSV file upload | Seller uploads .csv file | |

**User's choice:** Textarea paste

| Option | Description | Selected |
|--------|-------------|----------|
| Edit + soft-delete | Sellers can edit and soft-delete listings | ✓ |
| No edit/delete in Phase 2 | Create-only | |

**User's choice:** Edit + soft-delete

| Option | Description | Selected |
|--------|-------------|----------|
| Side-by-side EN + AR fields | Both inputs visible simultaneously | |
| Tabbed EN / AR tabs | EN tab and AR tab (like existing admin editor) | ✓ |

**User's choice:** Tabbed EN / AR tabs

| Option | Description | Selected |
|--------|-------------|----------|
| Redirect to listing detail page | Seller sees live listing immediately after creation | ✓ |
| Stay on form with success toast | Form resets with toast | |

**User's choice:** Redirect to listing detail page

---

## Key Encryption (SEC-02)

| Option | Description | Selected |
|--------|-------------|----------|
| AES-256-GCM via Node.js crypto | Built-in Node crypto; key in env var KEY_ENCRYPTION_SECRET | ✓ |
| Claude's discretion | Leave implementation to planner | |

**User's choice:** AES-256-GCM via Node.js crypto

| Option | Description | Selected |
|--------|-------------|----------|
| Order detail endpoint only | GET /api/orders/[id] — buyer owns order + paid status | ✓ |
| Separate /api/keys/reveal endpoint | Dedicated reveal route | |

**User's choice:** Order detail endpoint only (GET /api/orders/[id])

---

## Listing Limits & Stock Display

| Option | Description | Selected |
|--------|-------------|----------|
| Counter badge + disabled create button | "7/10 listings" counter; button disabled at cap with tooltip | ✓ |
| Silent API rejection only | 403 error on 11th listing; no UI indicator | |

**User's choice:** Counter badge + disabled create button

| Option | Description | Selected |
|--------|-------------|----------|
| Count + low-stock warning | Exact count when >5; "Only N left" amber when ≤5; "Out of stock" when 0 | ✓ |
| Simple in/out badge only | "In Stock" / "Out of Stock" badge only | |

**User's choice:** Count + low-stock warning

| Option | Description | Selected |
|--------|-------------|----------|
| Backend enforcement only in Phase 2 | Wallet service handles hold in Phase 4 | |
| Show hold notice on seller dashboard | Dismissible info banner on dashboard | ✓ (user-guided) |

**User's choice:** Dismissible info banner on seller dashboard ("Your first earnings are held for 7 days..."). Hides after first completed order.

---

## Claude's Discretion

- Exact Prisma field names beyond those specified
- Pagination page size (keep existing 12)
- Form validation error messages
- Loading skeletons and empty state copy
- API error shapes (follow `{ error: string }` convention)
- Whether to add platform filter to browse sidebar (yes — logical addition)

## Deferred Ideas

- Multi-image gallery — v2
- Buyer-facing seller profile page — Phase 5 or v2
- Full-text search with pg_trgm — v2
- Real-time stock countdown — v2
- Category CRUD admin UI — Phase 7
