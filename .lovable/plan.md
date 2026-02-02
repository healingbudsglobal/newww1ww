

# Fix: Dr. Green API Order Creation - Cart Sync Error (409)

## Problem Identified

During end-to-end checkout testing, the order creation fails with a **409 Conflict** error:
- `"Client does not have any item in the cart"`

The root cause is a **cascading failure**:
1. `add-to-cart` call fails with **400 Bad Request**: `"Client shipping address not found."`
2. Since cart sync fails, `place-order` fails with **409 Conflict**
3. The fallback `create-order` also fails with **409** because the Dr. Green API's order endpoint requires items to be in the server-side cart - it doesn't accept items directly in the request body

## Root Cause Analysis

The Dr. Green API enforces a strict workflow:
1. Client must have a shipping address saved on their record
2. Only then can items be added to the server-side cart (`POST /dapp/carts`)
3. Only then can orders be created (`POST /dapp/orders`)

The `updateShippingAddress` call in `ShippingAddressForm` is failing with **401 Unauthorized** due to NFT-scoped API permissions. The form continues anyway (designed for resilience), but this leaves the client record without a shipping address.

## Proposed Solution

### Approach: Skip Cart-Based Flow, Require Shipping Sync

Since the `create-order` endpoint does NOT accept items directly (despite the proxy code structuring them), we must ensure the cart flow works. This requires the shipping address to be saved on the client record first.

**Changes Required:**

### 1. ShippingAddressForm.tsx - Make address sync critical path

Update the form to treat shipping address sync failure as a blocking issue when `updateShippingAddress` returns 401:

```typescript
// After API call attempt
if (result.error && result.error.includes('401')) {
  // API access restricted - save address locally for checkout
  // But warn user that order may require manual verification
  toast({
    title: 'Address Saved Locally',
    description: 'Your address is ready. Note: Your account may need additional verification.',
    variant: 'default',
  });
}
```

### 2. Checkout.tsx - Direct Order with Shipping in Payload

Prioritize the `createOrder` method with full shipping payload as the **primary** approach, skipping the cart sync entirely since it requires saved shipping:

```typescript
// handlePlaceOrder - remove cart sync step entirely
// Go directly to createOrder with items + shipping in payload

const orderResult = await retryOperation(
  () => createOrder({
    clientId: clientId,
    items: cart.map(item => ({
      productId: item.strain_id,
      quantity: item.quantity,
      price: item.unit_price,
    })),
    shippingAddress: {
      address1: shippingAddress.address1,
      address2: shippingAddress.address2 || '',
      city: shippingAddress.city,
      state: shippingAddress.state || shippingAddress.city,
      postalCode: shippingAddress.postalCode,
      country: shippingAddress.country,
      countryCode: shippingAddress.countryCode,
    },
  }),
  'Create order'
);
```

### 3. drgreen-proxy/index.ts - Fix `create-order` to use correct endpoint

The current `create-order` action uses `POST /dapp/orders` which expects cart items. Based on Dr. Green API documentation, there may be a different endpoint that accepts items directly, or we need to:

Option A: If Dr. Green API supports direct item submission (check docs)
- Update to use the correct endpoint that accepts items in body

Option B: If cart-based flow is the only option
- The `create-order` action should first save shipping to client, then add items to cart, then create order - all in one transaction

```typescript
case "create-order": {
  // Step 1: Update client shipping address
  await drGreenRequest(`/dapp/clients/${clientId}`, "PATCH", {
    shipping: orderData.shippingAddress
  });
  
  // Step 2: Add items to cart
  await drGreenRequestBody("/dapp/carts", "POST", {
    clientCartId: clientId,
    items: orderData.items.map(item => ({
      strainId: item.strainId || item.productId,
      quantity: item.quantity,
    }))
  });
  
  // Step 3: Create order from cart
  response = await drGreenRequest("/dapp/orders", "POST", {
    clientId: clientId,
  });
  break;
}
```

## Technical Details

### Files to Modify

1. **`supabase/functions/drgreen-proxy/index.ts`**
   - Update `create-order` action to perform multi-step transaction:
     1. PATCH client with shipping address
     2. POST items to cart
     3. POST order creation
   - Add proper error handling for each step
   - If shipping PATCH fails (401), log warning but continue (address in order payload may still work)

2. **`src/pages/Checkout.tsx`**
   - Simplify `handlePlaceOrder` to use only `createOrder`
   - Remove the cart sync loop (it will be handled server-side)
   - Pass full shipping address in the createOrder call

3. **`src/components/shop/ShippingAddressForm.tsx`**
   - Keep current behavior (optional sync, continue on failure)
   - Add better user messaging about verification status

### Testing Plan

1. Log in as kayliegh.sm@gmail.com
2. Add item to cart
3. Go to checkout
4. Fill in Pretoria address (1937 Prospect St, Pretoria, Gauteng, 0036)
5. Click Save & Continue
6. Click Place Order
7. Verify order is created successfully
8. Check edge function logs to confirm the multi-step flow executed

## Risk Assessment

**Low Risk**: The change moves the multi-step cart/order logic to the server-side edge function, which:
- Reduces round-trips between client and server
- Provides atomic transaction behavior
- Handles API permission issues gracefully

**Consideration**: If the PATCH to update shipping also fails (401), the entire order may fail. However, this would indicate a fundamental API access issue that requires resolution with Dr. Green.

