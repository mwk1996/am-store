# ROADMAP — Digital License & Game Account Marketplace

**Created:** 2026-05-02
**Milestone:** v1 — Open Multi-Seller Marketplace
**Granularity:** Standard (7 phases)
**Total v1 Requirements:** 47

---

## Phases

- [ ] **Phase 1: Auth & User Accounts** — Buyers and sellers can register, verify, and log in
- [ ] **Phase 2: Marketplace Browsing & Listings** — Sellers can list products; buyers can browse, search, and view details
- [ ] **Phase 3: Purchase & Delivery** — Buyers can purchase products with instant or manual delivery end-to-end
- [ ] **Phase 4: Wallet & Payments** — Users can top up, spend, earn, and withdraw via wallet
- [ ] **Phase 5: Trust Layer** — Buyers can review sellers, request refunds, and report bad actors
- [ ] **Phase 6: Chat & Notifications** — Buyers and sellers can message within orders and receive in-app alerts
- [ ] **Phase 7: Admin Panel** — Admins can oversee the platform, manage users, and resolve disputes

---

## Phase Details

### Phase 1: Auth & User Accounts
**Goal**: Any visitor can register as a buyer or seller, verify their email, and securely access their account
**Depends on**: Nothing — this is the foundation
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, SEC-01, SEC-07
**Success Criteria** (what must be TRUE):
  1. A visitor can register as a buyer with email and password and receive a verification email
  2. A visitor can register as a seller and have a seller profile created alongside their account
  3. An unverified user cannot access account features until they click the confirmation link
  4. A registered user can log in and remain authenticated across page navigations
  5. A user who forgot their password can receive a reset link by email and set a new password
**Plans**: 5 plans
Plans:
- [ ] 01-01-PLAN.md — Schema extension + auth service methods + middleware helpers (Wave 1)
- [ ] 01-02-PLAN.md — New auth API routes + rate limiting + register shopName (Wave 2)
- [ ] 01-03-PLAN.md — SEC-07: harden all admin API routes with requireAdminSession (Wave 2)
- [ ] 01-04-PLAN.md — [BLOCKING] Prisma db push + generate (Wave 3)
- [ ] 01-05-PLAN.md — UI pages: login fix, register shopName, verify-email, forgot/reset password (Wave 3)
**UI hint**: yes

---

### Phase 2: Marketplace Browsing & Listings
**Goal**: Sellers can publish products and buyers can discover them through browsing, filtering, and search
**Depends on**: Phase 1
**Requirements**: LISTING-01, LISTING-02, LISTING-03, LISTING-04, LISTING-05, LISTING-06, LISTING-07, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06
**Success Criteria** (what must be TRUE):
  1. An authenticated seller can create a product listing with title, description, price, category, platform, and delivery type
  2. A seller can upload license keys in bulk via CSV and see a stock count on their listing
  3. A buyer can browse the marketplace and filter by category, platform, price range, and delivery type
  4. A buyer can search products by keyword and see relevant results
  5. A buyer can open a product detail page and see seller info, stock count, delivery type, and any existing reviews
**Plans**: TBD
**UI hint**: yes

---

### Phase 3: Purchase & Delivery
**Goal**: A buyer can complete a purchase and receive their product — instantly for keys, or via a tracked manual delivery for game accounts
**Depends on**: Phase 1, Phase 2, Phase 4 (wallet balance required for ORDER-01)
**Requirements**: ORDER-01, ORDER-02, ORDER-03, ORDER-04, DELIVERY-01, DELIVERY-02, DELIVERY-03, DELIVERY-04, DELIVERY-05, DELIVERY-06
**Success Criteria** (what must be TRUE):
  1. A buyer can purchase a key product and see the key revealed on-screen immediately after payment, with a copy also sent by email
  2. A buyer can purchase a game account product and track the delivery status while the seller posts credentials
  3. A seller receives the order and can post game account credentials through the order delivery interface
  4. A buyer can confirm manual delivery receipt, releasing earnings to the seller
  5. If a buyer does not confirm within 24 hours, the order auto-confirms and the seller's balance is released
  6. A buyer can view their full order history and re-access previously purchased keys
**Plans**: TBD
**UI hint**: yes

---

### Phase 4: Wallet & Payments
**Goal**: Users can top up a wallet balance, spend it on purchases, and sellers can withdraw their earnings
**Depends on**: Phase 1
**Requirements**: WALLET-01, WALLET-02, WALLET-03, WALLET-04, WALLET-05, SEC-09, SEC-10
**Success Criteria** (what must be TRUE):
  1. A buyer can top up their wallet via the Iraqi payment gateway (and international gateway where available)
  2. A buyer can view a full transaction history showing deposits, purchases, and refunds with amounts and timestamps
  3. A seller can view their earnings dashboard showing pending escrow, available balance, and total earned
  4. A seller can submit a withdrawal request for their available balance
  5. Admin can approve or reject withdrawal requests from the admin panel
**Plans**: TBD
**UI hint**: yes

---

