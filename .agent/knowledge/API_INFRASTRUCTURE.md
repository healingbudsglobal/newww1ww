# API Infrastructure Knowledge Base

> **Project:** Healing Buds / Dr. Green DApp Integration
> **Last Updated:** 2026-02-08
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
    environment: "production",  // optional, defaults to production
    params: { countryCode: "PRT" },
  },
});
```

---

## 2. Multi-Environment Credential Management

### Five Environments

The project supports 5 distinct API environments, each with its own key pair:

| Environment | Secret Prefix | Purpose | API URL |
|-------------|---------------|---------|---------|
| **Production** | `DRGREEN_` | Live patient data | `api.drgreennft.com` |
| **Alt-Production** | `DRGREEN_ALT_` | Testing on production API | `api.drgreennft.com` |
| **Staging** | `DRGREEN_STAGING_` | Official staging environment | `stage-api.drgreennft.com` |
| **Railway** | `DRGREEN_RAILWAY_` | Development environment | Varies |
| **Production-Write** | `DRGREEN_WRITE_` | Dedicated write credentials | `api.drgreennft.com` |

### Secret Naming Convention

Each environment requires two secrets:

| Secret | Format | Example |
|--------|--------|---------|
| API Key | `{PREFIX}API_KEY` | `DRGREEN_API_KEY`, `DRGREEN_STAGING_API_KEY` |
| Secret/Private Key | `{PREFIX}PRIVATE_KEY` | `DRGREEN_PRIVATE_KEY`, `DRGREEN_STAGING_PRIVATE_KEY` |

Some environments also have a custom base URL:

| Secret | Format | Example |
|--------|--------|---------|
| Base URL | `{PREFIX}API_URL` | `DRGREEN_STAGING_API_URL` |

### Credential Resolution Logic

```typescript
function getCredentials(environment: string) {
  switch (environment) {
    case 'production':
      return {
        apiKey: Deno.env.get("DRGREEN_API_KEY"),
        secretKey: Deno.env.get("DRGREEN_PRIVATE_KEY"),
        baseUrl: "https://api.drgreennft.com/api/v1",
      };
    case 'staging':
      return {
        apiKey: Deno.env.get("DRGREEN_STAGING_API_KEY"),
        secretKey: Deno.env.get("DRGREEN_STAGING_PRIVATE_KEY"),
        baseUrl: Deno.env.get("DRGREEN_STAGING_API_URL") || "https://stage-api.drgreennft.com/api/v1",
      };
    // ... etc for alt-production, railway, production-write
  }
}
```

### Write vs Read Credential Separation

- **Read credentials** (Production, Alt-Production, Staging, Railway) are used for GET operations: listing strains, fetching clients, viewing orders
- **Write credentials** (Production-Write) are dedicated to POST/PATCH/DELETE operations: creating clients, placing orders, updating records
- This separation allows for different NFT scopes and audit trails

---

## 3. NFT-Scoped Access Control

### How It Works

The Dr. Green API enforces **strict NFT-scoped access**:

1. Each API key pair is associated with a specific **NFT** and **dApp identity**
2. Client records created with Key A **cannot be accessed** by Key B
3. Orders placed with Key A **cannot be queried** by Key B
4. This is a security feature, not a bug

### Implications

- **Client migration**: When credentials change, existing clients become inaccessible under new keys
- **Re-registration required**: Users must re-register under the new API key scope
- **KYC re-verification**: New client records require fresh KYC verification
- **"Find & Link" tool**: The admin dashboard includes a tool to search for clients under different key scopes and link them

### Current Identity

| Property | Value |
|----------|-------|
| dApp Name | `healingbudscoza` |
| NFT Owner | `0x0b60d85fefcd9064a29f7df0f8cbc7901b9e6c84` |

---

## 4. Authentication Mechanism

### HMAC-SHA256 Signing

> **See:** [DRGREEN-API-SIGNING-KNOWLEDGE.md](../../docs/DRGREEN-API-SIGNING-KNOWLEDGE.md) for complete details

**Summary:**

| Property | Value |
|----------|-------|
| Algorithm | HMAC-SHA256 (symmetric) |
| Key format | Base64-encoded raw bytes |
| GET signing payload | Query string (e.g., `orderBy=desc&take=10`) |
| POST signing payload | JSON body string |
| API key header | `x-auth-apikey` — raw Base64, no processing |
| Signature header | `x-auth-signature` — Base64 HMAC output |

### Critical Rule: Do NOT Process API Keys

The API key must be sent **exactly as stored** in secrets. Specifically:

- ❌ Do NOT use `extractPemBody()` or strip PEM headers
- ❌ Do NOT trim, decode, or re-encode the key
- ✅ Send the raw string value from `Deno.env.get("DRGREEN_API_KEY")`

This was a root cause of persistent 401 errors. See the signing knowledge doc for details.

---

## 5. Health Check Pattern

### Architecture

A dedicated `drgreen-health` edge function provides API connectivity monitoring:

```
GET /functions/v1/drgreen-health
```

### Response Format

```json
{
  "status": "healthy",         // healthy | degraded | unhealthy
  "checks": {
    "credentials": {
      "status": "ok",
      "message": "API credentials configured"
    },
    "api_connectivity": {
      "status": "ok",
      "message": "API reachable",
      "duration": 497
    }
  },
  "totalDuration": 512,
  "timestamp": "2026-02-08T12:00:00.000Z"
}
```

### Health Check Behaviour

1. Verifies credentials are configured (fast, no network call)
2. Makes authenticated GET request to `/strains?orderBy=desc&take=1&page=1`
3. Reports status based on response
4. Includes timing information for latency monitoring

### Usage in Admin Dashboard

The health check is called from the admin dashboard to show real-time API status. It should be called:
- On admin dashboard load
- Every 5 minutes while the dashboard is open
- On-demand via a "Check API Health" button

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
  throw new Error("Retry exhausted"); // unreachable but satisfies TS
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

// ✅ Good: Sanitized error
return { error: "API authentication failed" };

// ❌ Bad: Internal details leaked
return { error: `HMAC verification failed for key ${apiKey} with secret ${secretKey}` };
```

