---
phase: 02-marketplace-browsing-and-listings
plan: "02"
subsystem: security/crypto
tags: [encryption, aes-256-gcm, at-rest, sec-02]
dependency_graph:
  requires: []
  provides: [lib/crypto.ts]
  affects: [services/key.service.ts, app/api/orders]
tech_stack:
  added: []
  patterns: [AES-256-GCM with random IV and GCM auth tag, startup fail-fast env guard]
key_files:
  created:
    - lib/crypto.ts
    - lib/crypto.test.mjs
  modified: []
decisions:
  - "AES-256-GCM chosen for authenticated encryption — auth tag makes tampered ciphertext unreadable"
  - "12-byte (96-bit) IV per GCM spec recommendation"
  - "Stored format ivHex:authTagHex:ciphertextHex is self-contained — no external state needed to decrypt"
  - "Startup guard throws at module load time so the server won't start with a misconfigured key"
metrics:
  duration: "5m"
  completed: "2026-05-03"
  tasks_completed: 1
  tasks_total: 1
  files_created: 2
  files_modified: 0
---

# Phase 02 Plan 02: AES-256-GCM Key Encryption Utility Summary

**One-liner:** AES-256-GCM encrypt/decrypt utility with random IV, GCM auth tag tamper detection, and fail-fast startup guard for KEY_ENCRYPTION_SECRET.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create lib/crypto.ts with AES-256-GCM encryptKey / decryptKey | bc67711 | lib/crypto.ts, lib/crypto.test.mjs |

## What Was Built

`lib/crypto.ts` is the single canonical path for license key encryption in the codebase (SEC-02). It provides:

- `encryptKey(plaintext: string): string` — encrypts using AES-256-GCM with a 12-byte random IV; returns `ivHex:authTagHex:ciphertextHex`
- `decryptKey(ciphertext: string): string` — decrypts and verifies the GCM auth tag; throws on tampered or malformed input
- **Startup guard** — throws `Error` at module load time if `KEY_ENCRYPTION_SECRET` is not exactly 64 hex characters (32 bytes)

No external npm packages are used — only the Node.js built-in `crypto` module.

## TDD Gate Compliance

- RED: test script (`lib/crypto.test.mjs`) written before implementation file was created
- GREEN: implementation created, all 5 behavioral checks pass (format, round-trip, random IV, tamper detection, startup guard)
- No REFACTOR phase needed — implementation was clean on first pass

## Verification Results

All pass:
- Format check: `encryptKey()` returns `ivHex:authTagHex:ciphertextHex`
- Round-trip: `decryptKey(encryptKey(x)) === x`
- Random IV: two calls to `encryptKey("same")` produce different ciphertexts
- Tamper detection: modified ciphertext throws (GCM auth tag mismatch)
- Startup guard: wrong-length key throws with descriptive message

## Deviations from Plan

None — plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. `lib/crypto.ts` is a pure utility with no I/O. `KEY_ENCRYPTION_SECRET` env var is consumed server-side only; it is never logged or included in any response.

## Self-Check: PASSED

- `lib/crypto.ts` exists: confirmed
- Commit `bc67711` exists: confirmed
- Exports `encryptKey` and `decryptKey`: confirmed via grep
- Startup guard `KEY_BUF.length !== 32`: confirmed present
- No npm imports (only `"crypto"`): confirmed
