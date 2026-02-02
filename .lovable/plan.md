

# Save Shipping Addresses Locally During Registration

## Overview
Fix the checkout flow by storing shipping addresses in the local `drgreen_clients` table during patient onboarding. This ensures checkout can always retrieve the address via the local fallback, regardless of Dr. Green API access restrictions.

## Problem
Currently, the `ClientOnboarding` component:
1. Collects complete shipping address from the user
2. Sends it to the Dr. Green API via `buildLegacyClientPayload`
3. Does NOT save the address to the local `drgreen_clients.shipping_address` column

When checkout tries to fetch client details, the Dr. Green API returns 401 (endpoint-level permission restriction), and the local fallback has no shipping address to return.

## Solution

### File Modified
`src/components/shop/ClientOnboarding.tsx`

### Changes

**1. Update Import (Line 7)**
Add `toAlpha3` to the existing import from `@/lib/drgreenApi`:
```typescript
import { buildLegacyClientPayload, toAlpha3 } from '@/lib/drgreenApi';
```

**2. Add Country Name Helper (After Line 106)**
```typescript
// Map country codes to full names for shipping display
const getCountryName = (code: string): string => {
  const countryNames: Record<string, string> = {
    PT: 'Portugal',
    GB: 'United Kingdom', 
    ZA: 'South Africa',
    TH: 'Thailand',
  };
  return countryNames[code] || code;
};
```

**3. Update Supabase Upsert (Lines 806-818)**
Build shipping address object and include it in the upsert:

```typescript
// Build shipping address for local storage (ensures checkout fallback works)
const localShippingAddress = formData.address ? {
  address1: formData.address.street?.trim() || '',
  city: formData.address.city?.trim() || '',
  state: formData.address.state?.trim() || formData.address.city?.trim() || '',
  country: getCountryName(formData.address.country) || 'Portugal',
  countryCode: toAlpha3(formData.address.country || 'PT'),
  postalCode: formData.address.postalCode?.trim() || '',
} : null;

// Store client info locally - only with valid API-provided clientId
const { error: dbError } = await supabase.from('drgreen_clients').upsert({
  user_id: user.id,
  drgreen_client_id: clientId,
  country_code: formData.address?.country || 'PT',
  is_kyc_verified: false,
  admin_approval: 'PENDING',
  kyc_link: kycLink,
  email: formData.personal?.email || null,
  full_name: formData.personal ? `${formData.personal.firstName} ${formData.personal.lastName}`.trim() : null,
  shipping_address: localShippingAddress,  // NEW: Save address locally
}, {
  onConflict: 'user_id',
});
```

## Data Flow After Fix

```
Registration Flow:
User fills form → API receives data → Local DB stores shipping_address

Checkout Flow:
Request client details → API returns 401 → Fallback reads local DB → Returns shipping address ✓
```

## Technical Notes

- **No database migration needed**: The `shipping_address` JSONB column already exists in `drgreen_clients`
- **Backwards compatible**: Existing clients (Kayliegh, Scott) already have addresses populated from the manual fix
- **Proxy unchanged**: The `drgreen-proxy` fallback logic already returns `shipping_address` from local records
- **Format matches**: Uses same JSONB structure as the API (address1, city, state, country, countryCode, postalCode)

## Testing Checklist
- Register a new test patient through the shop
- Verify `shipping_address` is populated in `drgreen_clients` table
- Proceed to checkout and confirm address displays correctly
- Verify existing users (Kayliegh, Scott) still work with their manually-entered addresses

