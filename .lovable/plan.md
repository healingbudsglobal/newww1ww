
# Admin UX Improvements -- Clickable Rows, Order Breakdown, and Navigation

## Overview

Several UX gaps exist in the admin pages. Table rows are not clickable, recent activity items don't navigate anywhere, and the orders table only shows an item count without a quick preview. This plan fixes all of these.

## Changes

### 1. Make Admin Orders Table Rows Clickable

**File**: `src/components/admin/AdminOrdersTable.tsx`

- Add `onClick={() => onViewOrder(order)}` to each `<motion.tr>` element
- Add `cursor-pointer` class to rows
- Wrap checkbox click and dropdown click in `e.stopPropagation()` to prevent row click from firing

### 2. Show Item Summary in Orders Table

**File**: `src/components/admin/AdminOrdersTable.tsx`

- Replace the plain "X items" text in the Items column with a tooltip or inline preview showing the first 2-3 strain names
- Format: "Blue Dream, OG Kush +1 more" instead of just "3 items"

### 3. Make Dashboard Recent Activity Items Clickable

**File**: `src/pages/AdminDashboard.tsx`

- Wrap each recent activity item in a clickable container
- Order items: navigate to `/admin/orders` (or open the order detail -- since admin orders use a sheet, navigate to the orders page)
- Client items: navigate to `/admin/clients`
- Add `cursor-pointer` class and visual affordance (arrow icon or underline)

### 4. Add Item Count Badge to Orders Nav

**File**: `src/layout/AdminLayout.tsx`

No change needed here -- badges are already supported but require dynamic data which would add complexity. Skip for now.

## Technical Details

### Files Modified
- `src/components/admin/AdminOrdersTable.tsx` -- clickable rows + item name preview
- `src/pages/AdminDashboard.tsx` -- clickable recent activity items with navigation

### No New Files

### Implementation Notes
- Checkbox and action button clicks use `e.stopPropagation()` to avoid triggering row navigation
- Item names are truncated with "+N more" pattern for clean display
- Navigation uses `useNavigate` which is already available in the dashboard
