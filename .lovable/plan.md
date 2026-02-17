

## Fix AnimatePresence Crash and Currency Display

### Issue 1: AnimatePresence Runtime Error

The import on line 12 of `NavigationMenu.tsx` is correct (`import { motion, AnimatePresence } from "framer-motion"`), but the browser is throwing `ReferenceError: AnimatePresence is not defined`. This is a stale HMR (Hot Module Replacement) cache issue. To resolve it reliably, a trivial edit (e.g. adding a comment) will force a full re-evaluation of the module.

### Issue 2: Currency Showing EUR Instead of ZAR

Two root causes:

**A. OrderDetail.tsx displays raw EUR prices without conversion**
- Line 259: `formatPrice(item.unit_price, cc)` -- uses raw EUR amount from the API
- Line 271: `formatPrice(order.total_amount, cc)` -- same issue
- These need to use `convertFromEUR()` from ShopContext before formatting

**B. Order `country_code` may be stored as `'PT'` (Portugal default)**
- The `drgreen_clients` table defaults `country_code` to `'PT'`, so orders created from that client inherit `'PT'`
- On the Lovable preview domain, the ShopContext correctly determines `'ZA'`, but the **stored order** has `'PT'`
- Fix: Use the ShopContext `countryCode` (domain-based) rather than the order's stored `country_code` for display formatting

### Files to Change

**1. `src/components/NavigationMenu.tsx`**
- Add a harmless comment to force module re-evaluation and clear the stale cache

**2. `src/pages/OrderDetail.tsx`**
- Import `useShop` from ShopContext
- Use `convertFromEUR` and the domain-based `countryCode` for all price formatting
- Change all `formatPrice(amount, cc)` calls to `formatPrice(convertFromEUR(amount), countryCode)`

### Technical Details

```text
OrderDetail.tsx changes:
- Add import: import { useShop } from '@/context/ShopContext';
- Inside component: const { convertFromEUR, countryCode } = useShop();
- Line 259: formatPrice(item.unit_price, cc) -> formatPrice(convertFromEUR(item.unit_price), countryCode)
- Line 263: formatPrice(item.quantity * item.unit_price, cc) -> formatPrice(convertFromEUR(item.quantity * item.unit_price), countryCode)
- Line 271: formatPrice(order.total_amount, cc) -> formatPrice(convertFromEUR(order.total_amount), countryCode)
- Remove unused `cc` variable or keep for non-price uses
```

This ensures all prices display in ZAR (or whatever currency matches the current domain) across the entire app, not just the shop page.

