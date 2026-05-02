# Phase 2: Marketplace Browsing & Listings — UI-SPEC

**Generated:** 2026-05-03
**Phase:** 2 — Marketplace Browsing & Listings
**Method:** ui-ux-pro-max design system analysis

---

## Design System (Locked)

### Style
**Glassmorphism Dark** — consistent with existing codebase (`bg-card/60 backdrop-blur-sm border-white/8`). Do NOT introduce a new style. Every new component must match this language.

### Color Tokens (use CSS vars — do not hardcode hex)
| Token | Usage |
|-------|-------|
| `bg-background` | Page background (dark base ~#0F0F23) |
| `bg-card/60` | Card surfaces with `backdrop-blur-sm` |
| `border-white/8` | Default card/container borders |
| `border-primary/40` | Hover border accent |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary/label text |
| `bg-accent` | CTA buttons (primary action) |
| `text-accent-foreground` | Text on accent buttons |
| `bg-primary/10` | Subtle tint backgrounds |
| `border-primary/30` | Tinted borders |

### Status Colors (established in dashboard — carry forward)
| Status | Classes |
|--------|---------|
| Pending/Warning | `text-amber-400 bg-amber-500/10` |
| Active/Paid | `text-blue-400 bg-blue-500/10` |
| Success/Complete | `text-emerald-400 bg-emerald-500/10` |
| Error/Danger | `text-red-400 bg-red-500/10` |
| Low stock warning | `text-amber-400 bg-amber-500/10` |
| Out of stock | `text-red-400 bg-red-500/10` |
| In stock | `text-emerald-400 bg-emerald-500/10` |

### Typography
- Headings: `font-bold` or `font-semibold`, `tracking-tight`
- Body: `text-sm text-muted-foreground leading-relaxed`
- Price: `text-3xl font-black text-foreground leading-none` (existing pattern in ProductCard)
- Labels: `text-xs font-medium text-muted-foreground uppercase tracking-wider`

### Border Radius
- Cards: `rounded-2xl` (existing)
- Buttons: `rounded-xl` (existing)
- Badges: `rounded-full` (existing)
- Inputs: `rounded-xl`

### Transitions
- Default: `transition-all duration-300`
- Colors only: `transition-colors duration-200`
- Card hover: `-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10`

---

## Component Specifications

### 1. Marketplace Browse Page (`/[locale]/marketplace`)

**Layout:** Sticky filter sidebar (left, `w-64`) + product grid (right, fills remaining width)

**Sidebar — ProductFilters (extend existing `components/marketplace/ProductFilters.tsx`):**
- Existing filters: Search, Category, Type (GAME_ACCOUNT / SOFTWARE_KEY), Price Range
- **Add:** Platform filter (PC, PlayStation, Xbox, Nintendo Switch, Mobile, Multiple Platforms, Other)
- Filter pills: `rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px]` — active state uses `border-primary/40 bg-primary/10 text-primary`
- "Clear all" button only appears when filters are active (existing behavior — keep)
- Sidebar container: `bg-card/60 backdrop-blur-sm border border-white/8 rounded-2xl p-4`

**Product Grid:**
- Desktop: `grid grid-cols-3 gap-6`
- Tablet: `grid-cols-2`
- Mobile: `grid-cols-1`
- Featured listings row at top (before paginated results): `grid-cols-3` with `border-primary/30` ring and `Featured` badge `bg-accent text-accent-foreground rounded-full text-[10px] px-2 py-0.5`

**Pagination:** Keep existing pattern (numbered pages with prev/next links)

**Empty state:** `flex flex-col items-center justify-center py-24 text-center` — icon + "No products found" + "Try adjusting your filters" in muted text

---

### 2. Product Card (`components/marketplace/ProductCard.tsx`)

**Keep existing structure and hover behavior.** Update for multilingual JSON + stock display:

**Stock badge (top-left corner of image):**
```
>5 keys:   "12 in stock"  → text-emerald-400 bg-black/40
≤5 keys:   "Only 3 left"  → text-amber-400 bg-black/40  (urgency)
0 keys:    "Out of stock" → text-red-400 bg-black/40
```

**Delivery type badge (top-right, existing slot):**
- `INSTANT`: Key icon + "Instant" → keep existing style
- `MANUAL`: Package icon + "Manual Delivery" → same pill style

**Seller info (below description):**
```
[Avatar 20px rounded-full] [Seller name text-xs text-muted-foreground]
```

**Featured ring:** When `isFeatured=true`, add `ring-1 ring-primary/40` around card + "Featured" badge top-left (above stock badge).

**Disabled state (out of stock):** Card opacity `opacity-60`, buy button replaced with `cursor-not-allowed bg-muted text-muted-foreground` "Out of Stock" button.

---

### 3. Product Detail Page (`/[locale]/products/[id]`)

**Layout:** Two-column on desktop (`grid grid-cols-2 gap-8`), stacked on mobile

**Left column:** Single product image (`aspect-video rounded-2xl overflow-hidden`) with placeholder gradient if no image

**Right column:**
- Category + Platform badges (pill style, `bg-primary/10 border-primary/30 text-primary text-xs rounded-full px-2.5 py-1`)
- Title `text-2xl font-bold text-foreground`
- Seller info row: avatar + name + "Verified Seller" badge (if applicable) + join date
- Stock indicator (same badge spec as product card)
- Price `text-4xl font-black` + currency label
- Delivery type indicator (icon + label)
- "Buy Now" CTA button: full-width `bg-accent rounded-xl py-3 font-bold` — disabled + "Out of Stock" text when stock=0
- Reviews section below the fold

---

### 4. Seller Listing Creation Form (`/[locale]/dashboard/listings/new`)

**Container:** `max-w-2xl mx-auto` card with `bg-card/60 backdrop-blur-sm border border-white/8 rounded-2xl p-8`

**EN/AR Tabs (shadcn `Tabs` component):**
```
[EN] [AR]  ← tab triggers
```
- Each tab contains: Title input + Description textarea
- Tab content uses same `Tabs` component already in shadcn/ui
- AR tab: add `dir="rtl"` on inputs

**Other fields (below tabs, language-agnostic):**
- Price (number input with currency label `$` prefix)
- Category (shadcn `Select`)
- Platform (shadcn `Select`)
- Delivery Type: `RadioGroup` with two options — Instant Key / Manual Delivery (with icon + description)
- Image URL (text input with preview thumbnail on blur)

**Form validation:**
- Validate on blur (not submit-only)
- Error messages inline below each field: `text-xs text-red-400 mt-1`
- Submit button shows loading spinner during async op, disabled during flight

**Listing cap warning (SEC-05):** When seller is at cap (10/10), show banner above form:
```
bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-amber-400 text-sm
"You've reached your 10-listing limit. Complete your first sale to unlock unlimited listings."
```
Create button is `disabled cursor-not-allowed opacity-50`

---

### 5. Seller Dashboard Tab (extend `/[locale]/dashboard`)

**Add "Listings" tab to existing dashboard tabs** (alongside Orders, Earnings)

**Listings tab content:**
- Header row: "My Listings" heading + listing count badge `(7/10)` + "Add Listing" button
- Listing counter badge: `text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5`
- Table layout: image thumbnail (40px) | Title (EN) | Category | Stock | Status | Price | Actions
- Status badge: ACTIVE = `text-emerald-400 bg-emerald-500/10`, INACTIVE = `text-gray-400 bg-gray-500/10`
- Actions: Edit (pencil icon) + Deactivate (toggle icon) — icon buttons `w-8 h-8 rounded-lg hover:bg-primary/10`

**7-day earnings hold banner (SEC-04):**
```
bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-6
[Info icon] "Your first earnings are held for 7 days before they're available for withdrawal."
[×] dismiss button (top-right)
```
Shown only when seller has no completed orders. Dismissible (localStorage flag).

---

### 6. Bulk Key Import UI (on listing detail / edit page)

**Section below listing info:**
- Heading: "Add License Keys" with stock count badge
- Textarea: `min-h-[120px] font-mono text-sm` for key paste
- Live counter below textarea: "23 keys detected" → `text-xs text-muted-foreground`
  - Updates on every keystroke (debounced 200ms)
  - Turns `text-amber-400` if duplicates detected: "23 keys detected, 2 duplicates removed"
- "Import Keys" button: full-width accent, disabled until ≥1 key detected
- After import: success toast "23 keys imported" + stock count updates

---

## UX Rules (from ui-ux-pro-max guidelines)

| Rule | Requirement |
|------|-------------|
| Touch targets | All buttons and icons ≥ 44×44px |
| Cursor | `cursor-pointer` on all clickable cards and buttons |
| Form validation | Validate on blur; show loading → success/error on submit |
| Labels | All inputs have `<label>` with `for` attribute (no placeholder-only inputs) |
| Loading states | Skeleton cards in product grid during data fetch; spinner on CTA buttons |
| Empty states | Grid empty state with icon + description + clear-filters CTA |
| Transitions | `150–300ms` for micro-interactions; `300ms` for card hover |
| Reduced motion | Respect `prefers-reduced-motion`: skip `-translate-y-1` on card hover |
| Responsive | Tested at 375px, 768px, 1024px, 1440px |
| RTL support | `dir="rtl"` on AR tab inputs; flex layout must not break RTL |
| No emoji icons | All icons from Lucide (already used throughout codebase) |
| Image alt text | Product images get `alt={title}` (localized) |

---

## Screens Summary

| Screen | Route | New / Update |
|--------|-------|-------------|
| Marketplace browse | `/[locale]/marketplace` | Update (schema + platform filter + featured row) |
| Product detail | `/[locale]/products/[id]` | Update (multilingual + stock badge + seller row) |
| Create listing | `/[locale]/dashboard/listings/new` | New |
| Edit listing | `/[locale]/dashboard/listings/[id]/edit` | New |
| Dashboard — Listings tab | `/[locale]/dashboard` | Extend (add Listings tab) |
| Bulk key import | Part of listing detail/edit page | New section |

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons (Lucide only)
- [ ] All clickable elements have `cursor-pointer`
- [ ] Hover states: `transition-colors duration-200` or `transition-all duration-300`
- [ ] Focus states visible (shadcn/ui provides these by default)
- [ ] Stock badges use correct color tokens
- [ ] EN/AR tabs work with `dir="rtl"` on AR content
- [ ] Form validation: blur-triggered, inline error messages
- [ ] Loading button state: spinner + disabled during async
- [ ] Listing cap banner: shown at 10/10, button disabled
- [ ] Earnings hold banner: shown to new sellers, dismissible
- [ ] Responsive grid: 3 col → 2 col → 1 col
- [ ] Empty state in product grid
- [ ] `prefers-reduced-motion` guard on card hover transform
- [ ] Featured listings appear above paginated results with ring + badge

---

*UI-SPEC generated: 2026-05-03 via ui-ux-pro-max*
*Phase: 02-marketplace-browsing-and-listings*
