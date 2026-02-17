

## Test Checkout with Benjamin (Verified Client) -- End-to-End Order Flow

### Current Situation

Benjamin Varcianna (`varseainc@gmail.com`) is:
- **Fully verified**: `is_kyc_verified: true`, `admin_approval: VERIFIED`
- **Client ID**: `a4357132-7e8c-4c8a-b005-6f818b3f173e`
- **Linked** to local user `3c5b8d43-5dcf-4af8-b023-cef47f2fde9d`
- **Shipping address**: 123 Rivonia Road, Sandton, South Africa (ZA)
- **Country**: PT (Portugal) in Dr. Green, but shipping address says ZA
- **`api_key_scope`**: NULL -- we do not know if this client was created under the **current** API key pair

### The Problem

The checkout flow has 3 steps via the Dr. Green API:
1. PATCH shipping address on the client record
2. POST items to server-side cart
3. POST order creation from cart

If Benjamin's client was created under a **different NFT/API key scope** than the current `DRGREEN_API_KEY`, steps 2 and 3 will return **401 Unauthorized**. The checkout then falls back to a **local-only order** (`LOCAL-XXXXXXXX-XXXX`) with `PENDING_SYNC` status -- not a genuine Dr. Green order.

The auto-rehome guard at the start of checkout detects this, but **rehoming resets KYC to PENDING** and destroys the verified status.

### Plan

**Step 1: Verify API key scope compatibility**

Before any code changes, we need to test whether Benjamin's client ID actually works with the current API key. We will:
- Log in as admin (or as Benjamin) and trigger a lightweight API call to check if the client ID returns data via the current key
- Check the edge function logs after the call

**Step 2: If scope mismatch detected -- skip rehome, use direct order creation**

Modify the `create-order` handler in `drgreen-proxy` to **not** trigger rehome for verified clients. Instead:
- Try the normal 3-step flow first
- If it fails with 401, try direct order creation with items + shipping in a single POST
- If that also fails with 401 (scope mismatch), create a **manual_review order** locally but with clear status messaging that it needs admin processing -- NOT a fake "confirmed" order

**Step 3: Update `Checkout.tsx` to handle the `manual_review` case clearly**

Currently the fallback creates a `LOCAL-*` order and shows "Order Received" with amber styling. This is correct but the user asked for genuine orders. We should:
- Add a dedicated status for "order placed but requires admin processing" vs "order failed"
- Show the user their order was captured and will be fulfilled manually

**Step 4: Record `api_key_scope` on successful operations**

After any successful API operation for Benjamin, update `drgreen_clients.api_key_scope` with the current key prefix so future operations skip the scope check.

### Technical Changes

**`supabase/functions/drgreen-proxy/index.ts`** (create-order case):
- After a successful order creation (Step 3 or fallback), update `api_key_scope` on the client record
- Remove the auto-rehome pre-flight from the checkout page for verified clients -- move it to a background admin action instead

**`src/pages/Checkout.tsx`**:
- In the auto-rehome guard (lines 219-238), skip rehome if the client is fully verified (`is_kyc_verified && admin_approval === VERIFIED`). This prevents destroying a working verification status just because the scope might be different.
- The local fallback already handles the case correctly -- keep it but improve messaging

**`src/pages/Checkout.tsx`** (handlePlaceOrder):
- Pass `isVerified: true` flag to the create-order action so the proxy can decide whether to attempt rehome

### What This Achieves

- Benjamin can go through checkout without his verified status being destroyed
- If the API key scope matches, the order goes through genuinely on Dr. Green
- If the API key scope does not match, the order is saved locally with clear "manual processing" status instead of pretending to be confirmed
- The `api_key_scope` field gets populated for future reference
- No silent failures or misleading "Order Confirmed" messages

