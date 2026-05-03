---
phase: 03-purchase-and-delivery
plan: 01
subsystem: database-schema
tags: [prisma, schema, order, audit-log, relations]
dependency_graph:
  requires: []
  provides: [extended-order-schema, audit-log-model, user-order-relations]
  affects: [03-02, 03-03, 03-04, 03-05, 03-06, 03-07, 03-08, 03-09, 03-10]
tech_stack:
  added: []
  patterns: [nullable-FK-relations, decimal-money-fields, audit-trail-model]
key_files:
  created: []
  modified:
    - prisma/schema.prisma
decisions:
  - "guestEmail made nullable (String?) to support registered buyer orders"
  - "sellerAmount and commissionAmount default to 0 — computed server-side at order creation, never from client input"
  - "credentials field added to Order for manual delivery; restricted to authenticated owner access in service layer (Plan 04)"
metrics:
  duration: "5m"
  completed: "2026-05-03"
  tasks_completed: 1
  tasks_total: 1
---

# Phase 03 Plan 01: Prisma Schema Extension Summary

Extended `prisma/schema.prisma` with all Phase 3 data requirements — Order model gains buyer/seller relations, financial fields, delivery tracking fields, and an audit log relation. New AuditLog model and AuditEvent enum provide tamper-evident delivery tracking.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend Order model and enums in schema.prisma | c40830f | prisma/schema.prisma |

## Changes Made

### OrderStatus enum
Added `FAILED` value to support payment failure state.

### Order model
- `guestEmail` changed from `String` to `String?` (nullable)
- Added `buyerId String?` + `buyer User? @relation("BuyerOrders",...)`
- Added `sellerId String?` + `seller User? @relation("SellerOrders",...)`
- Added `sellerAmount Decimal @default(0) @db.Decimal(10,2)`
- Added `commissionAmount Decimal @default(0) @db.Decimal(10,2)`
- Added `credentials String?` (manual delivery account data)
- Added `disputeDeadline DateTime?`, `confirmDeadline DateTime?`, `deliveredAt DateTime?`, `confirmedAt DateTime?`
- Added `auditLogs AuditLog[]` relation
- Added `@@index([buyerId])`, `@@index([sellerId])`, `@@index([status])`

### New AuditEvent enum
`KEY_REVEALED`, `CREDENTIALS_DELIVERED`, `BUYER_CONFIRMED`, `AUTO_CONFIRMED`

### New AuditLog model
Fields: `id`, `orderId`, `order`, `event (AuditEvent)`, `ip`, `userAgent`, `createdAt`
Indexes: `orderId`, `createdAt`

### User model
Added `buyerOrders Order[] @relation("BuyerOrders")` and `sellerOrders Order[] @relation("SellerOrders")` back-relations.

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: information-disclosure | prisma/schema.prisma | Order.credentials field holds plaintext account credentials — service layer (Plan 04) must restrict field to authenticated order owner only; never return in list endpoints |

## Self-Check: PASSED

- `prisma/schema.prisma` exists and was modified
- Commit `c40830f` exists in git log
- `npx prisma validate` exits 0 (with DATABASE_URL set)
- `grep "FAILED" prisma/schema.prisma` returns match
- `grep "buyerId" prisma/schema.prisma` returns match
- `grep "BuyerOrders"` returns 2 lines (Order relation + User back-relation)
- `grep "model AuditLog"` returns match
