

# Root Cause Analysis: Knowledge File Contradictions & Credential Mismatches

## The Core Problem

There are **two contradicting knowledge files** that give opposite instructions about signing, plus a credential scope issue. This is why errors keep recurring -- fixes based on one document break compatibility described in the other.

---

## Contradiction 1: Signing Method

### File A: `docs/DRGREEN-API-SIGNING-KNOWLEDGE.md`
- States: **HMAC-SHA256 is correct**, secp256k1 was wrong
- Claims secp256k1 caused 401 errors
- Says the health check proved HMAC works
- Documents the WordPress reference uses HMAC

### File B: `.agent/knowledge/API_INFRASTRUCTURE.md` (lines 137-159)
- States: **secp256k1 ECDSA is correct**, HMAC-SHA256 was wrong
- Claims HMAC caused 401 errors on `/dapp/*` endpoints
- Says "Do NOT use signWithHmac() for API requests"
- Explicitly contradicts File A

### What the Code Actually Does
- `signPayload()` defaults to **secp256k1 ECDSA** (matches File B)
- HMAC is only used when `DRGREEN_USE_HMAC=true` is set (currently NOT set)
- Both signing functions exist but secp256k1 is the active path

### The Truth (Based on Evidence)
The `/strains` endpoint (non-dApp) works with HMAC. The `/dapp/*` endpoints require secp256k1 ECDSA with PKCS#8 keys. **Both methods are needed for different endpoint families.** Neither knowledge file captures this correctly.

---

## Contradiction 2: Credential Scope vs. Usage

### The 5 Credential Sets Configured

| Secret Name | Purpose | NFT Scope |
|---|---|---|
| `DRGREEN_API_KEY` / `DRGREEN_PRIVATE_KEY` | Production reads | Unknown NFT |
| `DRGREEN_ALT_API_KEY` / `DRGREEN_ALT_PRIVATE_KEY` | Alt production testing | Unknown NFT |
| `DRGREEN_STAGING_API_KEY` / `DRGREEN_STAGING_PRIVATE_KEY` | Staging env | Staging NFT |
| `DRGREEN_WRITE_API_KEY` / `DRGREEN_WRITE_PRIVATE_KEY` | Client creation + orders | Operator NFT |
| `DRGREEN_STAGING_API_URL` | Staging base URL override | N/A |

### The Mismatch
- Clients are created with `DRGREEN_WRITE_*` credentials (correct)
- Cart/order operations were using `DRGREEN_*` (production read) credentials
- The Dr. Green API enforces NFT-scope isolation: client created with Key A cannot have cart operations performed with Key B
- This causes the "Client shipping address not found" error -- the production key can READ the client but cannot WRITE to their scope

### Missing Secret: `DRGREEN_RAILWAY_*`
- `API_INFRASTRUCTURE.md` documents a "Railway" environment
- The code maps `railway` to `DRGREEN_STAGING_*` credentials (reusing staging)
- No dedicated Railway credentials exist -- this is a silent fallback, not documented

---

## Contradiction 3: Key Format

### File A says:
- Key format: "Base64-encoded raw bytes" (symmetric HMAC key)

### File B says:
- Key format: "Base64-encoded PKCS#8 PEM (EC PRIVATE KEY)" (asymmetric)

### What the Code Does
- `generateSecp256k1Signature()` attempts to Base64-decode, then checks if the result is PEM format, then extracts DER, then parses PKCS#8 to get the 32-byte private key
- `signWithHmac()` Base64-decodes and uses as raw HMAC key bytes
- The WRITE keys are likely PKCS#8 EC keys (for secp256k1)
- The production READ keys might be HMAC-compatible raw keys

This means **different credential sets may require different signing methods**, which neither document acknowledges.

---

## Recommended Fix Plan

### Step 1: Correct the Knowledge Files
Update both files to document the **dual signing reality**:
- `/strains` endpoints: HMAC-SHA256 works
- `/dapp/*` endpoints: secp256k1 ECDSA required
- Different key sets may have different key formats

### Step 2: Add Key Format Detection to Signing
The code already has partial detection (checking for `secp256k1OID` in the key). Formalize this:
- If key is PKCS#8 EC key: use secp256k1 ECDSA
- If key is raw Base64 bytes: use HMAC-SHA256
- Log which method was selected per request

### Step 3: Unify Credential Routing
Ensure ALL operations for a given client use the SAME credential set:
- `create-client` uses WRITE keys (already done)
- `get-client` for owned clients should also use WRITE keys (currently uses production READ)
- `add-to-cart`, `create-order` should use WRITE keys (recently fixed)
- `get-cart`, `get-orders` for owned resources should also use WRITE keys

### Step 4: Add Diagnostic Logging
Add a one-time startup log that reports:
- Which credentials are configured (by prefix, not value)
- What key format each credential appears to be (PKCS#8 vs raw)
- Which signing method will be used for each

### Step 5: Verify with Dr. Green Team
The fundamental question that needs answering externally:
- Are the WRITE credentials and READ credentials on different NFTs?
- Should a single credential set handle both read and write?
- What is the canonical signing method for `/dapp/*` endpoints?

---

## Technical Details

### Files to Modify
1. `docs/DRGREEN-API-SIGNING-KNOWLEDGE.md` -- Correct to document dual signing
2. `.agent/knowledge/API_INFRASTRUCTURE.md` -- Correct to document dual signing and remove contradictions
3. `supabase/functions/drgreen-proxy/index.ts` -- Route `get-client`, `get-cart`, `get-orders` through WRITE credentials when the user owns the resource
4. `.agent/knowledge/DRGREEN_API_ENDPOINTS.md` -- Add notes about which endpoints need which signing method

### Actions in the Proxy
Add these actions to `WRITE_ACTIONS`:
- `get-client` (when called by the client owner, not admin)
- `get-cart` / `get-cart-legacy`
- `get-orders` / `get-order` (when called by the client owner)

This ensures the entire client lifecycle uses the same NFT-scoped credentials.

