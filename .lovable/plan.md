
# Plan: Fix Cart API Integration and Add Retry Logic for Checkout

## Status: ✅ IMPLEMENTED

## Changes Made

### 1. Fixed Cart Payload Format
**File:** `supabase/functions/drgreen-proxy/index.ts`

Updated the `add-to-cart` action to:
- Use `clientId` instead of `clientCartId`
- Use `productId` instead of `strainId` in items array
- Added enhanced logging for cart responses (success/error)

### 2. Added Retry Logic with Exponential Backoff
**File:** `src/pages/Checkout.tsx`

Added `retryOperation()` utility function:
- Exponential backoff: 1s, 2s, 4s between retries
- Skips retry for 400-level validation errors
- Default 3 retries for transient failures

### 3. Added Fallback to Direct Order Creation
**File:** `src/pages/Checkout.tsx`

Checkout flow now:
1. Tries cart-based flow first (emptyCart → addToCart → placeOrder)
2. If cart sync fails, falls back to `createOrder()` with items directly
3. User-friendly error messages for both failure paths

---

## Testing Status

**Next Step:** Test checkout flow with Kayliegh's verified account to confirm the fix works.

| Step | Expected Result |
|------|-----------------|
| Login as Kayliegh | Access verified account |
| Add product to cart | Product added to local cart |
| Click Place Order | Cart sync or direct order succeeds |
| Check logs | See successful API responses |
