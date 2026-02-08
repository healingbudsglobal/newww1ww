# Dr. Green API — Signing & Authentication Knowledge Base

> **Last Updated:** 2026-02-08
> **Status:** RESOLVED — All 5 environments authenticating successfully
> **Related:** [API Integration Guide](./DRGREEN-API-INTEGRATION.md) · [Infrastructure Knowledge](../.agent/knowledge/API_INFRASTRUCTURE.md)

---

## Executive Summary

The Dr. Green DApp API uses **HMAC-SHA256 symmetric signing** for request authentication. This was discovered after extensive debugging of persistent 401 Unauthorized errors caused by an incorrect implementation using secp256k1 ECDSA asymmetric signing. This document captures the correct approach and the pitfalls that led to the error.

---

## The Correct Signing Method

### Algorithm: HMAC-SHA256 (Symmetric)

| Property | Value |
|----------|-------|
| Algorithm | HMAC-SHA256 |
| Key type | Symmetric (shared secret) |
| Key format | Base64-encoded raw bytes |
| Signature output | Base64-encoded string |
| Header: API key | `x-auth-apikey` — raw Base64 key as stored |
| Header: Signature | `x-auth-signature` — Base64 HMAC output |

### What to Sign Per HTTP Method

| HTTP Method | Data to Sign | Example |
|-------------|-------------|---------|
| **GET** | The query string (without `?`) | `orderBy=desc&take=10&page=1` |
| **POST** | The JSON body string | `JSON.stringify(body)` |
| **PATCH** | The JSON body string | `JSON.stringify(body)` |
| **DELETE** | The JSON body string | `JSON.stringify(body)` |
| No params/body | Empty string | `""` |

> **Critical:** For GET requests, sign the **actual query string**, not an empty object, not `"{}"`, and not the full URL.

---

## Reference Implementations

### Deno / Web Crypto API (Edge Functions)

This is the implementation used in `drgreen-proxy` and `drgreen-health`:

```typescript
/**
 * Sign data using HMAC-SHA256.
 * 
 * @param dataToSign - The query string (GET) or JSON body (POST)
 * @param secretKey  - The Base64-encoded secret key from environment
 * @returns Base64-encoded HMAC signature
 */
async function signWithHmac(dataToSign: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Step 1: Decode the Base64 secret key to raw bytes
  let keyBytes: Uint8Array;
  try {
    const binaryString = atob(secretKey);
    keyBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      keyBytes[i] = binaryString.charCodeAt(i);
    }
  } catch {
    // Fallback: use the key as-is if not valid Base64
    keyBytes = encoder.encode(secretKey);
  }
  
  // Step 2: Import as HMAC-SHA256 key
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  // Step 3: Sign the data
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(dataToSign)
  );
  
  // Step 4: Convert to Base64
  const signatureBytes = new Uint8Array(signatureBuffer);
  let binary = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binary += String.fromCharCode(signatureBytes[i]);
  }
  return btoa(binary);
}
```

### Node.js (WordPress / Backend Reference)

This is the equivalent implementation for Node.js environments:

```javascript
const crypto = require('crypto');

/**
 * Sign data using HMAC-SHA256.
 * 
 * @param {string} dataToSign - Query string (GET) or JSON body (POST)
 * @param {string} secretKey  - Base64-encoded secret key
 * @returns {string} Base64-encoded HMAC signature
 */
function signWithHmac(dataToSign, secretKey) {
  // Decode the Base64 secret key to raw bytes
  const keyBuffer = Buffer.from(secretKey, 'base64');
  
  // Create HMAC-SHA256 and sign
  const hmac = crypto.createHmac('sha256', keyBuffer);
  hmac.update(dataToSign);
  return hmac.digest('base64');
}
```

### Usage Examples

**GET request (list strains):**
```typescript
const queryString = "orderBy=desc&take=10&page=1&countryCode=PRT";
const signature = await signWithHmac(queryString, secretKey);

const response = await fetch(`${API_URL}/strains?${queryString}`, {
  method: "GET",
  headers: {
    "Content-Type": "application/json",
    "x-auth-apikey": apiKey,        // Raw Base64 key — NOT processed
    "x-auth-signature": signature,
  },
});
```

