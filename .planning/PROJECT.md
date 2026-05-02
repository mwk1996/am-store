# Project: Digital Marketplace for Licenses & Game Accounts

**Initialized:** 2026-05-02
**Status:** Active

---

## What This Is

An open digital marketplace where sellers can list and sell software license keys, game accounts, in-game items/credits, and gift cards. Buyers register and purchase products with instant or manual delivery depending on product type. The platform serves an Arabic/English-speaking audience with Iraqi and international payment support.

## Core Value

A trusted, fast marketplace where buyers get their digital goods reliably and sellers can reach customers — with transparent listings, secure payment, and a simple refund path when things go wrong.

## Who It's For

- **Buyers:** Anyone wanting to buy digital products cheaply and quickly — game accounts, license keys, gift cards, in-game currency
- **Sellers:** Individuals or small shops listing digital inventory — can register and start selling without admin approval gate

## Key Capabilities

### Seller Side
- Seller registration and profile
- Product listing creation (license keys, game accounts, items, gift cards)
- Inventory management (bulk key upload, stock tracking)
- Order management (manual delivery for accounts)
- Earnings and payout tracking

### Buyer Side
- Account registration (no guest checkout)
- Product browsing and search
- Purchase flow with instant or manual delivery
- Order history and status tracking
- Refund requests

### Delivery
- **Instant:** Keys/codes revealed on-screen + emailed immediately after payment
- **Manual:** Seller has a delivery window to send account credentials; buyer confirms receipt

### Payments
- Iraqi payment gateway (ZainCash / FIB or equivalent)
- International gateways (Stripe, PayPal, or crypto)
- Wallet: users top up balance, spend on purchases

### Trust & Safety
- Buyer/seller reviews after completed orders
- Simple refund system (buyer requests → admin resolves)
- Admin moderation of listings and users

### Admin Panel
- Dashboard (stats, revenue, orders)
- User management (buyers, sellers)
- Product and listing moderation
- Order oversight and refund processing
- Dispute/refund management

## Languages

- **Arabic** (primary, RTL)
- **English** (secondary)

## Tech Stack (Existing)

- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- PostgreSQL + Prisma ORM
- NextAuth.js (credentials)
- next-intl (i18n)
- Iraqi payment gateway (custom)
- Resend / Nodemailer (email)

## Requirements

### Validated (Existing Code)

- ✓ Admin panel with products, orders, licenses management
- ✓ Guest checkout flow (to be replaced with required accounts)
- ✓ Iraqi payment gateway integration
- ✓ License key pool + instant delivery on payment
- ✓ i18n routing with en/ar/tr/ku locale support

### Active

- [ ] Seller registration and onboarding
- [ ] Buyer account registration (replace guest checkout)
- [ ] Open marketplace with multi-seller product listings
- [ ] Manual delivery flow for game accounts
- [ ] Wallet / balance system
- [ ] International payment gateways
- [ ] Reviews and ratings
- [ ] Simple refund system
- [ ] Chat between buyer and seller
- [ ] Dispute resolution (admin-mediated)
- [ ] Arabic + English localization (trim to 2 languages)

### Out of Scope (v1)

- Turkish and Kurdish localization — focus on AR + EN first
- Cryptocurrency payments — complex compliance, defer to v2
- Mobile app — web-first
- Seller subscription tiers — flat model for v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Required accounts for buyers | Needed for order history, refunds, trust | Pending |
| Instant + manual delivery modes | Different product types need different flows | Pending |
| Iraqi + international payments | Serves local and diaspora buyers | Pending |
| Refund-only (no escrow) | Simpler than full escrow for v1 | Pending |
| AR + EN only | Reduce i18n surface area for v1 | Pending |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-02 after initialization*
