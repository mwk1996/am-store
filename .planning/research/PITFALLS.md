# Domain Pitfalls: Digital Goods Marketplace

**Domain:** Multi-seller digital goods marketplace (licenses, game accounts, gift cards)
**Researched:** 2026-05-02
**Confidence:** HIGH (established patterns from G2A, Kinguin, PlayerAuctions, Gameflip post-mortems)

---

## Critical Pitfalls

These mistakes cause rewrites, legal exposure, or loss of user trust that is unrecoverable.

---

### Pitfall 1: Atomic Key Assignment Race Condition

**What goes wrong:** Two buyers complete payment at nearly the same time for the same product with one key left in stock. Both payments succeed. Without a database-level lock, both orders get assigned the same key (or one gets NULL).

**Why it happens:** Application-level stock checks ("if stock > 0, decrement") are not atomic. Between read and write, another request can slip through.

**Consequences:** Duplicate key delivery, buyer disputes, refund liability.

**Prevention:**
- Use a `SELECT ... FOR UPDATE SKIP LOCKED` query when assigning keys. With Prisma raw queries:
  ```sql
  SELECT id FROM "LicenseKey"
  WHERE "productId" = $1 AND "orderId" IS NULL
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  ```
- Wrap key assignment + order status update in a single Prisma transaction.
- Never check stock in application layer and assume it holds until DB write.

**Detection:** Two orders referencing the same `licenseKeyId` — add a unique constraint on `LicenseKey.orderId`.

**Phase:** Must be solved in Phase 1 (order + delivery core). Do not ship without this.

---

### Pitfall 2: Wallet Balance Race Condition (Double Spend)

**What goes wrong:** A user opens two browser tabs and submits purchases simultaneously. Both requests read the same balance (`balance = 100`), both see sufficient funds, both deduct. User spends 200 from a 100 balance.

**Why it happens:** Wallet deduction is read-then-write without a lock or optimistic concurrency check.

**Consequences:** Negative wallet balances, real financial loss for the platform.

**Prevention:**
- All wallet deductions must use a database transaction with a row lock:
  ```sql
  UPDATE "Wallet" SET balance = balance - $amount
  WHERE "userId" = $userId AND balance >= $amount
  RETURNING id;
  ```
  If 0 rows updated → insufficient funds. No separate SELECT needed.
- Never read balance in application code and then conditionally update — always do it as a single atomic SQL operation.
- Add a `CHECK (balance >= 0)` constraint on the wallet table as a hard backstop.

**Detection:** `balance < 0` in production is a sign this happened.

**Phase:** Wallet system phase. Architect this correctly from day one — retrofitting is painful.

---

### Pitfall 3: Fake/Invalid Key Delivery by Sellers

**What goes wrong:** A malicious seller uploads keys that are already used, invalid, or generated randomly. Buyer receives a key that doesn't work. Seller disappears.

**Why it happens:** No pre-validation of keys before they are sold. Open registration means anyone can list.

**Consequences:** Chargebacks, refund liability, reputation destruction. G2A lost significant merchant trust over exactly this pattern.

**Prevention:**
- Display seller reputation prominently — key validity rate, total sales, age of account.
- Hold seller payout for a dispute window (e.g., 3 days after delivery confirmation) rather than releasing immediately.
- Allow buyers to mark key as "invalid" within the dispute window, which freezes the seller's earnings for that order.
- Rate-limit new sellers: first N sales require 100% of earnings held for 7 days. Trust is graduated.
- For license keys specifically: if the key format is known (e.g., XXXXX-XXXXX-XXXXX-XXXXX-XXXXX), validate format on upload.

**Detection:** Spike in "invalid key" disputes from a single seller account.

**Phase:** Trust & Safety phase. Escrow-like payout holds should be in the wallet/payout architecture from the start.

---

### Pitfall 4: Game Account Takeback After Sale

**What goes wrong:** Seller sells a game account. Buyer receives credentials, confirms delivery. Seller uses account recovery ("I forgot my password" flow on the game platform) to reclaim the account. Buyer loses access days later.

**Why it happens:** The underlying platform (Steam, EA, etc.) has no way to know the account was sold. Email-based recovery lets the original owner always win.

**Consequences:** Buyers learn the platform is unsafe for account purchases. Chargebacks arrive weeks later.

