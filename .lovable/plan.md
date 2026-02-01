
# Plan: Fix Dr. Green Order Creation to Match Official API

## Problem Summary

Based on the official Dr. Green API documentation provided, the current checkout implementation is using an incorrect order creation pattern. The API documentation clearly shows that orders should be created by **passing items directly in the request body**, not by syncing to a server-side cart first.

**Current (incorrect) flow:**
```
Local cart → Empty API cart → Add items to API cart → Create order (no items) → ERROR
```

**Correct flow (per documentation):**
```
Local cart → Create order with items in body → Success
```

---

## Technical Changes Required

### 1. Update Edge Function Proxy
**File:** `supabase/functions/drgreen-proxy/index.ts`

Update the `create-order` and `place-order` actions to properly format the request per documentation:

```typescript
case "create-order": {
  const orderData = body.data || {};
  if (!orderData.clientId) throw new Error("clientId is required");
  if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    throw new Error("items array is required and must not be empty");
  }
  
  // Format per API documentation
  const payload = {
    clientId: orderData.clientId,
    items: orderData.items.map(item => ({
      productId: item.strainId || item.productId,
      quantity: item.quantity,
      price: item.price || item.unit_price
    })),
    shippingAddress: orderData.shippingAddress,
    notes: orderData.notes
  };
  
  response = await drGreenRequestBody("/dapp/orders", "POST", payload);
  break;
}
```

### 2. Update Checkout Component
**File:** `src/pages/Checkout.tsx`

Simplify `handlePlaceOrder` to pass items directly to order creation instead of syncing cart:

```typescript
const handlePlaceOrder = async () => {
  if (!drGreenClient || cart.length === 0) return;

  setIsProcessing(true);
  setPaymentStatus('Creating order...');

  try {
    const clientId = drGreenClient.drgreen_client_id;
    
    // Create order with items directly (per API documentation)
    const orderResult = await createOrder({
      clientId: clientId,
      items: cart.map(item => ({
        productId: item.strain_id,
        quantity: item.quantity,
        price: item.unit_price,
      })),
      shippingAddress: drGreenClient.shipping_address || undefined,
    });

    if (orderResult.error || !orderResult.data) {
      throw new Error(orderResult.error || 'Failed to create order');
    }

    const createdOrderId = orderResult.data.orderId;
    // ... rest of payment flow unchanged
  } catch (error) {
    // ... existing error handling
  }
};
```

### 3. Update API Hook
**File:** `src/hooks/useDrGreenApi.ts`

Update `createOrder` function signature to match documentation schema:

```typescript
const createOrder = async (orderData: {
  clientId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  notes?: string;
}) => {
  return callProxy<{
    orderId: string;
    orderNumber?: string;
    status: string;
    totalAmount: number;
  }>('create-order', { data: orderData });
};
```

### 4. Remove Cart Sync Logic
**File:** `src/pages/Checkout.tsx`

Remove the now-unnecessary cart sync steps:
- Remove `emptyCart` call
- Remove `addToCart` loop
- Remove `placeOrder` call (replace with `createOrder`)

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/drgreen-proxy/index.ts` | Update `create-order` action to accept items in body |
| `src/pages/Checkout.tsx` | Simplify order creation, remove cart sync logic |
| `src/hooks/useDrGreenApi.ts` | Update `createOrder` interface to match API schema |

---

## API Payload Mapping

**Local Cart Item → API Order Item**
| Local Field | API Field |
|-------------|-----------|
| `strain_id` | `productId` |
| `quantity` | `quantity` |
| `unit_price` | `price` |

---

## Error Handling Improvements

Enhance error messages for common API responses:

| API Error | User-Friendly Message |
|-----------|----------------------|
| `Client is not active` | "Your account is pending verification. Please contact support." |
| 400 Bad Request | "Unable to process your order. Please verify your cart and try again." |
| 401 Unauthorized | "Session expired. Please log in again." |
| 409 Conflict | "There was a conflict with your order. Please refresh and try again." |

---

## Testing Plan

After implementation:
1. Login as Kayliegh (`kayliegh.sm@gmail.com` / `HB2024Test!`)
2. Add product to cart
3. Proceed to checkout
4. Click "Place Order"
5. Verify no more 400/409 cart errors
6. Check if order is created successfully or if "Client is not active" error appears (which would confirm the client needs activation in Dr. Green portal)
