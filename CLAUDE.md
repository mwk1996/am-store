# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A digital product store for selling **software licenses**. Customers checkout as guests (no accounts), pay via an Iraqi payment gateway, and receive a license key on-screen and by email. An admin panel manages products, license keys, and orders.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| Auth (admin only) | NextAuth.js (credentials provider) |
| i18n | next-intl |
| Payment | Iraqi payment gateway (custom integration) |
| Email | Resend or Nodemailer |

## Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database migrations
npx prisma migrate dev --name <migration-name>
npx prisma migrate deploy        # production
npx prisma studio                # GUI for DB

# Generate Prisma client after schema changes
npx prisma generate

# Lint
npm run lint
```

## Architecture

### Routing (App Router)

```
app/
  [locale]/               # i18n wrapper — all pages live here
    page.tsx              # storefront / product listing
    checkout/page.tsx     # guest checkout form
    success/page.tsx      # post-payment — shows license key
    admin/                # protected admin panel
      layout.tsx          # checks NextAuth session
      dashboard/
      products/
      orders/
      licenses/
  api/
    auth/[...nextauth]/   # NextAuth handler
    payment/              # Iraqi gateway webhook + initiation
    orders/               # order creation
    admin/                # admin CRUD endpoints
```

### i18n

- **next-intl** handles routing via `[locale]` segment
- Supported locales: `en`, `ar`, `tr`, `ku`
- RTL languages: `ar`, `ku` — `dir` attribute is set on `<html>` based on locale
- Translation files live in `messages/en.json`, `messages/ar.json`, etc.
- All UI strings must go through `useTranslations()` — no hardcoded display text

### Data Flow — Purchase

1. Customer selects product → hits `/[locale]/checkout`
2. Order record created (`status: pending`) via `POST /api/orders`
3. Payment initiated with Iraqi gateway → customer redirected to gateway
4. Gateway posts back to `POST /api/payment/callback` with result
5. On success: order marked `paid`, a license key is pulled from the pool and assigned, email sent, customer redirected to `/[locale]/success?order=<id>`

### Database Schema (key models)

- **Product** — name (JSON multilingual), price, description, image
- **LicenseKey** — key string, productId, orderId (null = available), assignedAt
- **Order** — guestEmail, productId, licenseKeyId, status (`pending|paid|failed`), gatewayRef, locale
- License keys are pre-loaded into the pool; one is assigned atomically on payment success

### Admin Panel

- Protected by NextAuth session — only credentials login, no OAuth
- Manages: products (CRUD), license key bulk import (CSV paste), order list with status, dashboard stats
- Admin routes are under `app/[locale]/admin/` with a layout that redirects unauthenticated users

### Payment Integration

- Gateway-specific logic lives in `lib/payment/` — keep all gateway API calls there
- Webhook endpoint verifies gateway signature before processing
- Orders use idempotency: if callback fires twice, check `order.status` before reassigning a key

### Multilingual Content

- Product names and descriptions are stored as JSON columns in Postgres: `{ "en": "...", "ar": "...", "tr": "...", "ku": "..." }`
- Admin form has tabs per language when editing a product
- Always fall back to `en` if a locale key is missing

## Key Conventions

- Server Components by default; add `"use client"` only when needed (forms, interactive UI)
- Prisma client is a singleton in `lib/prisma.ts`
- Environment variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `PAYMENT_GATEWAY_SECRET`, `RESEND_API_KEY`
- shadcn/ui components are in `components/ui/` — do not modify them directly; extend via wrapper components
