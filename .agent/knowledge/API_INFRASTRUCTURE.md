# API Infrastructure Knowledge Base

> **Project:** Healing Buds / Dr. Green DApp Integration
> **Last Updated:** 2026-02-09
> **Scope:** Reusable patterns for external API integration via edge function proxies

---

## 1. Proxy Architecture Pattern

All external API communication follows this mandatory architecture:

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Frontend   │────▶│  Edge Function   │────▶│  External API    │
│  (React/Vite)│     │  (Proxy Layer)   │     │  (Dr. Green)     │
│              │     │                  │     │                  │
│  • No API    │     │  • Signing       │     │  • Authenticated │
│    keys      │     │  • Credentials   │     │    endpoints     │
│  • No direct │     │  • Env routing   │     │  • NFT-scoped    │
│    API calls │     │  • Error sanitize│     │    access        │
└──────────────┘     └──────────────────┘     └──────────────────┘
```

### Rules

1. **Frontend NEVER calls external APIs directly** — all requests go through the proxy edge function
2. **API keys and secrets are stored server-side only** — in Lovable Cloud secrets
3. **Request signing happens server-side only** — cryptographic operations in edge functions
4. **Error responses are sanitized** — internal error details are never exposed to the client
5. **Logging is sanitized** — keys and signatures are never logged in full; use truncated representations

### Calling the Proxy from Frontend

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke("drgreen-proxy", {
  body: {
    action: "get-products",
    environment: "production",  // "production" or "railway"
    params: { countryCode: "PRT" },
  },
});
```

---

## 2. Credential Management

### Two Environments

The project supports **2 environments**, each with its own key pair. **All actions (read and write) use the same credentials per environment.** There is no separate write key.

| Environment | Secret Prefix | Purpose | API URL |
|-------------|---------------|---------|---------|
| **Production** | `DRGREEN_` | Live patient data, all operations | `api.drgreennft.com` |
| **Railway** | `DRGREEN_STAGING_` | Development/testing | Railway URL |

### Secret Naming Convention

Each environment requires two secrets:

| Secret | Format | Example |
|--------|--------|---------|
| API Key | `{PREFIX}API_KEY` | `DRGREEN_API_KEY`, `DRGREEN_STAGING_API_KEY` |
| Secret/Private Key | `{PREFIX}PRIVATE_KEY` | `DRGREEN_PRIVATE_KEY`, `DRGREEN_STAGING_PRIVATE_KEY` |

### Credential Resolution Logic

```typescript
function getEnvironment(requestedEnv?: string): EnvConfig {
  if (requestedEnv === 'railway') {
    return ENV_CONFIG.railway;
  }
  return ENV_CONFIG.production; // default
}
```

### No Read/Write Credential Separation

All operations — reads, writes, client creation, cart, orders — use the **same single credential set** per environment. This avoids NFT-scope mismatches.

---

## 3. NFT-Scoped Access Control

### How It Works

The Dr. Green API enforces **strict NFT-scoped access**:

1. Each API key pair is associated with a specific **NFT** and **dApp identity**
2. Client records created with Key A **cannot be accessed** by Key B
3. Orders placed with Key A **cannot be queried** by Key B
4. This is a security feature, not a bug

### Implications

- **All operations must use the same key** — read, write, cart, orders
- **Client migration**: When credentials change, existing clients become inaccessible under new keys
- **Re-registration required**: Users must re-register under the new API key scope

### Current Identity

| Property | Value |
|----------|-------|
| dApp Name | `healingbudscoza` |
| NFT Owner | `0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84` |

---

## 4. Authentication Mechanism

### Signing Method

The Dr. Green API uses **secp256k1 ECDSA** asymmetric signing for `/dapp/*` endpoints. HMAC-SHA256 also works for public endpoints like `/strains`.

| Property | Value |
|----------|-------|
| Algorithm | secp256k1 ECDSA (asymmetric) |
| Key format | Base64-encoded PKCS#8 PEM (EC PRIVATE KEY) |
| GET signing payload | Query string (e.g., `orderBy=desc&take=10`) |
| POST signing payload | JSON body string |
| API key header | `x-auth-apikey` — raw Base64 PEM, no processing |
| Signature header | `x-auth-signature` — Base64 DER-encoded ECDSA signature |

> See [DRGREEN-API-SIGNING-KNOWLEDGE.md](../../docs/DRGREEN-API-SIGNING-KNOWLEDGE.md) for complete details.

---

## 5. Health Check Pattern

A dedicated `drgreen-health` edge function provides API connectivity monitoring:

```
GET /functions/v1/drgreen-health
```

### Response Format

```json
{
  "status": "healthy",
  "checks": {
    "credentials": { "status": "ok", "message": "API credentials configured" },
    "api_connectivity": { "status": "ok", "message": "API reachable", "duration": 497 }
  },
  "totalDuration": 512,
  "timestamp": "2026-02-09T12:00:00.000Z"
}
```

---

## 6. Retry Configuration

### Exponential Backoff

For critical operations (order creation, client registration), implement retries:

```typescript
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Retry exhausted");
}
```

### Timeout Configuration

| Operation | Timeout |
|-----------|---------|
| Health check | 10 seconds |
| GET requests | 15 seconds |
| POST requests | 30 seconds |
| Batch operations | 60 seconds |

---

## 7. Security Patterns

### Never Expose

- ❌ API keys in frontend code, logs, or error messages
- ❌ Secret/private keys anywhere outside edge functions
- ❌ Full signatures in logs (truncate to first 8 chars)
- ❌ Internal API error details to frontend (sanitize)

### Sanitized Logging

```typescript
// ✅ Good: Truncated key for identification
console.log(`[API] Using key: ${apiKey.substring(0, 8)}...`);

// ❌ Bad: Full key exposed
console.log(`[API] Using key: ${apiKey}`);
```

---

## 8. Local-First Data Strategy

Records are persisted locally before syncing with the external API:

| Local Table | Purpose | Syncs With |
|-------------|---------|------------|
| `drgreen_clients` | Client cache + eligibility | `/dapp/clients` |
| `drgreen_cart` | Cart items per user | `/dapp/carts` |
| `drgreen_orders` | Order history | `/dapp/orders` |
| `strains` | Product catalog | `/strains` |

---

## 9. Lessons Learned

### The Top 3 Mistakes to Avoid

1. **Don't use separate read/write credentials** — all operations for a client must use the same API key pair. NFT-scope isolation means a client created with Key A cannot have cart/order operations performed with Key B.

2. **Don't process API keys** — send them exactly as stored. The `extractPemBody()` function corrupted the key by treating it as PEM when it was raw Base64.

3. **Always build a health check first** — the `drgreen-health` endpoint was the tool that proved the API was working and the credentials were valid.
