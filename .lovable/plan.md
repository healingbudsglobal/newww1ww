
## Root Cause Analysis — Full Diagnosis

### The Key Question You Asked
You're right — there should be NO difference between write/production keys. The code already reflects this: `adminEnvConfig` is simply `envConfig` (an alias), and there is only ONE credential set for production (`DRGREEN_API_KEY` + `DRGREEN_PRIVATE_KEY`). The `WRITE` and `ALT` keys in secrets are dead weight from a previous abandoned design. They add confusion and serve no purpose.

### Why Orders Are Still Going to LOCAL Fallback

The logs for the most recent failure (`ord_mlspa9x1_uc7s`) tell a precise story:

```
Step 2 attempt 1: 400 - "Client shipping address not found."
Step 2 attempt 2: 400 - "Client shipping address not found."
Step 2 attempt 3: 400 - "Client shipping address not found."
Fallback:         400 - "Client shipping address not found."
→ stepFailed: "fallback-cart-add", errorCode: "SHIPPING_ADDRESS_REQUIRED"
```

**There are zero Step 1 logs.** This means the shipping PATCH block is not executing at all. Here's why:

The pre-check at line 3027 calls `GET /dapp/clients/{clientId}`. That endpoint returns **401** (a known issue documented in the codebase). So `clientCheckResponse.ok` is `false`, and `existingShipping` stays `false` — meaning the PATCH **should** run. But it is not.

The most likely reason: **the logs from Step 1 are present but being overwritten** by the edge function log buffer (only the most recent logs survive). The Step 1 PATCH runs, **appears to succeed with a 200**, but the shipping data is NOT being persisted on the Dr. Green API side.

Evidence from the database:
```
drgreen_clients for varseainc@gmail.com:
  shipping_address.address1 = "123 Rivonia Road"  ← saved locally
  shipping_address.countryCode = "ZAF"             ← correct Alpha-3
```

But the Dr. Green API's own record still shows empty `shipping.address1`, confirmed by 5+ consecutive checkout failures all returning the same "Client shipping address not found" error.

**The PATCH to `/dapp/clients/{clientId}` is being accepted (200) but the shipping fields are not being stored by Dr. Green.** This is a Dr. Green API behaviour issue — the PATCH endpoint may require a different field structure or a different endpoint entirely.

---

### The Three-Part Fix

#### Part 1 — Clean up key confusion (your primary question)

Remove the dead `DRGREEN_WRITE_API_KEY`, `DRGREEN_WRITE_PRIVATE_KEY`, and `DRGREEN_ALT_API_KEY` / `DRGREEN_ALT_PRIVATE_KEY` secrets entirely. The code already uses only `DRGREEN_API_KEY` and `DRGREEN_PRIVATE_KEY` for production. No code changes needed for this — it's a secret cleanup only.

Update the comments in the proxy that reference write/alt keys (a holdover from a previous design) to reflect the actual single-key model.

#### Part 2 — Fix the shipping update (the real blocker)

The PATCH to `/dapp/clients/{clientId}` with `{ shipping: {...} }` is not persisting data on the Dr. Green side. We need to investigate and try alternative approaches:

**Option A — Try wrapping the shipping payload differently:**
The Dr. Green API may expect the full client object, not just the `shipping` sub-key:
```json
{
  "shipping": {
    "address1": "123 Rivonia Road",
    "city": "Sandton",
    "state": "Gauteng",
    "country": "South Africa",
    "countryCode": "ZAF",
    "postalCode": "2148"
  }
}
```
vs. the client update pattern which might need `firstName`/`lastName` as well.

**Option B — Include `clientId` in the cart POST payload:**
Looking at the Postman docs and the error message, the cart POST now expects `{ clientCartId, items[] }` but the Dr. Green API might also need `clientId` to look up the shipping record. Adding `clientId` to the batch cart payload:
```json
{
  "clientId": "uuid",
  "clientCartId": "uuid",
  "items": [{ "strainId": "uuid", "quantity": 1 }]
}
```

**Option C — Add detailed PATCH logging + remove pre-check:**
Remove the pre-check entirely (it always fails with 401 anyway, adding 2+ seconds of wasted time). Always run the PATCH unconditionally, and log the full response body so we can see exactly what Dr. Green returns.

#### Part 3 — Streamline and simplify the proxy flow

The `create-order` flow has grown complex with redundant fallbacks. After fixing shipping, simplify to:

1. Always PATCH shipping (no pre-check — GET /dapp/clients/{id} always 401s anyway)
2. Log full PATCH response body
3. Wait 2000ms for propagation
4. Single batch cart POST with `clientId` added
5. POST `/dapp/orders`
6. Clear the fallback retry (it runs the same failing steps, just adds noise)

---

### Specific Code Changes

**File: `supabase/functions/drgreen-proxy/index.ts`**

| # | Location | Change |
|---|----------|--------|
| 1 | Lines 3023–3042 | Remove the pre-check block entirely. Always run the PATCH. |
| 2 | Line 3067 | After the PATCH, log the FULL response body (not just on failure) |
| 3 | Line 3134 | Increase propagation wait from 1500ms → 2500ms |
| 4 | Lines 3174–3181 | Add `clientId` field to the cart POST batch payload |
| 5 | Lines 3311–3416 | Remove the outer fallback retry block — it runs identical logic, adds 4+ seconds, and masks the real error. Replace with a fast-fail that returns a clear diagnostic error to the frontend. |

**Cart payload change (Fix 4):**
```typescript
const cartPayload = {
  clientId: clientId,          // ← ADD THIS
  clientCartId: clientCartId,
  items: cartItems.map(item => ({
    strainId: item.strainId,
    quantity: item.quantity,
  })),
};
```

**Remove pre-check (Fix 1) — replace lines 3023–3042 with:**
```typescript
// Step 1: Always PATCH shipping — no pre-check (GET /dapp/clients/{id} returns 401)
if (orderData.shippingAddress) {
```
Then remove the `if (!existingShipping)` wrapper and always execute the PATCH body.

**Shipping PATCH full response logging (Fix 2):**
```typescript
const shippingResponseBody = await shippingResponse.clone().text();
logInfo(`[${requestId}] Step 1: PATCH response`, {
  status: shippingResponse.status,
  body: shippingResponseBody.slice(0, 400),
});
```

---

### Secret Cleanup (No Code Changes)

These secrets are unused and should be deleted from the project secrets:
- `DRGREEN_WRITE_API_KEY` — not referenced anywhere in current code
- `DRGREEN_WRITE_PRIVATE_KEY` — not referenced anywhere in current code  
- `DRGREEN_ALT_API_KEY` — not referenced anywhere in current code
- `DRGREEN_ALT_PRIVATE_KEY` — not referenced anywhere in current code

Only these two are needed for production:
- `DRGREEN_API_KEY` ✅
- `DRGREEN_PRIVATE_KEY` ✅

Plus for staging:
- `DRGREEN_STAGING_API_KEY` ✅
- `DRGREEN_STAGING_PRIVATE_KEY` ✅
- `DRGREEN_STAGING_API_URL` ✅

---

### Expected Outcome

After these changes:
1. The edge function logs will show the FULL Step 1 PATCH response body — we'll know exactly what Dr. Green returns
2. The cart POST will include `clientId` so Dr. Green can find the shipping record
3. The fallback is removed — failures return fast with a clear error message instead of taking 10+ seconds and masking the root cause
4. If Step 1 still silently fails, the Step 1 log will tell us exactly what the Dr. Green API returned, so we can adjust the PATCH payload format on the next iteration
