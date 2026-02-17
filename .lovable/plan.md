

## Centralize Country Management -- Single Source of Truth

### The Problem

Country-related logic is currently **duplicated across 15+ files** with independent maps, inconsistent defaults, and hardcoded values. This creates bugs (like the PT/ZA issue just fixed) and makes adding a new country require edits in 10+ places.

**Current duplication inventory:**

| Data | Files where it's duplicated |
|------|---------------------------|
| Alpha-2 to Alpha-3 map | `drgreenApi.ts`, `useProducts.ts`, `useClientResync.ts`, `ShippingAddressForm.tsx`, `drgreen-proxy/index.ts` (3 times!) |
| Currency map | `currency.ts`, `useExchangeRates.ts` |
| Phone prefix map | `useGeoLocation.ts`, `drgreenApi.ts` |
| Country name map | `drgreen-proxy/index.ts`, `ClientOnboarding.tsx` |
| Default country fallback | Hardcoded as `'ZA'` or `'PT'` in 15+ locations |
| Domain-to-country map | `useGeoLocation.ts`, `ShopContext.tsx` (two separate copies) |
| Supported countries list | `useProducts.ts` (hardcoded array) |
| Locale map | `currency.ts` |

---

### The Solution: `src/lib/countries.ts`

Create **one canonical file** that exports all country-related functions and constants. Every other file imports from it. No more inline maps.

---

### What goes in `src/lib/countries.ts`

```text
+-- SUPPORTED_COUNTRIES (the array of active market codes)
+-- DEFAULT_COUNTRY = 'ZA'
+-- CountryConfig interface (merges LocationConfig + currency + API codes)
+-- COUNTRY_REGISTRY: Record<string, CountryConfig>
|     Each entry holds:
|       alpha2, alpha3, name, currency, currencySymbol, locale,
|       phonePrefix, phonePlaceholder, phonePattern,
|       postalCodeLabel, postalCodePlaceholder, postalCodePattern,
|       dateFormat, contactEmail, contactPhone, contactAddress, contactCity
+-- toAlpha3(alpha2Code) -- convert 'ZA' to 'ZAF'
+-- toAlpha2(alpha3Code) -- convert 'ZAF' to 'ZA'
+-- getCountryFromName(name) -- 'South Africa' to 'ZA'
+-- getCountryFromDomain() -- domain detection, single implementation
+-- getCurrency(countryCode) -- 'ZA' to 'ZAR'
+-- getCurrencySymbol(countryCode) -- 'ZA' to 'R'
+-- getLocale(countryCode) -- 'ZA' to 'en-ZA'
+-- getPhonePrefix(countryCode) -- 'ZA' to '+27'
+-- isSupported(countryCode) -- boolean
+-- resolveCountry(code) -- normalizes any input (alpha2, alpha3, name) to alpha2
```

---

### Migration: What changes in each file

**Files that get SIMPLIFIED (import from `countries.ts` instead of defining their own maps):**

| File | What gets removed | What gets imported |
|------|-------------------|-------------------|
| `src/lib/currency.ts` | `currencyMap`, `currencySymbols`, `getLocaleForCountry` | `getCurrency`, `getCurrencySymbol`, `getLocale`, `DEFAULT_COUNTRY` |
| `src/hooks/useGeoLocation.ts` | `locationConfigs`, `languageToCountry`, `getCountryFromDomain()` | `COUNTRY_REGISTRY`, `getCountryFromDomain`, `DEFAULT_COUNTRY` |
| `src/lib/drgreenApi.ts` | `countryCodeMap`, `toAlpha3`, `prefixToCountry` map | `toAlpha3`, `getCountryFromPhone` |
| `src/hooks/useProducts.ts` | `countryCodeMap`, `SUPPORTED_COUNTRIES` | `toAlpha3`, `SUPPORTED_COUNTRIES`, `DEFAULT_COUNTRY` |
| `src/hooks/useExchangeRates.ts` | `COUNTRY_TO_CURRENCY` | `getCurrency` |
| `src/hooks/useClientResync.ts` | inline `countryCodeMap` | `toAlpha3`, `DEFAULT_COUNTRY` |
| `src/context/ShopContext.tsx` | `getCountryFromDomain()` function | `getCountryFromDomain`, `DEFAULT_COUNTRY` |
| `src/components/shop/ShippingAddressForm.tsx` | `defaultCountry = 'PT'` | `DEFAULT_COUNTRY` |
| `src/components/shop/ClientOnboarding.tsx` | `getCountryName` helper, hardcoded `'ZA'` | `getCountryName`, `DEFAULT_COUNTRY`, `toAlpha3` |
| `src/pages/PatientDashboard.tsx` | hardcoded `'PT'` fallback | `DEFAULT_COUNTRY` |
| `src/pages/Checkout.tsx` | hardcoded `'ZA'` fallbacks | `DEFAULT_COUNTRY` |
| `src/hooks/useStrainMedicalInfo.ts` | hardcoded `'PT'` fallback | `DEFAULT_COUNTRY` |
| `src/pages/AdminDashboard.tsx` | hardcoded `'ZA'` | `DEFAULT_COUNTRY` |
| `src/components/admin/AdminClientManager.tsx` | hardcoded `'ZA'` | `DEFAULT_COUNTRY` |

