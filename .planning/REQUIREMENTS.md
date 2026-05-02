# Requirements — Digital License & Game Account Marketplace

**Version:** v1
**Defined:** 2026-05-02
**Status:** Active

---

## v1 Requirements

### AUTH — Authentication & Accounts

- [ ] **AUTH-01**: User can register as a buyer with email + password
- [ ] **AUTH-02**: User can register as a seller with email + password and seller profile
- [ ] **AUTH-03**: User receives email verification link on signup and must confirm before accessing account
- [ ] **AUTH-04**: User can log in with email + password and receive a JWT session
- [ ] **AUTH-05**: User can request a password reset link via email
- [ ] **AUTH-06**: User can reset password using the emailed link

### LISTING — Marketplace Listings

- [ ] **LISTING-01**: Seller can create a product listing with title, description, price, category, platform, and delivery type (instant / manual)
- [ ] **LISTING-02**: Seller can upload license keys in bulk via CSV paste or file upload
- [ ] **LISTING-03**: Product listing shows current stock count to buyers
- [ ] **LISTING-04**: Admin can mark a listing as featured, causing it to appear at the top of search results
- [ ] **LISTING-05**: Buyer can browse all listings with filters: category, platform, price range, delivery type
- [ ] **LISTING-06**: Buyer can view a product detail page with seller info, reviews, and delivery type indicator
- [ ] **LISTING-07**: Buyer can search products by keyword

### ORDER — Purchase Flow

- [ ] **ORDER-01**: Buyer can purchase a product using their wallet balance
- [ ] **ORDER-02**: Buyer can purchase a product via direct payment (card / gateway) without pre-loading wallet
- [ ] **ORDER-03**: Buyer can view their full order history with status
- [ ] **ORDER-04**: Buyer can re-view or re-download a purchased key from order history

### DELIVERY — Delivery & Fulfillment

- [ ] **DELIVERY-01**: Buyer receives an instant key reveal on-screen immediately after payment for instant-delivery products
- [ ] **DELIVERY-02**: Buyer receives the purchased key via email after payment
- [ ] **DELIVERY-03**: For manual-delivery products (game accounts), seller can post account credentials via the order delivery interface
- [ ] **DELIVERY-04**: Buyer can confirm receipt of a manual delivery, releasing escrow to seller
- [ ] **DELIVERY-05**: If buyer does not confirm within 24 hours of delivery, order auto-confirms and escrow is released
- [ ] **DELIVERY-06**: Each delivery event is logged with timestamp, IP, and user agent as chargeback evidence

### WALLET — Wallet & Payments

- [ ] **WALLET-01**: Buyer can top up their wallet via payment gateway (Iraqi or international)
- [ ] **WALLET-02**: Buyer can view their wallet transaction history (deposits, purchases, refunds)
- [ ] **WALLET-03**: Seller can view their earnings dashboard (pending escrow, available balance, total earned)
- [ ] **WALLET-04**: Seller can request a payout/withdrawal of their available balance
- [ ] **WALLET-05**: Admin can approve or reject seller withdrawal requests

### TRUST — Trust & Safety

- [ ] **TRUST-01**: Buyer can leave a star rating and text review on an order after it reaches COMPLETED status
- [ ] **TRUST-02**: Buyer can submit a refund request on an order, specifying a reason
- [ ] **TRUST-03**: Admin can view, approve, or reject refund requests
- [ ] **TRUST-04**: Admin can mark a seller as "Verified", displaying a badge on their profile and listings
- [ ] **TRUST-05**: Buyer or seller can report a listing or user to admin for review

### CHAT — Communication

- [ ] **CHAT-01**: Buyer and seller can exchange messages within an order (per-order chat, not global DM)
- [ ] **CHAT-02**: User receives an email notification when a new message arrives in their order chat
- [ ] **CHAT-03**: User sees an in-app notification bell with unread count for orders, messages, and status changes
- [ ] **CHAT-04**: User can mark notifications as read

### SECURITY — Security & Fraud Prevention

- [ ] **SEC-01**: Auth endpoints are rate-limited (login: 5 attempts/15min, register: 3/hr, order creation: 10/hr)
- [ ] **SEC-02**: License keys are encrypted at rest in the database and decrypted only for the verified paying buyer
- [ ] **SEC-03**: Keys are only accessible via the authenticated buyer's order detail endpoint — never in list responses
- [ ] **SEC-04**: New sellers have a 7-day earnings hold before their first withdrawal is allowed
- [ ] **SEC-05**: New sellers are capped at 10 active listings until their first completed sale
- [ ] **SEC-06**: Seller's first withdrawal request always requires admin review regardless of hold period
- [ ] **SEC-07**: All admin API routes validate admin session server-side per route (not middleware-only)
- [ ] **SEC-08**: Platform logs sensitive actions to an audit log: logins, key reveals, withdrawals, refunds, suspensions
- [ ] **SEC-09**: Wallet top-up payments have a 1-hour hold before balance is spendable (24h for new accounts)
- [ ] **SEC-10**: Self-dealing detection flags orders where buyer and seller share the same IP or device fingerprint

### ADMIN — Admin Panel

