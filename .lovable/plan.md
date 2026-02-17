

## Fix Country Code Persistence and Verify Order Flow

### Problem 1: Country Code Stuck on "PT"

**Root Cause Traced:**

The Dr. Green API returns `phoneCountryCode: "PT"` for Benjamin (his phone registration country), but does NOT return a top-level `countryCode` field. The shipping address shows `country: "South Africa"`.

The bug chain:
1. Proxy `get-client-by-auth-email` (line 3584): `countryCode: foundClient.countryCode || foundClient.country_code || null` -- both are `undefined` on the API response, so returns `null`
2. ShopContext (line 212): `country_code: data.countryCode || 'PT'` -- `null || 'PT'` = `'PT'`
3. Every time Benjamin logs in, auto-discovery re-upserts `country_code = 'PT'`, overwriting any manual fix

**Three fixes needed:**

**Fix 1: `supabase/functions/drgreen-proxy/index.ts` (line 3584)**

Derive country from the client's **shipping address**, not from `phoneCountryCode`:

```
countryCode: foundClient.shipping?.countryCode 
  || foundClient.shippings?.[0]?.countryCode 
  || getCountryCodeFromName(foundClient.shipping?.country || foundClient.shippings?.[0]?.country)
  || foundClient.phoneCountryCode 
  || null,
```

For Benjamin, `shipping.country = "South Africa"` resolves to `ZA` via `getCountryCodeFromName`.

**Fix 2: `src/context/ShopContext.tsx` (line 212)**

Change the fallback from `'PT'` to use the domain-derived country:

```typescript
country_code: data.countryCode || getCountryFromDomain(),
```

This ensures if the proxy returns `null`, the frontend falls back to `ZA` (for Lovable/global domains) instead of hardcoded `PT`.

**Fix 3: Multiple files with hardcoded `'PT'` fallbacks**

These files also hardcode `'PT'` as the default country_code and need updating to `'ZA'`:

- `src/hooks/useDrGreenClientSync.ts` (line 277): `country_code: 'PT'` should be `country_code: status.countryCode || 'ZA'`
- `src/components/shop/ClientOnboarding.tsx` (lines 577, 817): `country_code: formData.address?.country || 'PT'` should use `|| 'ZA'`
- `src/components/admin/AdminClientManager.tsx` (line 121): `country_code: 'PT'` should derive from `client.shipping?.country` or default `'ZA'`
- `src/pages/AdminDashboard.tsx` (line 244): `country_code: 'PT'` should be `'ZA'`
- `src/hooks/useProducts.ts` (line 115): `countryCode: string = 'PT'` should be `= 'ZA'`
- `src/lib/drgreenApi.ts` (lines 364, 372): phone parsing defaults from `'PT'` to `'ZA'`
- `src/hooks/useClientResync.ts` (line 65): `|| 'PT'` to `|| 'ZA'`

**Fix 4: Database correction**

Run an UPDATE to fix Benjamin's record immediately (the auto-sync will no longer overwrite it after the code fix):

```sql
UPDATE drgreen_clients 
SET country_code = 'ZA' 
WHERE drgreen_client_id = 'a4357132-7e8c-4c8a-b005-6f818b3f173e';
```

Also fix the 4 existing orders that show `country_code: 'PT'` and `currency: 'EUR'`:

```sql
UPDATE drgreen_orders 
SET country_code = 'ZA', currency = 'ZAR' 
WHERE client_id = 'a4357132-7e8c-4c8a-b005-6f818b3f173e' 
  AND country_code = 'PT';
```

---

### Problem 2: Orders Still Showing EUR

This is a direct consequence of Problem 1. The Checkout flow reads `drGreenClient.country_code` (which is `'PT'`) and calls `getCurrencyForCountry('PT')` which returns `'EUR'`. Once the country code is fixed to `ZA`, new orders will correctly use `ZAR`.

The existing 4 orders will be corrected by the database UPDATE above.

---

### Problem 3: Are Orders Working Now?

The order flow code was fixed in the previous deployment (individual cart items, correct DELETE path). However, **no new test orders have been placed since the fix was deployed**, so we cannot confirm from logs. The code changes are structurally correct per the Postman spec:

- Cart clear: `DELETE /dapp/carts/client/{clientId}` (correct)
- Cart add: individual `POST /dapp/carts` with `{ clientId, strainId, quantity }` (correct)
- Order create: `POST /dapp/orders` with `{ clientId }` (correct)

The plan includes a test step after deployment to verify.

---

### Files Changed Summary

| File | Change |
|------|--------|
| `supabase/functions/drgreen-proxy/index.ts` | Derive `countryCode` from shipping address in `get-client-by-auth-email` response |
| `src/context/ShopContext.tsx` | Change `'PT'` fallback to `getCountryFromDomain()` on line 212 |
| `src/hooks/useDrGreenClientSync.ts` | Change `'PT'` default to `'ZA'` |
| `src/components/shop/ClientOnboarding.tsx` | Change `'PT'` defaults to `'ZA'` (2 locations) |
| `src/components/admin/AdminClientManager.tsx` | Change `'PT'` default to `'ZA'` |
| `src/pages/AdminDashboard.tsx` | Change `'PT'` default to `'ZA'` |
| `src/hooks/useProducts.ts` | Change default param from `'PT'` to `'ZA'` |
| `src/lib/drgreenApi.ts` | Change phone parsing defaults from `'PT'` to `'ZA'` |
| `src/hooks/useClientResync.ts` | Change `'PT'` fallback to `'ZA'` |
| Database migration | Fix Benjamin's `country_code` and existing order currencies |

Total: 9 files modified, 1 database migration.

