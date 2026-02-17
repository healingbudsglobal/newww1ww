

## Fix Currency Conversion Bug

### Root Cause

The `convertPrice` function in `useExchangeRates.ts` passes its `fromCurrency` and `toCurrency` arguments through `getCurrency()`, which is designed for **country codes** (like 'ZA' to 'ZAR'), not currency codes. When `convertFromEUR` passes `'EUR'` as the source currency:

1. `getCurrency('EUR')` looks up 'EUR' in the country registry
2. 'EUR' is not a country code, so it falls back to the default country 'ZA'
3. Returns 'ZAR' instead of 'EUR'
4. Both `from` and `to` end up as 'ZAR', so the function returns the amount unchanged
5. A price of EUR 10.00 displays as R 10,00 instead of approximately R 189

### The Fix

**File: `src/hooks/useExchangeRates.ts` (lines 75-77)**

The `convertPrice` function needs to check whether the input is already a valid currency code before passing it through `getCurrency()`. If the rates map already contains the input as a key (e.g. 'EUR', 'GBP', 'USD'), use it directly. Only call `getCurrency()` when the input looks like a country code.

```
Current (broken):
  const from = getCurrency(fromCurrency) || fromCurrency;
  const to = getCurrency(toCurrency) || toCurrency;

Fixed:
  const currentRates = rates || FALLBACK_RATES;
  const from = currentRates[fromCurrency] !== undefined ? fromCurrency : (getCurrency(fromCurrency) || fromCurrency);
  const to = currentRates[toCurrency] !== undefined ? toCurrency : (getCurrency(toCurrency) || toCurrency);
```

This way:
- `'EUR'` is found in the rates map, so it's used directly as a currency code
- `'ZA'` is NOT in the rates map, so it goes through `getCurrency('ZA')` which correctly returns `'ZAR'`

**Same fix needed in `src/lib/currency.ts` (lines 28-33)** — the `convertPrice` function there has the same pattern and the same bug.

### Impact

This fix affects all price displays across the platform:
- Shop product listings
- Cart totals
- Checkout summary
- Order history
- Order detail pages
- Featured strains on the homepage

All prices currently show the raw EUR value with a ZAR symbol. After the fix, they will show the correctly converted ZAR amount (approximately 19x the current displayed values based on live exchange rates).

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useExchangeRates.ts` | Fix `convertPrice` to handle currency codes directly, not just country codes |
| `src/lib/currency.ts` | Same fix for the standalone `convertPrice` function |

Total: 2 files, minimal changes (2-3 lines each).

