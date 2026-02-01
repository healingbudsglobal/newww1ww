# Fix Checkout Flow: Shipping Address + Order Creation

## ✅ COMPLETED

### Changes Made

1. **`src/pages/Checkout.tsx`** - Updated `createOrder` call to include shipping address:
   - Maps `address1` → `street`
   - Maps `postalCode` → `zipCode`
   - Falls back to city for state if not provided

2. **`src/hooks/useDrGreenApi.ts`** - Extended shipping address type to support both naming conventions:
   - Added `address1`, `address2`, `landmark`, `postalCode`, `countryCode` fields
   - Maintains backwards compatibility with existing `street`/`zipCode` fields

3. **`supabase/functions/drgreen-proxy/index.ts`** - Updated order creation handler:
   - Added `getCountryCodeFromName()` helper function
   - Normalizes shipping address fields to Dr. Green API format
   - Handles both frontend naming (street/zipCode) and API naming (address1/postalCode)

### Testing Checklist

- [ ] Log in as verified patient (Kayliegh)
- [ ] Add item to cart
- [ ] Proceed to checkout
- [ ] Fill in shipping address form
- [ ] Click "Place Order"
- [ ] Verify order created with shipping address attached