**Prevention:**
- Require sellers to confirm in writing (checkbox + stored audit log) that the account has had its recovery email changed to a neutral one before delivery, or that original email access has been removed.
- Extend the dispute window for game accounts to 14–30 days (vs. 3 days for keys).
- Prominently disclose to buyers that account recovery risk exists and that they should change recovery info immediately on receipt.
- Keep seller payout on hold for the full extended dispute window.
- Flag accounts where seller has multiple takeback disputes: auto-suspend listing ability.

**Detection:** Dispute reason "lost account access" submitted more than a few days after delivery.

**Phase:** Manual delivery flow design. The delivery confirmation screen must include the change-recovery-email instruction.

---

### Pitfall 5: Chargeback / Payment Reversal After Digital Delivery

**What goes wrong:** Buyer pays, receives the key or account, uses it, then files a chargeback with their bank claiming "item not received" or "unauthorized transaction." Platform loses the payment and the key is already consumed.

**Why it happens:** Digital goods have no physical proof of delivery. Banks default to buyer-side in disputes. This is especially common with international cards and Iraqi gateway quirks.

**Consequences:** Net negative: platform loses money + gateway chargeback fee (typically $15–25 per dispute). High chargeback rates can result in gateway account termination.

**Prevention:**
- Require buyer account registration (already in PROJECT.md) — guest checkout makes fraud completely unaccountable.
- Log every delivery event: timestamp, IP address, user agent, key revealed, email sent. Store this as a delivery receipt record.
- Send delivery confirmation email immediately with a receipt that includes order ID, product, and timestamp — this is evidence.
- For wallet top-ups specifically: never allow wallet funds to be spent before the top-up payment is fully settled (not just authorized).
- Implement a simple velocity check: flag accounts that have more than 2 chargebacks or refunds in 30 days.
- Consider requiring phone verification for high-value purchases.

**Detection:** Ratio of chargebacks to completed orders. Anything above 0.5% is a serious signal.

**Phase:** Order + payment phase (delivery receipts), Trust & Safety phase (velocity checks).

---

### Pitfall 6: Wallet Top-Up Abuse (Refund Laundering)

**What goes wrong:** Attacker tops up wallet with a stolen card. Buys goods from their own seller account (self-dealing). Withdraws seller earnings. Stolen card is charged back. Platform has paid out real money.

**Why it happens:** Wallet systems decouple the payment from the purchase, making fraud harder to trace per-transaction.

**Consequences:** Direct financial loss. In markets with high card fraud (relevant for Iraqi market), this can be systematic.

**Prevention:**
- Never allow wallet balance to be withdrawn (cashed out) by buyers — only sellers receive payouts, and only from confirmed sales.
- Impose a minimum hold period between wallet top-up and first spend (e.g., 24 hours for new accounts, 1 hour after top-up).
- Flag self-dealing: if a buyer account purchases from a seller account sharing the same device fingerprint, IP, or email domain — hold for manual review.
- For seller payouts: require identity verification before first withdrawal above a threshold (e.g., >$50 equivalent).

**Detection:** Seller accounts with high sales volume but all buyers are new accounts. Matching IP addresses between buyer and seller.

**Phase:** Wallet architecture phase. Self-dealing prevention must be designed in, not bolted on.

---

### Pitfall 7: Seller Stock Inflation / Phantom Inventory

**What goes wrong:** Seller lists 500 "Netflix accounts" in stock. In reality they have 5, or the accounts are shared across multiple platforms. Orders arrive faster than inventory can be filled, manual delivery window expires, buyers get no delivery.

**Why it happens:** No validation that listed stock actually exists. Manual delivery mode has no physical constraint.

**Consequences:** Mass failed deliveries, refunds, platform reputation damage.

**Prevention:**
- For instant delivery: keys must be uploaded before going live. Stock count = actual uploaded keys, auto-decrements on sale.
- For manual delivery: cap maximum listed quantity for new sellers (e.g., max 10 active listings until 20 successful deliveries).
- Auto-cancel and refund orders where seller misses the delivery window. Do not make buyers chase this.
- Automatic listing suspension when a seller's on-time delivery rate drops below threshold (e.g., 90%).

**Detection:** Orders in "pending manual delivery" state older than the delivery window.

**Phase:** Inventory management and manual delivery phase.

---

### Pitfall 8: Price Undercutting Race to Zero + Fee Evasion