**Edge function (`drgreen-proxy/index.ts`):**
- Cannot import from `src/lib/`, so keeps its own `toAlpha2`, `getCountryCodeFromName`, and `countryCodeMap` -- but these are consolidated into a single block at the top of the file (currently duplicated 3 times inside different action handlers). The 3 duplicate `countryCodeMap` declarations inside `update-shipping`, `update-shipping-put`, and `admin-update-shipping` get replaced with a call to the single top-level version.

---

### Adding a New Country in the Future

With this architecture, adding a new country (e.g., Germany) requires editing **one file**:

```typescript
// src/lib/countries.ts
DE: {
  alpha2: 'DE', alpha3: 'DEU', name: 'Germany',
  currency: 'EUR', currencySymbol: '...', locale: 'de-DE',
  phonePrefix: '+49', ...
}
```

Then add `'DE'` to `SUPPORTED_COUNTRIES`. Done. No other files need changing.

---

### Also included in this change

1. **Fix remaining `'PT'` hardcodes** found during exploration:
   - `PatientDashboard.tsx` line 536: `|| 'PT'` (missed in previous fix)
   - `ShippingAddressForm.tsx` line 111: `defaultCountry = 'PT'`
   - `useStrainMedicalInfo.ts` line 117: `|| 'PT'`

2. **Update `docs/DRGREEN-API-FULL-REFERENCE.md` Section 8** with correct cart endpoint format (individual items, `/client/` path for clearing).

3. **Create `supabase/functions/gdpr-export/index.ts`** for GDPR data export (from the previous approved plan).

---

### Files Summary

| File | Action |
|------|--------|
| `src/lib/countries.ts` | **New** -- single source of truth |
| `src/lib/currency.ts` | Simplify, import from countries |
| `src/hooks/useGeoLocation.ts` | Simplify, import from countries |
| `src/lib/drgreenApi.ts` | Remove maps, import from countries |
| `src/hooks/useProducts.ts` | Remove maps, import from countries |
| `src/hooks/useExchangeRates.ts` | Remove map, import from countries |
| `src/hooks/useClientResync.ts` | Remove map, import from countries |
| `src/context/ShopContext.tsx` | Remove function, import from countries |
| `src/components/shop/ShippingAddressForm.tsx` | Fix default, import from countries |
| `src/components/shop/ClientOnboarding.tsx` | Import from countries |
| `src/pages/PatientDashboard.tsx` | Fix `'PT'` to `DEFAULT_COUNTRY` |
| `src/pages/Checkout.tsx` | Import `DEFAULT_COUNTRY` |
| `src/pages/AdminDashboard.tsx` | Import `DEFAULT_COUNTRY` |
| `src/components/admin/AdminClientManager.tsx` | Import `DEFAULT_COUNTRY` |
| `src/hooks/useStrainMedicalInfo.ts` | Fix `'PT'` to `DEFAULT_COUNTRY` |
| `supabase/functions/drgreen-proxy/index.ts` | Deduplicate 3 inline `countryCodeMap` blocks |
| `docs/DRGREEN-API-FULL-REFERENCE.md` | Fix Section 8 cart docs |
| `supabase/functions/gdpr-export/index.ts` | **New** -- GDPR export endpoint |

Total: 16 files modified, 2 new files created.

