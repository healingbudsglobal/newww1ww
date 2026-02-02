
# Fix: Dr. Green API Key Format Handling

## Problem Identified

The Dr. Green credentials you provided are in **PEM format wrapped in Base64**:
- `ApiKey` decodes to: `-----BEGIN PUBLIC KEY-----\nMFYwEAYHKoZIzj0CAQYF...-----END PUBLIC KEY-----`
- `secretKey` decodes to: `-----BEGIN PRIVATE KEY-----\nMIGE...-----END PRIVATE KEY-----`

The current `drgreen-proxy` code sends the `DRGREEN_API_KEY` secret **as-is** to the `x-auth-apikey` header. However, the Dr. Green API rejects this with a `401 Unauthorized` because it's receiving the full Base64-encoded PEM instead of the expected format.

## Root Cause Analysis

The Dr. Green API documentation states:
> `x-auth-apikey` Type: String (Base64-encoded)

This is ambiguous - it could mean:
1. The **PEM content** Base64-encoded (what we're sending)
2. The **raw public key bytes** Base64-encoded (extracted from PEM)
3. The **PEM body** (just the Base64 part between `-----BEGIN` and `-----END`)

The private key signing is working correctly (the code properly extracts the 32-byte secp256k1 key from the PKCS#8 DER structure). The API key likely needs similar extraction.

## Solution: Extract Public Key from PEM for API Key Header

Modify `drgreen-proxy/index.ts` to detect when `DRGREEN_API_KEY` is Base64-encoded PEM and extract just the PEM body (the inner Base64 content) to send in the header.

### Technical Details

**File: `supabase/functions/drgreen-proxy/index.ts`**

Add logic in `drGreenRequestBody` and `drGreenRequest` functions:

```typescript
// Helper to extract PEM body from Base64-encoded PEM
function extractPemBody(base64EncodedPem: string): string {
  try {
    // Decode Base64 to get PEM text
    const pemText = new TextDecoder().decode(base64ToBytes(base64EncodedPem));
    
    if (pemText.includes('-----BEGIN')) {
      // Extract just the Base64 content between headers
      const pemBody = pemText
        .replace(/-----BEGIN [A-Z0-9 ]+-----/g, '')
        .replace(/-----END [A-Z0-9 ]+-----/g, '')
        .replace(/[\r\n\s]/g, '')
        .trim();
      return pemBody;
    }
    
    // Not PEM format, return as-is
    return base64EncodedPem;
  } catch {
    // If decoding fails, return as-is
    return base64EncodedPem;
  }
}
```

Then update the header assignment:
```typescript
// Before: 
// const encodedApiKey = apiKey;

// After:
const encodedApiKey = extractPemBody(apiKey);
```

This will:
1. Detect if the stored API key is Base64-encoded PEM
2. Extract just the inner Base64 key content
3. Send that to the `x-auth-apikey` header

### Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/drgreen-proxy/index.ts` | Add `extractPemBody()` helper and use it when constructing `x-auth-apikey` header |

### Implementation Steps

1. Add `extractPemBody()` helper function near line 200 (with other helper functions)
2. Modify `drGreenRequestBody()` function (around line 887) to use `extractPemBody(apiKey)` instead of `apiKey` directly
3. Modify `drGreenRequest()` function (similar logic for GET requests) if it exists with the same pattern
4. Add logging to confirm the extracted key format for debugging
5. Deploy and test the checkout flow

### Expected Outcome

After this change:
- The `x-auth-apikey` header will contain `MFYwEAYHKoZIzj0CAQYF...` (raw Base64 key)
- Instead of `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0K...` (Base64-encoded PEM)
- The Dr. Green API should accept the credentials and allow order creation

### Rollback Plan

If this doesn't work, the API key format can be reverted by changing `extractPemBody(apiKey)` back to `apiKey`. The secrets don't need to change.