### Request Validation

All proxy requests must validate:
1. `action` parameter is a known, whitelisted action
2. `environment` parameter is one of the 5 valid environments
3. Request body matches expected schema for the action
4. JWT authentication (user is logged in) for sensitive actions

---

## 8. Key Rotation & Migration

### When Credentials Change

1. **Update secrets** in Lovable Cloud for the affected environment
2. **Test with `drgreen-health`** to verify new credentials work
3. **Run `debug-compare-keys`** to verify all environments
4. **Existing clients become inaccessible** under new NFT scope
5. **Prompt re-registration** for affected users via dashboard

### Migration Checklist

- [ ] New credentials obtained from Dr. Green team
- [ ] Secrets updated in Lovable Cloud
- [ ] Health check passes with new credentials
- [ ] Admin notified of client re-registration requirement
- [ ] "Re-Sync Account" flow tested end-to-end
- [ ] Old credentials documented for reference

---

## 9. Local-First Data Strategy

### Architecture

Records are persisted locally before syncing with the external API:

```
1. User action (e.g., add to cart)
2. Save to local Supabase table (drgreen_cart)
3. Sync to Dr. Green API via proxy
4. Update local record with API response (drgreen_client_id, etc.)
```

### Benefits

- **Resilience**: App works even if Dr. Green API is temporarily down
- **Speed**: Local reads are fast; API sync is async
- **Audit trail**: Local records provide a secondary audit log
- **Eligibility checks**: Can be done locally without API calls

### Tables

| Local Table | Purpose | Syncs With |
|-------------|---------|------------|
| `drgreen_clients` | Client cache + eligibility | `/dapp/clients` |
| `drgreen_cart` | Cart items per user | `/dapp/carts` |
| `drgreen_orders` | Order history | `/dapp/orders` |
| `strains` | Product catalog | `/strains` |

---

## 10. Lessons Learned

### The Top 5 Mistakes to Avoid

1. **Don't assume signing method from documentation code samples** — the Dr. Green docs show `crypto.sign()` (asymmetric) but the API actually uses HMAC-SHA256 (symmetric). Always verify with a working reference implementation.

2. **Don't process API keys** — send them exactly as stored. The `extractPemBody()` function corrupted the key by treating it as PEM when it was raw Base64.

3. **Don't sign an empty payload for GET requests** — the API expects the query string to be signed, not `"{}"` or an empty string.

4. **Don't mix up environments** — each environment has distinct credentials. A 401 on staging with production keys is expected behavior, not a bug.

5. **Always build a health check first** — the `drgreen-health` endpoint was the tool that proved the API was working and the credentials were valid, isolating the bug to the proxy's signing logic.
