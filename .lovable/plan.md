
## Root Cause: Dr. Green API Breaking Change — Cart Payload Format

### What We Know (Confirmed via Live API Test)

The live Dr. Green `/dapp/carts` POST endpoint **rejects** our current payload format. The upstream error from the API itself is:

```
"items must contain at least 1 elements, clientCartId must be a UUID, clientCartId must be a string, clientCartId should not be empty"
```

The current proxy sends this (flat format):
```json
{ "clientId": "uuid", "strainId": "uuid", "quantity": 1 }
```

The Dr. Green API now expects this (new batch format):
```json
{ "clientCartId": "uuid", "items": [{ "strainId": "uuid", "quantity": 1 }] }
```

The country code fixes worked — the latest failed order `LOCAL-20260218-AHI2` already shows `countryCode: ZAF` in the stored shipping address. The failure is 100% in Step 2 (cart add) due to this payload mismatch.

Additionally, the empty-cart endpoint in the full API reference document says:
```
DELETE /dapp/carts/client/:clientId
```
But the proxy uses:
```
DELETE /dapp/carts/:clientId
```
This also needs to be corrected in the create-order flow to ensure the pre-clear works reliably.

---

### The Two Fixes Required

#### Fix 1 — Update cart POST payload to new format (CRITICAL — blocks all checkout)

In `supabase/functions/drgreen-proxy/index.ts`, inside the `create-order` Step 2 loop, replace the flat per-item POST with the new batch format. The `clientCartId` is a UUID generated once per checkout, not the `clientId`.

**Current code (lines ~3174–3178):**
```typescript
const itemPayload = {
  clientId: clientId,
  strainId: item.strainId,
  quantity: item.quantity,
};
```

**New code — generate a UUID `clientCartId` before the loop and use batch format:**
```typescript
// Generate a fresh UUID for this cart session
const clientCartId = crypto.randomUUID();

// Inside the loop, build batch payload:
const cartPayload = {
  clientCartId: clientCartId,
  items: cartItems.map(item => ({
    strainId: item.strainId,
    quantity: item.quantity,
  })),
};
// Single POST call with all items, NOT one-per-item
const cartResponse = await drGreenRequestBody("/dapp/carts", "POST", cartPayload, true, adminEnvConfig);
```

This also simplifies the loop — instead of calling once per item, a single POST with `items[]` batch is sent.

The fallback retry block (lines ~3312–3330) also uses the old format and must be updated to match.

#### Fix 2 — Correct the empty-cart DELETE path (prevents stale cart conflicts)

The current cart-clear in Step 1.5 uses:
```
DELETE /dapp/carts/${clientId}
```

The API reference document confirms the correct path is:
```
DELETE /dapp/carts/client/${clientId}
```

Update line 3140 (and the fallback on line 3201 and 3306) in `supabase/functions/drgreen-proxy/index.ts`:
```typescript
// BEFORE:
await drGreenRequest(`/dapp/carts/${clientId}`, "DELETE", undefined, adminEnvConfig);

// AFTER:
await drGreenRequest(`/dapp/carts/client/${clientId}`, "DELETE", undefined, adminEnvConfig);
```

Also update the `empty-cart` standalone action at line 2919 for consistency.

---

### Technical Implementation Plan

**File: `supabase/functions/drgreen-proxy/index.ts`**

Changes needed at these specific locations:

| Location | Change |
|----------|--------|
| Line ~3140 | Cart clear Step 1.5: `DELETE /dapp/carts/${clientId}` → `DELETE /dapp/carts/client/${clientId}` |
| Lines ~3152–3244 | Step 2: Replace per-item loop with single batch POST using `{ clientCartId, items[] }` |
| Lines ~3200–3207 | Step 2 inner 409-retry clear: update DELETE path |
| Lines ~3296–3334 | Fallback retry block: replace per-item loop with batch POST and fix DELETE path |
| Line ~2919 | Standalone `empty-cart` action: fix DELETE path |

**No database changes required.** The fix is entirely in the edge function.

---

### Expected Result After Fix

The create-order flow will:

1. Step 1: PATCH `/dapp/clients/{clientId}` with shipping — expected **200** (already working)
2. Step 1.5: DELETE `/dapp/carts/client/{clientId}` — expected **200 or 404** (path corrected)
3. Step 2: Single POST `/dapp/carts` with `{ clientCartId: uuid, items: [...] }` — expected **201**
4. Step 3: POST `/dapp/orders` with `{ clientId }` — expected **201** with a real `orderId`

The resulting `drgreen_orders` row for `varseainc@gmail.com` will have a real `drgreen_order_id` (not `LOCAL-`).

---

### Verification Steps After Deployment

1. Deploy updated `drgreen-proxy`.
2. Run a direct curl test via the proxy with the new cart format to confirm **201** response.
3. Have `varseainc@gmail.com` attempt checkout with BlockBerry strain.
4. Check `drgreen_orders` table — confirm new row has a real `drgreen_order_id`.
5. Check edge function logs — confirm Step 2 shows `201` and Step 3 shows `201`.
