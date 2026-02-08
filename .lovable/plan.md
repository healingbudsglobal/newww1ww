
# Admin Orders Management Dashboard

## Overview

Create a dedicated admin page for viewing, managing, and syncing orders with the Dr. Green API. This page will allow administrators to:
- View all local orders with their sync status
- See which orders are pending sync to the Dr. Green API
- Manually trigger sync for individual or batch orders
- View order details including customer information and items
- Update order/payment statuses

## Architecture

### Current State Analysis

**Local Database Schema (`drgreen_orders`):**
- `id` - UUID primary key
- `user_id` - References the Supabase user
- `drgreen_order_id` - External API order reference
- `status` - Order status (PENDING, CONFIRMED, etc.)
- `payment_status` - Payment status (PENDING, PAID, FAILED)
- `total_amount` - Order total
- `items` - JSON array of order items
- `created_at`, `updated_at` - Timestamps

**Existing API Hooks (`useDrGreenApi`):**
- `getDappOrders()` - Fetch all orders from Dr. Green API (admin)
- `getDappOrderDetails()` - Get single order details
- `updateDappOrder()` - Update order status in Dr. Green API
- `createOrder()` - Create order (used in checkout)

**Order Flow (per memory context):**
Orders are local-first: checkouts save to the local database immediately with internal emails triggered. Administrative approval in the dashboard is required to manually sync orders to the Dr. Green API.

---

## Implementation Plan

### 1. Database Schema Update

Add a `sync_status` column to track API synchronization state:

```sql
-- Add sync_status column to drgreen_orders
ALTER TABLE drgreen_orders 
ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'pending';

-- Add sync timestamp
ALTER TABLE drgreen_orders 
ADD COLUMN IF NOT EXISTS synced_at timestamptz;

-- Add sync error tracking
ALTER TABLE drgreen_orders 
ADD COLUMN IF NOT EXISTS sync_error text;

-- Add index for filtering by sync status
CREATE INDEX IF NOT EXISTS idx_drgreen_orders_sync_status 
ON drgreen_orders(sync_status);

COMMENT ON COLUMN drgreen_orders.sync_status IS 'Sync status: pending, synced, failed, manual_review';
```

**sync_status values:**
- `pending` - Not yet synced to Dr. Green API
- `synced` - Successfully synced
- `failed` - Sync attempt failed
- `manual_review` - Flagged for manual review

### 2. New Admin Page: `src/pages/AdminOrders.tsx`

Create a comprehensive admin orders management page with:

