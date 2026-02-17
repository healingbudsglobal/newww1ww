

## Fix Order Flow, Currency Conversion, and Site-Wide Consistency

### What the Screenshots Show

The ricardo.drgreennft.com screenshots show the legacy WordPress store's basket page. It has CSP errors and 404s on its own manifest.json -- those are their WordPress issues. The key takeaway is that the Dr. Green cart API expects:
1. Client has a valid shipping address saved on the API side
2. Cart items are added via `POST /dapp/carts`
3. Order is created from the cart via `POST /dapp/orders`

Our code follows this flow correctly, but the PATCH to update shipping fails silently, causing downstream 409s.

### Changes (4 files)

**1. `supabase/functions/drgreen-proxy/index.ts`** -- Fix shipping update with PUT fallback

The PATCH at Step 1 is failing but treated as non-blocking. Fix:
- After PATCH fails, retry with PUT method as a fallback
- Log the full PATCH error response body for debugging
- If both PATCH and PUT fail, try updating shipping as part of the cart payload
- Add the shipping country info based on the product region (ZAF) instead of defaulting to empty

Specific changes in the `create-order` case (around lines 3017-3046):
- After PATCH fails, add a PUT retry to `/dapp/clients/{clientId}` with the same shipping payload
- Log the response body from the PATCH failure (currently only logs status and truncated error)
- Before Step 2 cart add, if shipping was not verified, attempt to include shipping in the cart/order payload

**2. `src/components/shop/ProductDetail.tsx`** -- Add EUR-to-local conversion

Currently `useShop()` already gives `countryCode` but not `convertFromEUR`. Fix:
- Line 19: add `convertFromEUR` to the destructured values from `useShop()`
- Line 90: `formatPrice(product.retailPrice, countryCode)` becomes `formatPrice(convertFromEUR(product.retailPrice), countryCode)`
- Line 192: `formatPrice(product.retailPrice * quantity, countryCode)` becomes `formatPrice(convertFromEUR(product.retailPrice * quantity), countryCode)`

**3. `src/components/shop/OrdersTable.tsx`** -- Add EUR-to-local conversion

Currently uses raw EUR amounts with the stored `country_code` which defaults to PT. Fix:
- Add `import { useShop } from '@/context/ShopContext';`
- Inside component: `const { convertFromEUR, countryCode } = useShop();`
- Line 119: `formatPrice(order.total_amount, order.country_code || 'ZA')` becomes `formatPrice(convertFromEUR(order.total_amount), countryCode)`
- Line 148: same change

**4. `src/pages/Checkout.tsx`** -- Use domain-based country code for currency

- Line 287: `const clientCountry = drGreenClient.country_code || countryCode || 'PT'` -- the fallback should be `'ZA'` not `'PT'` since the Lovable domain maps to ZA
- Line 328: same pattern -- ensure `countryCode` (from `useShop`, domain-based) is used instead of `drGreenClient.country_code`
- Line 390: same in the fallback block

### Order Flow Fix Detail

The shipping PATCH failure chain:
1. PATCH `/dapp/clients/{clientId}` with `{shipping: {...}}` -- fails (API returns error)
2. Cart add fails with "shipping address not found"
3. Direct order fallback also fails because client still has no shipping

The fix adds a PUT retry after PATCH failure, and if both fail, the direct order fallback payload already includes `shippingAddress` which should bypass the client-level shipping requirement. The issue is that the direct order endpoint may also require client-level shipping. In that case, we need to verify whether the API supports inline shipping on orders.

### Summary

- 2 frontend files get `convertFromEUR` wrapper for correct ZAR display
- 1 frontend file gets corrected country code fallback (ZA not PT)
- 1 edge function gets PUT retry for shipping and better error logging
- All prices across the site will display in the correct local currency
