

# Fix Order Creation for Verified Patients

## Problem
Order placement fails with "Unable to save shipping address" because:
1. The `create-order` action tries to PATCH the client's shipping address to Dr. Green API
2. The PATCH returns HTTP 200 but doesn't actually save the data (NFT-scoped permission restriction)
3. Adding items to cart fails because Dr. Green API says "shipping address not found"
4. After 5 retries, the proxy throws the error

## Solution
Modify the `create-order` action in `drgreen-proxy` to handle the permission restriction gracefully by:
1. Attempting the PATCH but accepting that it may not persist
2. Trying the cart add anyway since the client record in Dr. Green may already have shipping (from original registration)
3. Only failing if the cart API definitively rejects due to missing shipping

### Technical Details

**File Modified:** `supabase/functions/drgreen-proxy/index.ts`

**Key Changes:**

1. **Remove dependency on shippingVerified flag** (Lines 2612-2619)
   - Don't assume failure just because PATCH didn't return shipping in response
   - The client record may already have shipping from when they were originally created

2. **Improve cart retry logic** (Lines 2577-2610)
   - If cart fails with "shipping address not found", check if we have a local shipping address
   - If local shipping exists, include a more specific error message suggesting the Dr. Green portal may need updates

3. **Add fallback order creation** (after line 2610)
   - If cart repeatedly fails, try creating the order anyway in case the API relaxes the requirement
   - Return a more actionable error message if all approaches fail

**Updated create-order flow:**

```text
Step 1: PATCH shipping address (best effort)
        ↓ (may succeed or silently fail)
Step 2: POST items to cart
        ↓ (if fails with "shipping not found")
        Retry with exponential backoff
        ↓ (after 5 failures)
Step 3: Try POST /dapp/orders anyway
        ↓ (if that also fails)
Return error: "The Dr. Green system requires shipping address setup.
              Please contact support or try again later."
```

## Alternative Approaches

If the above doesn't work, these are the escalation options:

1. **Contact Dr. Green support** - Request that the API credentials be updated to allow PATCH on client records, or that an alternative order creation endpoint be provided

2. **Mock mode fallback** - In development/testing, allow orders to be created locally without Dr. Green API if it consistently fails

3. **Admin intervention** - Add an admin action to manually set shipping addresses via a different credential set

## Testing After Fix
- Redeploy the `drgreen-proxy` edge function
- Navigate to checkout as Kayliegh
- Click "Place Order"
- Verify order is created or a clear, actionable error is shown

