
# Plan: Resolve API Key Permissions for Dr. Green Client Creation

## ✅ Implementation Status

### Completed Tasks
- [x] Added `production-write` environment configuration
- [x] Created `getWriteEnvironment()` function for action-based routing
- [x] Updated `create-client` handler to use write credentials
- [x] Updated `create-client-legacy` handler to use write credentials
- [x] Updated `admin-reregister-client` handler to use write credentials
- [x] Updated `bootstrap-test-client` handler to use write credentials
- [x] Added `WRITE_ACTIONS` array for centralized action list

### Pending - Requires User Action
- [ ] Add `DRGREEN_WRITE_API_KEY` secret (operator-level API key)
- [ ] Add `DRGREEN_WRITE_PRIVATE_KEY` secret (corresponding private key)
- [ ] Fix `DRGREEN_STAGING_API_URL` secret (remove trailing `/dapp/`)

---

## Current Situation

All 4 configured API environments (Production, Alt-Production, Staging, Railway) can **read** data (GET strains) but **cannot create clients** (POST /dapp/clients returns 401 Unauthorized).

This indicates the API keys are associated with NFTs that have read-only access, not client creation rights.

---

## Root Cause

According to the Dr. Green DApp API documentation provided:
- Clients are created **against the primary NFT selected in the dapp**
- The API key must be linked to an NFT with **client creation permissions**
- Current keys appear to be "viewer" level, not "operator" level

---

## Technical Implementation (DONE)

### 1. Environment Configuration

Added `production-write` environment:

```typescript
'production-write': {
  apiUrl: 'https://api.drgreennft.com/api/v1',
  apiKeyEnv: 'DRGREEN_WRITE_API_KEY',
  privateKeyEnv: 'DRGREEN_WRITE_PRIVATE_KEY',
  name: 'Production (Write)',
}
```

### 2. Write Action Routing

Actions that require write permissions now automatically use write credentials:

```typescript
const WRITE_ACTIONS: string[] = [
  'create-client',
  'create-client-legacy', 
  'admin-reregister-client',
  'bootstrap-test-client',
];
```

The `getWriteEnvironment()` function checks if write credentials are configured and routes accordingly.

---

## Next Step: Add Write-Enabled Secrets

Once you have API keys with client creation permissions from Dr. Green:

### Required Secrets

| Secret Name | Purpose |
|-------------|---------|
| `DRGREEN_WRITE_API_KEY` | API key with client creation rights (Base64-encoded) |
| `DRGREEN_WRITE_PRIVATE_KEY` | Private key for signing write requests |

### How to Obtain

1. Contact Dr. Green / NFT administrator
2. Request API credentials linked to an NFT with **operator/admin permissions**
3. The credentials should allow POST to `/dapp/clients`

### Verification After Adding Secrets

Test client creation:
```json
POST /drgreen-proxy
{
  "action": "bootstrap-test-client",
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User",
  "countryCode": "ZA"
}
```

Expected success response:
```json
{
  "success": true,
  "clientId": "uuid-here",
  "kycLink": "https://kyc.drgreennft.com/...",
  "message": "Client created successfully"
}
```

---

## Optional: Fix Staging URL

The staging environment has a URL bug that should be fixed:

**Current Issue:** `DRGREEN_STAGING_API_URL` contains trailing `/dapp/`
**Causes:** Double path `/api/v1/dapp//dapp/clients`
**Fix:** Update secret to `https://stage-api.drgreennft.com/api/v1`

---

## Fallback: Local-Only Verification

If obtaining new API keys takes time, the local workaround is already in place:
1. Use local `drgreen_clients` table with verification flags
2. Admin manually sets `is_kyc_verified: true` and `admin_approval: 'VERIFIED'`
3. Users can browse/checkout with local verification
4. Real Dr. Green sync happens later when proper keys are available
