

# Admin Pending Orders Queue + Navigation & Wire Fixes

## 1. Admin Pending Orders Queue

The admin orders page (`/admin/orders`) already exists with filtering by sync status. However, we'll add a dedicated **"Pending Queue"** tab/view that surfaces `PENDING_SYNC` orders prominently with one-click processing actions:

- **Add a prominent "Pending Queue" card** at the top of the Admin Orders page that shows the count of `PENDING_SYNC` orders with a call-to-action
- **Add quick-action buttons** on each pending order row: "Mark as Confirmed", "Process Manually", "Flag for Review"
- **Add a "Process Order" workflow**: Admin clicks "Confirm & Process" on a pending order, which updates the status from `PENDING_SYNC` to `CONFIRMED` and payment status from `AWAITING_PROCESSING` to `PAID`
- **Add bulk actions**: "Confirm All Pending" button to batch-process multiple orders

### Files to modify:
- `src/pages/AdminOrders.tsx` -- Add pending queue banner and quick-process actions
- `src/components/admin/AdminOrdersTable.tsx` -- Add "Process" button for PENDING_SYNC orders

---

## 2. Navigation Bar Fix (Links Not Visible / Overlapping)

From the screenshot, the nav links in the header are overlapping and unreadable. The issue is that the navigation items are clashing with each other when space is tight. The text "The Wire" is rendering on top of other nav items.

### Root cause:
The `NavigationMenu` component uses `hidden xl:flex` so it only shows on xl+ screens, but the nav items with icons + text + padding (`px-5 py-2.5`) can still overflow or overlap when there are too many items in the available space.

### Fix:
- Reduce padding on nav items from `px-5` to `px-4`
- Add `whitespace-nowrap` to prevent label wrapping
- Add `overflow-hidden` on the nav container to prevent spillover
- Ensure the nav uses `flex-shrink-0` on items so they don't compress

### File to modify:
- `src/components/NavigationMenu.tsx`

---

## 3. The Wire Text Overlap Fix

The screenshot shows text overlapping on The Wire section (likely in the hero or article cards). This is a layout issue where content is not properly contained.

### Fix:
- Ensure the hero section has proper `pt-28` padding to clear the fixed header
- Add `overflow-hidden` and `text-ellipsis` where needed
- Add `line-clamp` utilities to article titles and summaries to prevent overflow

### File to modify:
- `src/pages/TheWire.tsx` -- Minor spacing adjustments if needed (the current code already has `pt-28` so the issue may be specifically the nav overlap bleeding into the page content)

---

## Technical Summary

| Change | File | Description |
|--------|------|-------------|
| Pending queue banner | `src/pages/AdminOrders.tsx` | Add prominent pending orders banner with batch process button |
| Quick process actions | `src/components/admin/AdminOrdersTable.tsx` | Add "Confirm" button for PENDING_SYNC rows |
| Nav link overflow | `src/components/NavigationMenu.tsx` | Fix padding, add whitespace-nowrap, prevent overflow |
| Wire text overlap | `src/pages/TheWire.tsx` | Ensure proper spacing and text containment |

