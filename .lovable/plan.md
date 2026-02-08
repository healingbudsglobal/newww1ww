

# Create API Knowledge and Infrastructure Documentation

## Overview
Create two new documentation files that capture the critical findings from the Dr. Green API integration debugging process. These files serve as a permanent knowledge base for this project and as transferable reference material for future projects involving similar API integrations.

## Files to Create

### File 1: `docs/DRGREEN-API-SIGNING-KNOWLEDGE.md`
A focused technical document capturing the authentication and signing mechanics that were discovered, debugged, and resolved. This is the "lessons learned" document that prevents the same debugging process from happening again.

**Contents will include:**
- The correct signing method: HMAC-SHA256 (not secp256k1 ECDSA)
- What to sign for GET requests: the query string (e.g., `orderBy=desc&take=1&page=1`)
- What to sign for POST requests: the JSON body string
- API key header format: send raw Base64 key, do not strip PEM headers
- Secret key decoding: Base64-decode to raw bytes before use as HMAC key
- The `DRGREEN_USE_HMAC` environment variable toggle for rollback
- Reference implementation in both Deno (Web Crypto API) and Node.js
- Common pitfalls and the root cause analysis of the 401 errors
- Diagnostic endpoints available for future testing

### File 2: `.agent/knowledge/API_INFRASTRUCTURE.md`
A broader infrastructure knowledge document that captures architectural decisions, multi-environment configuration, credential management, and operational patterns. Designed to be reusable across future projects.

**Contents will include:**
- Proxy architecture pattern (Frontend -> Edge Function -> External API)
- Multi-environment credential management (5 environments with distinct key pairs)
- NFT-scoped access control and its implications for client management
- Secret naming conventions and what each credential pair is used for
- Health check pattern for API connectivity monitoring
- Retry configuration with exponential backoff
- Security patterns (never expose keys client-side, sanitized logging)
- The `extractPemBody` trap and why raw keys should be used
- Write vs read credential separation
- Key rotation and migration procedures

### File 3: Update existing `docs/DRGREEN-API-INTEGRATION.md`
Update the existing integration guide to correct the outdated signing documentation that still references secp256k1 ECDSA. This prevents future developers from reimplementing the wrong approach.

**Specific corrections:**
- Update the architecture diagram to say "HMAC-SHA256" instead of "secp256k1 + SHA-256"
- Update the "Signature Generation" code example to show HMAC-SHA256
- Update the Troubleshooting section to reference the correct signing method
- Add version history entry for this fix
- Add cross-reference to the new signing knowledge document

## Technical Details

### File locations
- `docs/DRGREEN-API-SIGNING-KNOWLEDGE.md` (new)
- `.agent/knowledge/API_INFRASTRUCTURE.md` (new)
- `docs/DRGREEN-API-INTEGRATION.md` (update lines 31, 56-79, 748-753, 766-771)

### No code changes required
These are documentation-only changes. No edge functions, components, or configuration files will be modified.

### Correct Signing Reference (to be documented)

**Deno / Web Crypto API (edge functions):**
```text
1. Base64-decode the secret key to raw bytes
2. Import as HMAC key: crypto.subtle.importKey("raw", keyBytes, {name: "HMAC", hash: "SHA-256"})
3. Sign the data: crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(dataToSign))
4. Base64-encode the resulting signature
5. Send raw API key in x-auth-apikey header (no PEM stripping)
```

**Node.js (WordPress reference):**
```text
1. Create HMAC: crypto.createHmac('sha256', Buffer.from(secretKey, 'base64'))
2. Update with data: hmac.update(payload)
3. Digest as Base64: hmac.digest('base64')
4. Send raw API key in x-auth-apikey header
```

**What to sign per HTTP method:**
- GET: The query string (e.g., "orderBy=desc&take=10&page=1")
- POST/PATCH/DELETE: The JSON body string (JSON.stringify(body))
- No body/params: Empty string ""

### Key Findings to Document

| Finding | Wrong Approach | Correct Approach |
|---------|---------------|-----------------|
| Signing algorithm | secp256k1 ECDSA (asymmetric) | HMAC-SHA256 (symmetric) |
| GET payload to sign | Empty JSON object `"{}"` | Query string parameters |
| API key header | Stripped via extractPemBody() | Raw Base64 as stored |
| Secret key usage | Parse as PKCS#8, extract 32-byte EC key | Base64-decode to raw bytes for HMAC |

