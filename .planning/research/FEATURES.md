# Feature Landscape: Digital License & Game Account Marketplace

**Domain:** Digital goods marketplace (software licenses, game accounts, gift cards, in-game items)
**Researched:** 2026-05-02
**Confidence:** MEDIUM — Based on deep domain knowledge of G2A, Kinguin, Eneba, PlayerAuctions, and Gameflip. Web search unavailable; conclusions drawn from training-time analysis of these platforms.

---

## Table Stakes

Features users expect. Missing = product feels incomplete, users leave or do not trust the platform.

### Buyer Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Account registration + login | Order history, refunds, and dispute access require identity | Low | Email + password minimum; social login is a bonus not a requirement |
| Product search + category filters | Inventory will span many product types; discovery is core | Medium | Filter by: category (keys/accounts/cards), platform (Steam/PS/Xbox), price range, seller rating |
| Product listing page with seller info | Buyer needs to evaluate seller trust before buying | Low | Rating, # of sales, response time, last active |
| Clear delivery type indicator | Buyer must know if delivery is instant or manual before checkout | Low | "Instant" vs "Manual (up to Xh)" label on every listing |
| Purchase flow (wallet or direct payment) | Single-click from product → payment → delivery | Medium | Wallet balance, Iraqi gateway, international gateway |
| Instant key/code reveal on-screen | Core promise — buyer paid, they want the key now | Low | Display in clear box, copy button, also emailed |
| Manual delivery inbox / order status | For game accounts: buyer needs to see when seller delivers | Medium | Status: "Awaiting delivery", "Delivered – confirm?", "Confirmed" |
| Order history | Buyers return; they need past keys and receipts | Low | List of orders with status, product, date, key (if instant) |
| Refund / dispute request | Trust anchor — must exist or buyers won't spend real money | Medium | Buyer opens dispute; admin mediates; clear SLA |
| Seller review after confirmed delivery | Social proof mechanism; drives trust on the platform | Low | 1–5 stars + text; visible on seller profile and listing |
| Email notifications | Confirmation, delivery, dispute updates | Low | Transactional only; use Resend |
| RTL / Arabic UI | Primary audience is Arabic-speaking | Medium | Full RTL layout, not just translated text |

### Seller Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Self-service seller registration | No admin gate for v1 (per PROJECT.md) | Low | Registration form; auto-approve; admin can suspend |
| Seller profile page | Buyers evaluate sellers; profile is the trust page | Low | Name, rating, # sales, response time, member since |
| Product listing creation | Core seller action | Medium | Title, description, category, platform, delivery type, price, stock |
| Bulk key upload | Sellers with 100+ keys can't enter one by one | Medium | CSV paste or text area; validate for duplicates |
| Stock management / inventory | Seller needs to know what's available and what sold | Low | Per-listing count; alert when low |
| Order management dashboard | Seller sees incoming orders, delivers manual items | Medium | List with status; action buttons for manual delivery |
| Manual delivery UI | For game accounts — seller pastes credentials to buyer | Medium | Text field sent to buyer's order page; not public |
| Earnings dashboard | Seller tracks what they've earned minus platform fee | Medium | Gross, platform cut, net, payout-able balance |
| Payout request | Seller withdraws earnings to their payment method | High | Iraqi bank/wallet transfer; admin-approved initially |
| Notifications for new orders | Seller must respond quickly for manual delivery SLA | Low | Email + in-app notification |

### Platform-Level Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Wallet / balance system | Buyers top up; sellers hold earnings; enables instant purchases | High | Top-up via payment gateway; spend on purchases; seller balance accumulates |
| Platform fee (commission) | Revenue model; must be applied transparently | Low | Config: e.g. 5–10% of sale price deducted from seller earnings |
| Admin moderation tools | Listings and users need oversight | Medium | Suspend user, remove listing, resolve dispute |
| Dispute resolution flow | Buyer disputes → admin decides → refund or close | Medium | Structured flow; time-boxed; not just email chains |
| Category taxonomy | Products span many types; needs clear structure | Low | Software, Games (accounts/keys), Gift Cards, In-Game Items |
| Security: no key visible until payment confirmed | Prevent fraud / key theft without payment | Low | Server-side gating; key only revealed after order.status = paid |

---

## Differentiators

Features that set the platform apart from generic gray-market stores. Not expected by default, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Seller response time badge | Buyers pick faster sellers; incentivizes good seller behavior | Low | Calculate avg time from order to delivery; display as "Responds in ~2h" |
| Verified seller badge | Admin-vetted sellers get a trust mark; commands premium pricing | Low | Manual admin toggle; displayed prominently on profile and listing |
| In-platform chat (buyer ↔ seller) | Reduces off-platform negotiation risk; keeps comms in system | High | Real-time or async messaging tied to an order or pre-purchase |
| "Buy from multiple sellers" comparison | Show all sellers listing the same product; buyer picks by price/rating | Medium | Group listings by product SKU; show seller offers underneath |
| Automatic key validation (Steam/etc.) | Validate key format or even activate-test before exposing | Very High | Requires per-platform API integration — defer to v2+ |
| Buyer protection program label | "Protected purchase" badge if platform guarantees refund | Low | Policy decision; marketing copy; no extra engineering |
| Seller analytics (views, conversion) | Helps sellers optimize listings; creates platform stickiness | Medium | Page views per listing, conversion rate, revenue over time |
| Featured listings / promoted slots | Revenue: sellers pay to appear at top | Medium | Simple flag in DB; admin-controlled or self-serve paid boost |
| Mobile-optimized UI | Significant buyer traffic is mobile in MENA region | Medium | Responsive design is baseline; PWA is a differentiator |
| Arabic-first UX (not just translated) | Most platforms translate poorly to Arabic; being genuinely Arabic-first is a real differentiator in this market | Medium | RTL layout, Arabic product names, Arabic seller/buyer comms |

