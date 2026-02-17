

## All Pending Fixes — Combined Implementation

### 1. Header crash fix: Add `useShopSafe` hook

**File: `src/context/ShopContext.tsx`** (after line 555)

Add a non-throwing variant of `useShop`:

```typescript
export function useShopSafe() {
  const context = useContext(ShopContext);
  return context ?? null;
}
```

**File: `src/layout/Header.tsx`** (line 49 area)

Replace:
```typescript
import { useShop } from "@/context/ShopContext";
// ...
const { isEligible, drGreenClient, isLoading: shopLoading } = useShop();
```

With:
```typescript
import { useShopSafe } from "@/context/ShopContext";
// ...
const shop = useShopSafe();
const isEligible = shop?.isEligible ?? false;
const drGreenClient = shop?.drGreenClient ?? null;
const shopLoading = shop?.isLoading ?? false;
```

This prevents the entire app from crashing if ShopProvider is temporarily unavailable during HMR or on non-shop pages.

---

### 2. Fix `add-to-cart` payload format

**File: `supabase/functions/drgreen-proxy/index.ts`** (lines 2862-2874)

Replace the legacy nested format:
```typescript
const cartPayload = {
  clientCartId: clientId,
  items: [{ strainId: cartData.strainId, quantity: cartData.quantity }]
};
```

With the flat format that matches the working `create-order` flow:
```typescript
const cartPayload = {
  clientId: clientId,
  strainId: cartData.strainId,
  quantity: cartData.quantity,
};
```

---

### 3. Cart clear path fix

Already applied in the last diff -- no further changes needed. The three instances of `/dapp/carts/client/${clientId}` have been corrected to `/dapp/carts/${clientId}`.

---

### Summary

| File | Change |
|------|--------|
| `src/context/ShopContext.tsx` | Add `useShopSafe` export |
| `src/layout/Header.tsx` | Use `useShopSafe` instead of `useShop` |
| `supabase/functions/drgreen-proxy/index.ts` | Fix `add-to-cart` payload to flat format |

Edge function will be redeployed automatically after the proxy change.