**POST request (create client):**
```typescript
const body = { firstName: "John", lastName: "Doe", email: "john@example.com" };
const bodyString = JSON.stringify(body);
const signature = await signWithHmac(bodyString, secretKey);

const response = await fetch(`${API_URL}/dapp/clients`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-auth-apikey": apiKey,
    "x-auth-signature": signature,
  },
  body: bodyString,
});
```

---

## Root Cause Analysis: The 401 Errors

### What Went Wrong

The original proxy implementation had **three critical errors** that all compounded:

| # | Error | What Was Done | What Should Have Been Done |
|---|-------|--------------|---------------------------|
| 1 | **Wrong algorithm** | secp256k1 ECDSA (asymmetric) | HMAC-SHA256 (symmetric) |
| 2 | **Wrong payload for GET** | Signed empty JSON `"{}"` | Sign the query string |
| 3 | **Wrong API key format** | Stripped PEM headers via `extractPemBody()` | Send raw Base64 key as stored |

### Why the Confusion Occurred

The Dr. Green API documentation includes a Node.js example that uses:

```javascript
const privateKeyObject = crypto.createPrivateKey(privateKeyBuffer);
const signature = crypto.sign(null, Buffer.from(payload), privateKeyObject);
```

This pattern uses `crypto.sign()` with a private key object, which performs **asymmetric** signing. However, the actual working WordPress implementation and the API's auth mechanism label both confirm **HMAC SHA256**. The documentation example appears to be either:

1. An older version of the API's signing method
2. A documentation error
3. A pattern used for a different API version

The health check endpoint (`drgreen-health`) was implemented using HMAC-SHA256 and worked on the first attempt, proving this is the correct approach.

### The `extractPemBody()` Trap

The original proxy included a function that attempted to parse the API key as a PEM certificate:

```typescript
// ❌ WRONG: This function strips the PEM headers
function extractPemBody(pemString: string): string {
  return pemString
    .replace(/-----BEGIN.*-----/, '')
    .replace(/-----END.*-----/, '')
    .replace(/\s/g, '');
}
```

The API key stored in secrets is a raw Base64 string, not a PEM-formatted key. Processing it through `extractPemBody()` corrupted the value by stripping characters that happened to match PEM header patterns. The key must be sent **exactly as stored**.

---

## Environment Variable Toggle

A safety toggle exists for rollback:

| Variable | Default | Effect |
|----------|---------|--------|
| `DRGREEN_USE_HMAC` | `true` | When `true`, uses HMAC-SHA256 signing |

If set to `false`, the proxy falls back to the legacy secp256k1 ECDSA signing. This should only be used if the API changes its signing method in the future.

---

## Diagnostic Endpoints

Two diagnostic actions are available in the `drgreen-proxy` edge function for future debugging:

### `debug-signing-test`

Tests both signing methods (HMAC-SHA256 and secp256k1 ECDSA) against the strains endpoint and returns a comparison:

```json
{
  "action": "debug-signing-test",
  "environment": "production"
}
```

Returns which method succeeded and which failed, with response status codes.

### `debug-compare-keys`

Tests API connectivity across all 5 configured environments using the current signing method:

```json
{
  "action": "debug-compare-keys"
}
```

Returns a summary showing which environments authenticate successfully.

### `drgreen-health` (Standalone Function)

A lightweight health check that verifies API connectivity and credential configuration:

```
GET /functions/v1/drgreen-health
```

Returns `healthy`, `degraded`, or `unhealthy` status with timing information.

---

## Quick Debugging Checklist

When encountering 401 errors with the Dr. Green API:

1. ✅ **Check the signing method** — Must be HMAC-SHA256, not ECDSA
2. ✅ **Check what's being signed** — GET: query string, POST: JSON body
3. ✅ **Check the API key header** — Must be raw Base64, no PEM stripping
4. ✅ **Check the secret key decoding** — Must Base64-decode to bytes before use as HMAC key
5. ✅ **Run `drgreen-health`** — Confirms if credentials and API are valid
6. ✅ **Run `debug-signing-test`** — Confirms which signing method works
7. ✅ **Check environment** — Verify the correct environment's credentials are being used

---

## Version History

| Date | Change |
|------|--------|
| 2026-02-08 | Initial creation — documenting HMAC-SHA256 discovery and fix |
| 2026-02-07 | Root cause identified: secp256k1 → HMAC-SHA256 |
| 2026-02-06 | Health check endpoint confirmed API is online with HMAC signing |
