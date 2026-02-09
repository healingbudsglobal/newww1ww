

# Fix Currency Display on Orders Page

## Problem

Line 125 of `src/components/shop/OrdersTable.tsx` hardcodes the Euro symbol:
```
€{order.total_amount.toFixed(2)}
```

Orders already store `currency` (e.g. "ZAR", "EUR", "GBP") and `country_code` (e.g. "ZA", "PT", "GB") from checkout. These fields are just not being used for display.

## Fix

### `src/components/shop/OrdersTable.tsx`

1. Import `formatPrice` from `src/lib/currency.ts`
2. Add `currency` and `country_code` to the `Order` interface
3. Replace the hardcoded `€{order.total_amount.toFixed(2)}` with:
   ```
   formatPrice(order.total_amount, order.country_code || 'ZA')
   ```
   This uses the existing currency utility which handles locale-aware formatting with the correct symbol (R for ZAR, GBP for pounds, EUR for euros, etc.)

4. Also format the `unit_price` if shown anywhere in expanded order details

### Fallback behavior

- If `country_code` is missing/null on older orders, defaults to `'ZA'` (South African Rand) since Dr. Green API uses ZAR as base currency
- The `formatPrice` function already handles invalid/missing country codes gracefully

## Scope

One file changed: `src/components/shop/OrdersTable.tsx` -- approximately 3 lines modified.