**UI Components:**
- Summary stats cards (Total Orders, Pending Sync, Failed, Today's Orders)
- Tabbed interface: All | Pending Sync | Failed | Synced
- Orders data table with sorting and filtering
- Order detail slide-over/modal
- Bulk sync actions
- Individual sync buttons

**Features:**
- Real-time updates via Supabase realtime subscriptions
- Pagination for large datasets
- Search by order ID, customer email
- Filter by date range, status, sync status
- Export to CSV functionality

### 3. Add Admin Order Sync Hook: `src/hooks/useAdminOrderSync.ts`

Create a dedicated hook for admin order operations:

```typescript
interface OrderSyncResult {
  success: boolean;
  orderId: string;
  error?: string;
}

export function useAdminOrderSync() {
  // Fetch all orders (admin view - no user_id filter)
  const fetchAllOrders = async (filters?: OrderFilters) => {...}
  
  // Sync single order to Dr. Green API
  const syncOrder = async (orderId: string) => {...}
  
  // Batch sync multiple orders
  const batchSyncOrders = async (orderIds: string[]) => {...}
  
  // Update local order status
  const updateOrderStatus = async (orderId: string, updates: {...}) => {...}
  
  // Mark order for manual review
  const flagForReview = async (orderId: string, reason: string) => {...}
}
```

### 4. Order Detail Component: `src/components/admin/AdminOrderDetail.tsx`

A slide-over panel showing:
- Order summary (ID, date, total, status)
- Customer information (name, email, address)
- Line items with quantities and prices
- Sync history/attempts
- Action buttons (Sync, Update Status, Flag for Review)

### 5. Update Admin Layout Navigation

Add the Orders page to the admin sidebar in `src/layout/AdminLayout.tsx`:

```typescript
const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart }, // NEW
  { to: "/admin/prescriptions", label: "Prescriptions", icon: FileText },
  // ... existing items
];
```

### 6. Update App Routes

Add the new admin route in `src/App.tsx`:

```typescript
// Add lazy import
const AdminOrders = lazy(() => import("./pages/AdminOrders"));

// Add route
<Route path="/admin/orders" element={<AdminOrders />} />
```

### 7. RLS Policy for Admin Order Access

Ensure admins can view all orders (update existing policies):

```sql
-- Allow admins to view all orders
CREATE POLICY "Admins can view all orders" ON drgreen_orders
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update all orders
CREATE POLICY "Admins can update all orders" ON drgreen_orders
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));
```

---

## Technical Details

### File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/AdminOrders.tsx` | Create | Main admin orders page |
| `src/hooks/useAdminOrderSync.ts` | Create | Admin order sync logic |
| `src/components/admin/AdminOrderDetail.tsx` | Create | Order detail panel |
| `src/components/admin/AdminOrdersTable.tsx` | Create | Reusable orders table |
| `src/layout/AdminLayout.tsx` | Edit | Add Orders nav item |
| `src/App.tsx` | Edit | Add admin/orders route |
| Database migration | Create | Add sync_status columns |

### Order Sync Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                    Admin Orders Dashboard                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Admin clicks "Sync Order"                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Hook calls createOrder() with local order data          │
│     - clientId from drgreen_clients                         │
│     - items from order.items                                │
│     - shippingAddress from client record                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────┬──────────────────────────────────────────┐
│   Success?       │                                          │
└──────────────────┴──────────────────────────────────────────┘
       │                              │
       ▼ Yes                          ▼ No
┌─────────────────────┐    ┌──────────────────────────────────┐
│ Update local order: │    │ Update local order:              │
│ - sync_status =     │    │ - sync_status = 'failed'         │
│   'synced'          │    │ - sync_error = error message     │
│ - synced_at = now() │    │ - Flag for manual review         │
│ - drgreen_order_id  │    └──────────────────────────────────┘
│   from API response │
└─────────────────────┘
```

### UI Wireframe

```text
┌────────────────────────────────────────────────────────────────┐
│  Admin Portal > Orders                           [Sync All ▼]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Total    │ │ Pending  │ │ Failed   │ │ Today    │          │
│  │   147    │ │    23    │ │    5     │ │    12    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ [All] [Pending Sync] [Failed] [Synced]                  │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ Search: [_______________]  Date: [From] - [To]          │  │
│  ├─────────────────────────────────────────────────────────┤  │
│  │ ☐ │ Date       │ Ref        │ Customer   │ Total │ Sync │  │
│  │───│────────────│────────────│────────────│───────│──────│  │
│  │ ☐ │ 08 Feb 25  │ ord_a3x... │ john@...   │ €89   │ ⏳    │  │
│  │ ☐ │ 07 Feb 25  │ ord_b2y... │ jane@...   │ €145  │ ✓     │  │
│  │ ☐ │ 07 Feb 25  │ ord_c1z... │ mike@...   │ €67   │ ✗     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  [< Prev]  Page 1 of 15  [Next >]     Selected: [Sync (3)]    │
└────────────────────────────────────────────────────────────────┘
```

---

## Dependencies

No new dependencies required. Uses existing:
- `@tanstack/react-query` - For data fetching
- `lucide-react` - Icons
- `framer-motion` - Animations
- Existing UI components (Table, Card, Badge, Button, Tabs)

---

## Testing Checklist

After implementation:
- [ ] Verify admin can view all orders (not just their own)
- [ ] Test sync functionality with a pending order
- [ ] Verify failed sync shows error and allows retry
- [ ] Test batch sync with multiple orders
- [ ] Verify realtime updates work when orders change
- [ ] Test pagination and filtering
- [ ] Confirm order detail panel shows correct data
- [ ] Test on mobile viewport for responsive layout
