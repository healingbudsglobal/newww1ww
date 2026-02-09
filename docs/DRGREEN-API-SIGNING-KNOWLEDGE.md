# Dr. Green API — Signing & Authentication Knowledge Base

> **Last Updated:** 2026-02-09
> **Status:** RESOLVED — Production and Railway environments authenticating successfully
> **Related:** [API Integration Guide](./DRGREEN-API-INTEGRATION.md) · [Infrastructure Knowledge](../.agent/knowledge/API_INFRASTRUCTURE.md)

---

## Executive Summary

The Dr. Green DApp API uses **secp256k1 ECDSA** asymmetric signing for `/dapp/*` endpoints. HMAC-SHA256 also works for public endpoints like `/strains`. Both signing methods exist in the codebase; secp256k1 is the default active path.

**All operations (read and write) use the same single credential set per environment.** There are only two environments: Production and Railway.

---

## Signing Methods

### Primary: secp256k1 ECDSA (for `/dapp/*` endpoints)

| Property | Value |
|----------|-------|
| Algorithm | secp256k1 ECDSA (asymmetric) |
| Key type | PKCS#8 EC private key |
| Key format | Base64-encoded PKCS#8 PEM |
| Signature output | Base64-encoded DER format |
| Header: API key | `x-auth-apikey` — raw Base64 key as stored |
| Header: Signature | `x-auth-signature` — Base64 DER-encoded ECDSA signature |

### Fallback: HMAC-SHA256 (for `/strains` public endpoints)

| Property | Value |
|----------|-------|
| Algorithm | HMAC-SHA256 (symmetric) |
| Key type | Symmetric shared secret |
| Key format | Base64-encoded raw bytes |
| Signature output | Base64-encoded HMAC output |

### What to Sign Per HTTP Method

| HTTP Method | Data to Sign | Example |
|-------------|-------------|---------|
| **GET** | The query string (without `?`) | `orderBy=desc&take=10&page=1` |
| **POST** | The JSON body string | `JSON.stringify(body)` |
| **PATCH** | The JSON body string | `JSON.stringify(body)` |
| **DELETE** | The JSON body string | `JSON.stringify(body)` |
| No params/body | Empty string | `""` |

> **Critical:** For GET requests, sign the **actual query string**, not an empty object.

---

## Environments

| Environment | Credentials | API URL |
|-------------|-------------|---------|
| **Production** | `DRGREEN_API_KEY` / `DRGREEN_PRIVATE_KEY` | `api.drgreennft.com` |
| **Railway** | `DRGREEN_STAGING_API_KEY` / `DRGREEN_STAGING_PRIVATE_KEY` | Railway URL |

**No separate write keys exist.** All operations use the same credentials per environment.

---

## Diagnostic Endpoints

### `debug-signing-test`
Tests both signing methods against the strains endpoint.

### `debug-compare-keys`
Tests API connectivity across configured environments.

### `drgreen-health` (Standalone Function)
Lightweight health check: `GET /functions/v1/drgreen-health`

---

## Quick Debugging Checklist

1. ✅ **Check the signing method** — secp256k1 ECDSA for `/dapp/*`, HMAC for `/strains`
2. ✅ **Check what's being signed** — GET: query string, POST: JSON body
3. ✅ **Check the API key header** — Must be raw Base64, no PEM stripping
4. ✅ **Check environment** — Only `production` and `railway` exist
5. ✅ **Run `drgreen-health`** — Confirms credentials and API are valid
6. ✅ **All operations use same key** — No separate read/write credentials

---

## Version History

| Date | Change |
|------|--------|
| 2026-02-09 | Simplified to 2 environments (production + railway). Removed write/alt/staging separation. |
| 2026-02-08 | Initial creation — documenting signing methods |