**What goes wrong:** Sellers collude to undercut platform prices to near-zero, then direct buyers to off-platform payment (Telegram, direct transfer). Platform gets no commission; it's used as a lead generator.

**Why it happens:** No enforcement on off-platform communication until after the damage is done.

**Consequences:** Zero commission revenue. Also exposes buyers to scams with no platform protection.

**Prevention:**
- Prohibit sharing contact info (Telegram, WhatsApp, email) in product listings or in pre-purchase chat. Scan for patterns: phone numbers, @usernames, email regex.
- Post-delivery chat should be read-only for support reference only (not a live communication channel).
- Watermark delivered content with the order ID where possible.
- Set a minimum listing price policy (e.g., no listing under $0.50).

**Detection:** Listings or chat messages containing contact info patterns.

**Phase:** Chat and messaging design. Build the moderation scan into listing creation and message send.

---

## Moderate Pitfalls

---

### Pitfall 9: RTL + LTR Mixed Content Breaking Layout

**What goes wrong:** Arabic UI (RTL) displays prices, order IDs, or key strings that are LTR. Without explicit `dir` attributes on inline elements, browsers mix direction and the layout breaks — especially for mixed Arabic + English product names.

**Prevention:**
- Always wrap prices and codes in `<span dir="ltr">`.
- Test every page in both `ar` and `en` locale with actual Arabic content, not placeholder text.
- Use `logical CSS properties` (margin-inline-start vs margin-left) in Tailwind where possible.
- Key strings, order IDs, and license keys should always be `dir="ltr"` regardless of locale.

**Phase:** UI/UX phase for each major feature. Add an RTL smoke-test checklist to the definition of done.

---

### Pitfall 10: next-intl Route Mismatch in API Routes

**What goes wrong:** API routes under `app/api/` do not receive the locale prefix. Client components using `useRouter().push('/ar/orders')` from an API callback or redirect will produce 404s in some configurations.

**Prevention:**
- API routes must never redirect to locale-prefixed paths directly — return JSON with a `redirectTo` field and let the client handle navigation.
- Middleware must explicitly exclude `/api/` from locale detection/redirect logic.
- Test all post-payment redirect flows in both locales.

**Phase:** Payment callback and post-order redirect handling.

---

### Pitfall 11: Prisma N+1 Queries on Marketplace Listing Pages

**What goes wrong:** Product listing page loads 50 products. Each product needs seller info, stock count, and average rating. Without explicit `include`, Prisma fires one query per product for related data — 150+ queries per page load.

**Prevention:**
- Always use Prisma `include` with nested selects on listing queries.
- Add `select` to limit returned fields — never return full seller profile on a listing card.
- Use `_count` aggregation in Prisma for stock/review counts rather than loading all records.
- Add database indexes on `productId`, `sellerId`, `status` columns that appear in WHERE clauses.

**Phase:** Marketplace listing phase. Profile with `prisma.$queryRaw` counts in development before shipping.

---

### Pitfall 12: Email Delivery Failure Silently Blocking Order Completion

**What goes wrong:** Key delivery email fails (Resend quota hit, DNS misconfiguration, spam filter). The order is marked complete, but buyer never received their key. They can't find the key and open a dispute.

**Prevention:**
- Never make order status transition depend on email success. Email is best-effort, order status is ground truth.
- Always show the key on-screen on the success/delivery page — this is the primary delivery mechanism.
- Store the delivery page URL (with order ID + auth token) so the buyer can return and view their key without email.
- Log email send failures and surface them in the admin panel.

**Phase:** Delivery flow (instant and manual).

---

### Pitfall 13: Unprotected Admin Stats / Revenue Endpoints

**What goes wrong:** `GET /api/admin/stats` returns revenue figures. A missing or misconfigured auth check (easy in Next.js App Router when middleware is the only guard) exposes financial data publicly.

**Prevention:**
- Every `app/api/admin/*` route must call an auth check function at the top — do not rely solely on middleware.
- Use a shared `requireAdminSession(req)` utility that throws 401 if session is absent or role is not admin.
- Add an integration test that calls each admin endpoint without a session and asserts 401.

**Phase:** Admin panel phase. Audit every admin route before deploying.

---

### Pitfall 14: Delivery Window Expiry With No Automatic Action

