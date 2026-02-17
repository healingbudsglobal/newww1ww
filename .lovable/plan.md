
## Fix Order Creation: Wrong Cart Clear Endpoint Path

### Root Cause

All order creation attempts are failing with **409 Conflict** (and one **400 Bad Request**) because the cart is never actually being cleared before adding new items.

Inside the `create-order` action in `drgreen-proxy`, the cart clear step uses the **wrong URL path**:

```
WRONG:  DELETE /dapp/carts/client/{clientId}
RIGHT:  DELETE /dapp/carts/{clientId}
```

The extra `/client/` segment causes the Dr. Green API to either return a 404 (silently ignored) or not match the cart, so the old cart items persist. When new items are added, the API returns **409 Conflict**.

Evidence from the database -- all 5 recent orders failed:
- 4 orders: Status 409 (cart conflict due to stale cart)
- 1 order: Status 400 (likely a different payload issue after a cart happened to be empty)

### The Fix

**File: `supabase/functions/drgreen-proxy/index.ts`**

Three lines need to change -- all inside the `create-order` case. Replace `/dapp/carts/client/{clientId}` with `/dapp/carts/{clientId}` to match the correct Postman endpoint and the working `empty-cart` action:

1. **Line 3127** (Step 1.5 -- pre-clear):
   ```
   - await drGreenRequest(`/dapp/carts/client/${clientId}`, "DELETE", ...)
   + await drGreenRequest(`/dapp/carts/${clientId}`, "DELETE", ...)
   ```

2. **Line 3188** (Step 2 -- 409 retry clear):
   ```
   - await drGreenRequest(`/dapp/carts/client/${clientId}`, "DELETE", ...)
   + await drGreenRequest(`/dapp/carts/${clientId}`, "DELETE", ...)
   ```

3. **Line 3293** (Fallback -- final retry clear):
   ```
   - await drGreenRequest(`/dapp/carts/client/${clientId}`, "DELETE", ...)
   + await drGreenRequest(`/dapp/carts/${clientId}`, "DELETE", ...)
   ```

### Why This Is The Issue

The `empty-cart` standalone action (line 2909) already uses the correct path `DELETE /dapp/carts/{cartId}`. But whoever wrote the `create-order` flow used a different path with `/client/` in it. The Dr. Green API does not recognize this path, so the cart is never cleared, and every subsequent cart add gets a 409.

### After the Fix

- Cart will be properly cleared before adding new items
- Items will be added without 409 conflicts
- Order creation from cart (`POST /dapp/orders`) will succeed
- The edge function will be redeployed automatically
