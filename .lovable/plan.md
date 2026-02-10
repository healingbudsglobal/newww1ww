
# Fix: Client Fetching — secp256k1 Private Key PEM Detection Bug

## Problem
The Admin Client Management page (`/admin/clients`) fails to load clients because the `generateSecp256k1Signature` function in the `drgreen-proxy` edge function cannot parse the private key. The logs show:

```
secp256k1: Using raw DER { derLength: 213 }
secp256k1: Failed to extract private key: Error: Expected SEQUENCE
```

The 213 bytes are actually PEM text (decoded from Base64), but the PEM detection check (`decodedAsText.includes('-----BEGIN')`) is failing, causing the code to treat PEM text as raw DER — which then fails to parse.

## Root Cause
In `generateSecp256k1Signature` (line ~576 of `drgreen-proxy/index.ts`), after Base64-decoding the stored secret, the function checks if the result contains `-----BEGIN`. This check is failing (possibly due to encoding edge cases or invisible characters in the decoded text), so it falls through to the raw DER path which cannot parse PEM text.

## Fix (1 file changed)

### `supabase/functions/drgreen-proxy/index.ts`

Make the PEM detection more robust by:

1. Adding a byte-level check for the PEM header (`2d2d2d2d2d` = `-----`) as a fallback to the string-based `includes` check
2. Adding explicit logging when PEM is detected vs not detected, including the first 30 characters of the decoded text for debugging
3. If both PEM detection methods fail AND the decoded length matches typical PEM text size (150-500 bytes), attempt PEM extraction anyway as a last resort

Specifically, in the `generateSecp256k1Signature` function around line 576:

```typescript
// Current code (failing):
if (decodedAsText.includes('-----BEGIN')) {
  // PEM branch...
} else {
  keyDerBytes = decodedSecretBytes;  // treats PEM text as DER
}

// Fixed code:
const isPem = decodedAsText.includes('-----BEGIN') || 
              decodedAsText.includes('BEGIN') ||
              // Byte-level fallback: check for "-----" (0x2D repeated)
              (decodedSecretBytes[0] === 0x2D && decodedSecretBytes[1] === 0x2D);

if (isPem) {
  // Extract PEM body and decode to DER...
} else {
  keyDerBytes = decodedSecretBytes;
}
```

Also add a final fallback in `extractSecp256k1PrivateKey`: if DER parsing fails and the input looks like ASCII text (all bytes < 128), log a clear error indicating PEM was not detected.

## Expected Outcome
- Admin Client Management page will successfully fetch and display clients from the Dr. Green API
- All `/dapp/*` endpoints (clients, orders, carts, NFTs) will work correctly
- Strains endpoint (which may work via a different timing/caching scenario) continues to work

## Testing
After deployment, verify:
1. Navigate to `/admin/clients` — clients should load
2. Click "Refresh" — should show updated data
3. Test client search by email
4. Verify summary counts (Pending/Verified/Rejected) appear