**What goes wrong:** Manual delivery window (e.g., 24 hours) passes. No automatic refund fires. Buyer waits. Days pass. Buyer files chargeback externally rather than a platform dispute. Platform loses both the fee and the chargeback fee.

**Prevention:**
- Implement a background job (cron or queue) that scans for orders past their delivery deadline and auto-triggers a refund + notifies buyer.
- In v1 without a job queue, a "sweep" API endpoint called by a cron webhook (e.g., Vercel cron) is acceptable.
- Buyers should receive an in-app + email notification when a delivery window is missed.

**Phase:** Manual delivery phase. Do not ship manual delivery without the expiry handler.

---

## Minor Pitfalls

---

### Pitfall 15: Locale-Specific Currency Formatting

**What goes wrong:** Iraqi Dinar (IQD) is typically quoted in thousands (25,000 IQD). JavaScript's `Intl.NumberFormat` with `ar-IQ` locale formats differently than with `en`. Inconsistent formatting looks unprofessional.

**Prevention:** Centralize all price formatting in a single utility function. Test with IQD and USD in both locales.

---

### Pitfall 16: Soft-Deleted Products Still Visible in Active Orders

**What goes wrong:** Admin deletes or disables a product. Orders referencing that product's details now show blank or broken product names.

**Prevention:** Orders must store a snapshot of product name and price at purchase time, not rely on a live join to the Product table.

---

### Pitfall 17: File Upload for Bulk Key Import With No Validation

**What goes wrong:** CSV bulk import accepts any file. Malformed input causes Prisma batch insert to partially succeed — some keys inserted, import appears to fail, leaving duplicate or partial state.

**Prevention:** Parse and validate the entire CSV before starting any database writes. Run the full insert in a single transaction — all or nothing.

---

### Pitfall 18: Chat Messages Leaking Sensitive Data

**What goes wrong:** Buyer and seller chat is a common vector for social engineering. Seller tricks buyer into sharing OTP or payment credentials. Platform is legally exposed.

**Prevention:**
- Display a permanent banner in the chat UI: "Never share payment info or passwords."
- Scan outgoing messages for patterns resembling OTPs, card numbers, or Iraqi phone number formats. Flag for review.
- Archive all chat messages for 90 days minimum for dispute evidence.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Wallet system | Double-spend race condition (Pitfall 2) | Atomic SQL update, CHECK constraint |
| Wallet system | Refund laundering via self-dealing (Pitfall 6) | Hold periods, self-dealing detection |
| Instant delivery | Key assignment race condition (Pitfall 1) | SELECT FOR UPDATE SKIP LOCKED |
| Instant delivery | Email failure blocks delivery (Pitfall 12) | Screen-first delivery, email is secondary |
| Manual delivery | Game account takeback (Pitfall 4) | Extended dispute window, seller checklist |
| Manual delivery | Phantom inventory (Pitfall 7) | Auto-cancel on window expiry |
| Manual delivery | Delivery window with no auto-refund (Pitfall 14) | Cron sweep job |
| Payment flow | Chargeback after digital delivery (Pitfall 5) | Delivery receipt logs, account-required |
| Seller onboarding | Fake/invalid key delivery (Pitfall 3) | Graduated trust, payout holds |
| Marketplace listing | N+1 Prisma queries (Pitfall 11) | Explicit include + _count from day one |
| Admin panel | Unprotected revenue endpoints (Pitfall 13) | Per-route auth check utility |
| Chat feature | Contact info leakage / off-platform evasion (Pitfall 8) | Content scan on message send |
| RTL/i18n | Mixed direction breaking layout (Pitfall 9) | Per-feature RTL smoke test |
| Any order flow | Locale redirect in API callbacks (Pitfall 10) | API returns redirect URL, client navigates |

---

## Sources

- Domain analysis based on documented failure patterns from G2A (fake key controversy 2019–2021), PlayerAuctions (account takeback disputes), Kinguin chargeback policies
- PostgreSQL SELECT FOR UPDATE SKIP LOCKED documentation (advisory locks for queue patterns)
- Next.js App Router middleware documentation (auth scope limitations)
- Prisma transaction and locking documentation
- Confidence: HIGH for financial/race condition patterns (well-documented in DB literature); HIGH for marketplace fraud patterns (extensively documented in platform post-mortems); MEDIUM for Next.js-specific patterns (verified against current App Router behavior)
