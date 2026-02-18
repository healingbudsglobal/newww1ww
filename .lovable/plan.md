

## Full Test Report + Action Plan: varseainc@gmail.com Checkout

### Current State — What the Data Shows

The patient is fully eligible:
- `is_kyc_verified: true`
- `admin_approval: VERIFIED`
- `drgreen_client_id: a4357132-7e8c-4c8a-b005-6f818b3f173e`
- Country: ZA (maps to ZAF)

Shipping address is stored locally:
```
123 Rivonia Road, Sandton, Sandton, South Africa, ZA, 2148
```

All 6 historical orders are `LOCAL-*` fallbacks — no real Dr. Green order ID was ever returned.

### Root Cause Analysis — Why Orders Are Still Failing

The 409 errors (stale cart) are now fixed by the cart clear path correction. But there is a second, separate problem causing the **Status 400** errors which appeared AFTER the 409s stopped.

Looking at the most recent order (`ord_mlq157ea_2zmc` — Status 400), the shipping address stored locally uses:

```
countryCode: "ZA"  (Alpha-2)
```

But the Dr. Green API for shipping updates and cart operations requires:

```
countryCode: "ZAF"  (Alpha-3)
```

This is confirmed by the successful strain sync which uses `ZAF` and the order records themselves — the two most recent orders show `countryCode: ZAF` in `drgreen_orders.shipping_address` but the client record in `drgreen_clients` still has `countryCode: ZA` (Alpha-2). The proxy's shipping update step sends the raw stored value to the Dr. Green API, which rejects it with 400 because it does not recognise `ZA` as a valid `countryCode`.

There is also a second issue: the `country_code` column on `drgreen_clients` is stored as `ZA` but the Dr. Green API's client shipping update endpoint expects `ZAF`. The proxy must normalise this before sending.

### The Three Fixes Required

#### Fix 1 — Normalise Alpha-2 to Alpha-3 before shipping update (drgreen-proxy)

In the `create-order` Step 1 (shipping update), the proxy reads `addr.countryCode` from the stored shipping address. When that value is `ZA` (Alpha-2), it must be converted to `ZAF` (Alpha-3) before the API call.

The proxy already has a `toAlpha3` helper function. It just needs to be applied at the point where the shipping payload is constructed for the Dr. Green API call.

**File: `supabase/functions/drgreen-proxy/index.ts`**

In the Step 1 shipping update block (around line 3060–3105), wrap the `countryCode` field:
```typescript
// BEFORE (sends raw value that may be Alpha-2):
countryCode: addr.countryCode || '',

// AFTER (always sends Alpha-3):
countryCode: toAlpha3(addr.countryCode) || toAlpha3(addr.country) || 'ZAF',
```

#### Fix 2 — Normalise Alpha-2 to Alpha-3 in the client record (drgreen_clients table)

The `drgreen_clients` record for this patient has `country_code: ZA`. This should be `ZAF` to be consistent with the API. Fix the stored value via a targeted update:

```sql
UPDATE drgreen_clients 
SET country_code = 'ZAF', updated_at = now()
WHERE email = 'varseainc@gmail.com' 
  AND country_code = 'ZA';
```

Also fix any other ZA entries that are Alpha-2:
```sql
UPDATE drgreen_clients 
SET country_code = 'ZAF', updated_at = now()
WHERE country_code = 'ZA';
```

#### Fix 3 — Normalise in the ShopContext / checkout flow (frontend)

The `ShopContext` passes the country code from `drgreen_clients.country_code` into the checkout payload. If it is stored as `ZA`, the frontend also sends `ZA` to the proxy in `orderData.shippingAddress.countryCode`. The proxy should normalise ALL incoming country codes from the frontend before constructing any API payload.

**File: `supabase/functions/drgreen-proxy/index.ts`**

In the `create-order` action, when extracting the shipping address from `orderData`, normalise `countryCode`:
```typescript
const countryCode = toAlpha3(orderData.shippingAddress?.countryCode || addr.countryCode || '');
```

### Why the `LOCAL-20260217-6OF4` Order Has No `sync_error`

One order has no error recorded but still has a LOCAL fallback ID. This is because the Dr. Green API returned a successful response for the cart/order step but the response parsing failed to extract the real order ID — likely because the response shape at that time was different. This order was not actually placed on the Dr. Green side and is safe to ignore.

### Live Test Plan (After Fixes Applied)

These steps confirm the fix works:

1. Apply the two code fixes and the DB migration (above).
2. Deploy the updated proxy.
3. Log in as varseainc@gmail.com on the shop.
4. Add "Candy Pave" (strainId: `25c9bdc7-0e4e-4572-b089-37b2ca60e965`) to cart.
5. Proceed through checkout.
6. Watch edge function logs for:
   - Step 1: Shipping update returns `200` (not 400)
   - Step 1.5: Cart clear returns `200` or `404` (not an error)
   - Step 2: Cart add returns `201`
   - Step 3: Order creation returns `201` with a real `orderId` (not LOCAL-)
7. Check `drgreen_orders` table — the new row should have a real `drgreen_order_id` (not `LOCAL-*`) and `status: PENDING`.

### Summary of Changes

| # | File | Change |
|---|------|--------|
| 1 | `supabase/functions/drgreen-proxy/index.ts` | Apply `toAlpha3()` to `countryCode` in shipping update payload construction (Step 1 of create-order) |
| 2 | `supabase/functions/drgreen-proxy/index.ts` | Apply `toAlpha3()` to incoming `orderData.shippingAddress.countryCode` at start of create-order |
| 3 | Database migration | `UPDATE drgreen_clients SET country_code = 'ZAF' WHERE country_code = 'ZA'` |

The edge function will be redeployed automatically after code changes. The DB migration will run immediately after approval.