---

## Anti-Features

Things to deliberately NOT build in v1. Each costs engineering time and adds surface area for bugs.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Escrow / payment hold per-transaction | Complex financial compliance, payout logic, dispute timing windows — G2A took years to implement well | Simple: platform holds seller earnings as wallet balance; admin releases on payout request |
| Cryptocurrency payments | Compliance complexity (FATF rules), wallet management, volatility — out of scope per PROJECT.md | Iraqi gateway + international card gateway is sufficient for v1 |
| Automatic seller approval gating | Slows onboarding; small market doesn't need it yet | Auto-approve; admin can suspend bad actors retroactively |
| Chargeback automation | Complex; requires payment gateway webhooks for disputes initiated outside platform | Log it, handle manually for v1 |
| Reputation gamification (levels, badges beyond rating) | Nice to have; heavy UX surface area | Simple star rating + review count is enough |
| Subscription seller tiers (bronze/silver/gold) | Out of scope per PROJECT.md; adds billing complexity | Flat commission model for v1 |
| Physical goods support | Completely different logistics, shipping, customs | Hard category lock: digital goods only |
| Advanced fraud scoring / ML | Overkill for v1 volume | Manual admin review; rate limiting; email verification |
| API for third-party seller integrations | No sellers at launch need this | Not needed until scale demands it |
| Turkish / Kurdish UI | Explicitly out of scope per PROJECT.md | AR + EN only |

---

## Feature Dependencies

```
Seller registration
  → Seller profile page
  → Product listing creation
    → Bulk key upload (instant delivery variant)
    → Manual delivery flow (account delivery variant)
    → Stock tracking

Buyer registration
  → Wallet top-up
    → Purchase flow
      → Instant key delivery  [no seller action needed]
      → Manual delivery flow  [seller action required]
        → In-platform chat (optional, enhances this)
        → Buyer confirms receipt
          → Seller earnings credited
            → Payout request

Completed order
  → Review (buyer rates seller)
  → Dispute (if buyer unhappy)
    → Admin dispute tool
      → Refund (wallet credit) or close
```

---

## Delivery Mode Detail

This is the most complex differentiating dimension of this marketplace vs a simple key store.

### Instant Delivery (keys, codes, gift cards)
1. Buyer pays → order `paid`
2. System atomically assigns unused key from pool
3. Key shown on-screen in order page + emailed
4. Order auto-completes after X hours (no confirmation needed)
5. Seller earnings credited immediately (or after hold period)

### Manual Delivery (game accounts, items requiring handoff)
1. Buyer pays → order `awaiting_delivery`
2. Seller gets notified (email + in-app)
3. Seller has a time window (e.g., 12–24h) to deliver via platform
4. Seller submits credentials/info through order page (encrypted at rest)
5. Buyer sees delivery → confirms receipt → order `complete`
6. If seller misses window → auto-escalate to dispute or auto-refund
7. Seller earnings credited on buyer confirmation

**Platform SLA enforcement for manual delivery is critical.** If sellers ghost, buyers lose trust in the whole platform. Must have: escalation timer, auto-refund or auto-dispute after deadline.

---

## MVP Recommendation

**Phase priority order based on dependency chain and trust-building:**

### Must ship in Phase 1 (core marketplace loop)
1. Buyer + seller account registration and login
2. Seller: create listing (instant delivery, key pool)
3. Buyer: browse, search, purchase (wallet or direct payment)
4. Instant key delivery on-screen + email
5. Order history (buyer and seller)
6. Platform commission deduction from seller earnings
7. Admin: user management, listing moderation, order oversight

### Must ship in Phase 2 (manual delivery + trust)
8. Manual delivery flow (game accounts)
9. Buyer confirms receipt
10. Review system (buyer rates seller after order completes)
11. Dispute / refund flow (buyer opens → admin resolves)
12. Seller payout request (admin-approved)
13. In-platform notifications (email + in-app badge)

### Phase 3 (engagement + growth)
14. In-platform chat (buyer ↔ seller, scoped to order)
15. Seller analytics dashboard
16. Verified seller badge (admin-controlled)
17. Featured listings
18. Seller response-time badge

### Defer to v2+
- Automatic key validation
- Escrow per transaction
- Subscription seller tiers
- Crypto payments
- API integrations

---

## Competitive Baseline (G2A / Kinguin / Eneba / PlayerAuctions)

| Platform | Strengths | Weaknesses | Lessons for This Project |
|----------|-----------|------------|--------------------------|
| G2A | Massive catalog, buyer protection program, mature dispute flow | Gray market reputation, complex UI, poor Arabic support | Dispute flow and buyer protection framing matter enormously for trust |
| Kinguin | Cleaner UI, faster checkout, good seller tools | Less Arabic presence, no Iraqi payment | Simple seller onboarding is a differentiator |
| Eneba | Good UX, direct platform sales + marketplace hybrid | No MENA focus | Hybrid model (platform sells too) can help supply at launch |
| PlayerAuctions | Strong for game accounts (manual delivery) | Complex, US-focused, old UI | Manual delivery SLA enforcement is the hard part they solve well |

**Key insight:** None of these platforms serve Iraqi/Arabic buyers well. The combination of Arabic-first UX + Iraqi payment gateway is a real market gap. Trust signals (reviews, verified sellers, dispute resolution) matter more than feature breadth in a market that has been burned by gray-market platforms.

---

## Sources

- Training-time analysis of G2A, Kinguin, Eneba, PlayerAuctions, Gameflip (as of knowledge cutoff August 2025)
- PROJECT.md requirements and decisions
- Confidence: MEDIUM — core marketplace patterns are stable; specific platform policy details may have changed