### Phase 5: Trust Layer
**Goal**: Buyers can hold sellers accountable through reviews and refund requests, and admins can verify reputable sellers
**Depends on**: Phase 3 (reviews and refunds require completed orders)
**Requirements**: TRUST-01, TRUST-02, TRUST-03, TRUST-04, TRUST-05, SEC-08
**Success Criteria** (what must be TRUE):
  1. A buyer can leave a star rating and written review on a completed order, visible on the seller's listing
  2. A buyer can submit a refund request with a reason, and track its status
  3. Admin can see all open refund requests and approve or reject them — an approved refund returns funds to the buyer's wallet
  4. Admin can mark a seller as Verified, causing a badge to appear on their profile and all their listings
  5. Any user can report a listing or user to admin for review
**Plans**: TBD
**UI hint**: yes

---

### Phase 6: Chat & Notifications
**Goal**: Buyers and sellers can communicate within orders and receive timely in-app and email alerts for key events
**Depends on**: Phase 1, Phase 3
**Requirements**: CHAT-01, CHAT-02, CHAT-03, CHAT-04
**Success Criteria** (what must be TRUE):
  1. A buyer and seller can exchange messages scoped to a specific order through the order detail page
  2. A user receives an email notification when a new message arrives in one of their order chats
  3. A user sees a notification bell in the navigation bar with an unread count covering messages, order updates, and status changes
  4. A user can click to mark notifications as read and the unread count clears
**Plans**: TBD
**UI hint**: yes

---

### Phase 7: Admin Panel
**Goal**: Admins have a central dashboard to monitor platform health, manage users, and resolve disputes
**Depends on**: Phase 1, Phase 5 (refund/dispute data)
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03
**Success Criteria** (what must be TRUE):
  1. Admin can view a live dashboard showing total revenue, active orders, registered users, and open refunds
  2. Admin can search, filter, view, suspend, or ban any buyer or seller account
  3. Admin can view open refund requests, approve or reject them, and see the resulting wallet adjustment
**Plans**: TBD
**UI hint**: yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth & User Accounts | 0/5 | Not started | - |
| 2. Marketplace Browsing & Listings | 0/? | Not started | - |
| 3. Purchase & Delivery | 0/? | Not started | - |
| 4. Wallet & Payments | 0/? | Not started | - |
| 5. Trust Layer | 0/? | Not started | - |
| 6. Chat & Notifications | 0/? | Not started | - |
| 7. Admin Panel | 0/? | Not started | - |

---

## Coverage

**Total v1 requirements:** 47
**Mapped:** 47/47
**Orphaned:** 0

| Requirement | Phase |
|-------------|-------|
| AUTH-01 | 1 |
| AUTH-02 | 1 |
| AUTH-03 | 1 |
| AUTH-04 | 1 |
| AUTH-05 | 1 |
| AUTH-06 | 1 |
| SEC-01 | 1 |
| SEC-07 | 1 |
| LISTING-01 | 2 |
| LISTING-02 | 2 |
| LISTING-03 | 2 |
| LISTING-04 | 2 |
| LISTING-05 | 2 |
| LISTING-06 | 2 |
| LISTING-07 | 2 |
| SEC-02 | 2 |
| SEC-03 | 2 |
| SEC-04 | 2 |
| SEC-05 | 2 |
| SEC-06 | 2 |
| ORDER-01 | 3 |
| ORDER-02 | 3 |
| ORDER-03 | 3 |
| ORDER-04 | 3 |
| DELIVERY-01 | 3 |
| DELIVERY-02 | 3 |
| DELIVERY-03 | 3 |
| DELIVERY-04 | 3 |
| DELIVERY-05 | 3 |
| DELIVERY-06 | 3 |
| WALLET-01 | 4 |
| WALLET-02 | 4 |
| WALLET-03 | 4 |
| WALLET-04 | 4 |
| WALLET-05 | 4 |
| SEC-09 | 4 |
| SEC-10 | 4 |
| TRUST-01 | 5 |
| TRUST-02 | 5 |
| TRUST-03 | 5 |
| TRUST-04 | 5 |
| TRUST-05 | 5 |
| SEC-08 | 5 |
| CHAT-01 | 6 |
| CHAT-02 | 6 |
| CHAT-03 | 6 |
| CHAT-04 | 6 |
| ADMIN-01 | 7 |
| ADMIN-02 | 7 |
| ADMIN-03 | 7 |

---

## Brownfield Notes

This is an evolution of an existing codebase — not a greenfield build. The Prisma schema is comprehensive and largely correct. The service layer (wallet, escrow, key assignment) exists. Plans should wire and complete what exists before rewriting.

**Two critical fixes must land in Phase 3/4 before any transaction ships:**
1. Key assignment must use `SELECT FOR UPDATE SKIP LOCKED` to prevent duplicate delivery
2. Wallet deduction must be a single atomic `UPDATE ... WHERE balance >= amount` to prevent negative balance

**AdminUser model** in schema is a legacy artifact — Phase 1 plans should migrate admin auth to use `User` with `role: ADMIN` via NextAuth.

---
*Last updated: 2026-05-02*
