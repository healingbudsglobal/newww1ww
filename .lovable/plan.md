

# Local Order Confirmation System

## Problem
The Dr. Green DApp API is returning 401 Unauthorized errors, preventing clients from completing orders. Verified clients with products in their cart are blocked at checkout.

## Solution
Implement a **local-first order flow** that:
1. Saves the order directly to the `drgreen_orders` table with a `PENDING_SYNC` status
2. Shows the client a professional order confirmation immediately
3. Clears the cart as normal
4. Queues the order for later API sync when the DApp issue is resolved

This ensures clients can place orders now, and admins can process/sync them once API access is restored.

---

## Changes

### 1. Update Checkout Logic (`src/pages/Checkout.tsx`)

Modify `handlePlaceOrder` to use a **local-first fallback**:

- **Try** the existing DApp API order flow first (current behavior)
- **On API failure** (401, 500, timeout), fall back to saving the order locally with:
  - `drgreen_order_id`: Generate a local reference like `LOCAL-{timestamp}-{random}`
  - `status`: `PENDING_SYNC`
  - `payment_status`: `AWAITING_PROCESSING`
  - `sync_status`: `pending`
  - `sync_error`: The original API error message
- Show a tailored confirmation screen that explains the order is received and will be processed

### 2. Update Order Confirmation UI (`src/pages/Checkout.tsx`)

Modify the `orderComplete` confirmation view to handle two states:

- **API-confirmed order**: Current green checkmark + "Order Confirmed!" (unchanged)
- **Locally-saved order**: Amber/blue info state + "Order Received!" with messaging:
  - "Your order has been received and saved securely"
  - "Our team will process your order and confirm via email"
  - "Reference number: LOCAL-xxxx"
  - "No payment has been taken yet"

### 3. Update Orders Page Display (`src/components/shop/OrdersTable.tsx`)

Add visual distinction for `PENDING_SYNC` orders:
- Show an amber "Awaiting Processing" badge instead of the regular status
- Add a subtle info note: "This order is queued for processing"

---

## Technical Details

### Modified files:
- `src/pages/Checkout.tsx` -- Add local fallback in `handlePlaceOrder`, update confirmation UI
- `src/components/shop/OrdersTable.tsx` -- Add `PENDING_SYNC` status badge styling

### No database changes required
The `drgreen_orders` table already has `sync_status` and `sync_error` columns, and `drgreen_order_id` accepts any text value. The existing schema fully supports this flow.

### Local Order ID Format
```text
LOCAL-{YYYYMMDD}-{4-char-random}
Example: LOCAL-20260209-A3F7
```

### Order Flow Diagram

```text
Client clicks "Place Order"
        |
        v
  Try DApp API order
        |
   +---------+
   | Success? |
   +----+----+
   Yes  |  No (401/error)
    |   |      |
    v   |      v
 Normal |  Save locally with
 flow   |  PENDING_SYNC status
    |   |      |
    v   v      v
 Confirmation shown to client
 (adapted messaging per state)
    |          |
    v          v
 Cart cleared  Cart cleared
```

### Security and Compliance Notes
- No eligibility or KYC checks are bypassed -- the `EligibilityGate` component still wraps the checkout
- Payment is NOT processed for local orders -- messaging clearly states "no payment taken yet"
- Orders are traceable via the local reference ID
- Admin can view and manually process these orders from the admin panel