- [ ] **ADMIN-01**: Admin can view a dashboard with platform stats: total revenue, active orders, registered users, open refunds
- [ ] **ADMIN-02**: Admin can view, search, filter, and suspend or ban any buyer or seller account
- [ ] **ADMIN-03**: Admin can view open refund requests and mark them approved (triggers refund) or rejected

---

## v2 Requirements (Deferred)

- Real-time Pusher chat (v1 uses polling/email)
- Seller listing moderation queue in admin panel
- Admin withdrawal approval (v1 sellers can request; admin processes manually outside platform)
- Cryptocurrency payment support
- Turkish and Kurdish localization
- Mobile app
- Seller subscription / commission tiers
- Affiliate / referral program
- Seller analytics (views, conversion rate)
- Buyer wishlist / saved listings

---

## Out of Scope

- Guest checkout — replaced by required accounts (buyer protection, refund traceability)
- Turkish/Kurdish localization — focus on AR + EN for v1 to reduce i18n surface area
- Cryptocurrency payments — compliance complexity, defer
- Mobile native app — web-first, responsive design covers mobile in v1
- Escrow withholding from buyer — wallet-hold model is simpler and sufficient for v1

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 — Auth & User Accounts | Pending |
| AUTH-02 | Phase 1 — Auth & User Accounts | Pending |
| AUTH-03 | Phase 1 — Auth & User Accounts | Pending |
| AUTH-04 | Phase 1 — Auth & User Accounts | Pending |
| AUTH-05 | Phase 1 — Auth & User Accounts | Pending |
| AUTH-06 | Phase 1 — Auth & User Accounts | Pending |
| SEC-01 | Phase 1 — Auth & User Accounts | Pending |
| SEC-07 | Phase 1 — Auth & User Accounts | Pending |
| LISTING-01 | Phase 2 — Marketplace Browsing & Listings | Pending |
| LISTING-02 | Phase 2 — Marketplace Browsing & Listings | Pending |
| LISTING-03 | Phase 2 — Marketplace Browsing & Listings | Pending |
| LISTING-04 | Phase 2 — Marketplace Browsing & Listings | Pending |
| LISTING-05 | Phase 2 — Marketplace Browsing & Listings | Pending |
| LISTING-06 | Phase 2 — Marketplace Browsing & Listings | Pending |
| LISTING-07 | Phase 2 — Marketplace Browsing & Listings | Pending |
| SEC-02 | Phase 2 — Marketplace Browsing & Listings | Pending |
| SEC-03 | Phase 2 — Marketplace Browsing & Listings | Pending |
| SEC-04 | Phase 2 — Marketplace Browsing & Listings | Pending |
| SEC-05 | Phase 2 — Marketplace Browsing & Listings | Pending |
| SEC-06 | Phase 2 — Marketplace Browsing & Listings | Pending |
| ORDER-01 | Phase 3 — Purchase & Delivery | Pending |
| ORDER-02 | Phase 3 — Purchase & Delivery | Pending |
| ORDER-03 | Phase 3 — Purchase & Delivery | Pending |
| ORDER-04 | Phase 3 — Purchase & Delivery | Pending |
| DELIVERY-01 | Phase 3 — Purchase & Delivery | Pending |
| DELIVERY-02 | Phase 3 — Purchase & Delivery | Pending |
| DELIVERY-03 | Phase 3 — Purchase & Delivery | Pending |
| DELIVERY-04 | Phase 3 — Purchase & Delivery | Pending |
| DELIVERY-05 | Phase 3 — Purchase & Delivery | Pending |
| DELIVERY-06 | Phase 3 — Purchase & Delivery | Pending |
| WALLET-01 | Phase 4 — Wallet & Payments | Pending |
| WALLET-02 | Phase 4 — Wallet & Payments | Pending |
| WALLET-03 | Phase 4 — Wallet & Payments | Pending |
| WALLET-04 | Phase 4 — Wallet & Payments | Pending |
| WALLET-05 | Phase 4 — Wallet & Payments | Pending |
| SEC-09 | Phase 4 — Wallet & Payments | Pending |
| SEC-10 | Phase 4 — Wallet & Payments | Pending |
| TRUST-01 | Phase 5 — Trust Layer | Pending |
| TRUST-02 | Phase 5 — Trust Layer | Pending |
| TRUST-03 | Phase 5 — Trust Layer | Pending |
| TRUST-04 | Phase 5 — Trust Layer | Pending |
| TRUST-05 | Phase 5 — Trust Layer | Pending |
| SEC-08 | Phase 5 — Trust Layer | Pending |
| CHAT-01 | Phase 6 — Chat & Notifications | Pending |
| CHAT-02 | Phase 6 — Chat & Notifications | Pending |
| CHAT-03 | Phase 6 — Chat & Notifications | Pending |
| CHAT-04 | Phase 6 — Chat & Notifications | Pending |
| ADMIN-01 | Phase 7 — Admin Panel | Pending |
| ADMIN-02 | Phase 7 — Admin Panel | Pending |
| ADMIN-03 | Phase 7 — Admin Panel | Pending |

**Coverage: 47/47 requirements mapped. 0 orphaned.**

---

*Total v1 requirements: 47*
*Total v2 deferred: 10*
