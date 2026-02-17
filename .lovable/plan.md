

## Fix Navigation Clipping and Add Cart Link

### Problems Identified

From the screenshot:
1. **"About Us" is clipped** -- showing as "bout Us" with the first letter cut off
2. **"Support" is clipped** -- showing as "Sup..." and truncated
3. **No Cart/Shopping Cart link** in the navigation menu

### Root Cause

In `NavigationMenu.tsx` line 33, the nav container has `overflow-hidden` which clips items that overflow the available horizontal space. With 6 nav items plus the logo, right-side actions (language switcher, theme toggle, KYC badge, account dropdown), there is not enough room on typical desktop widths.

### Solution

**1. Fix the clipping -- reduce item spacing and padding**

In `src/components/NavigationMenu.tsx`:
- Remove `overflow-hidden` from the nav container
- Reduce gap from `gap-1.5` to `gap-0.5`
- Reduce link padding from `px-3.5` to `px-2.5`
- Remove icons from desktop nav links (they add ~24px per item and are redundant on desktop -- keep them for mobile overlay)

**2. Add a Cart link to the desktop nav**

Add a "Cart" item to the `navItems` array in `NavigationMenu.tsx`:
- Path: opens the cart drawer (uses `useShop().setIsCartOpen(true)` instead of a route)
- OR: link to `/checkout` directly
- Best approach: make it a button that opens the existing Cart drawer, with a badge showing item count

Since the Cart is implemented as a `Sheet` drawer (not a page), the Cart nav item should be a button that calls `setIsCartOpen(true)` from ShopContext, with a small count badge.

**3. Add Cart to mobile navigation overlay**

In `src/components/NavigationOverlay.tsx`:
- Add a "Cart" item in the mobile nav list with a `ShoppingCart` icon
- Wire it to open the cart drawer on tap

### Files to Change

- `src/components/NavigationMenu.tsx` -- remove overflow-hidden, tighten spacing, drop icons, add Cart button
- `src/components/NavigationOverlay.tsx` -- add Cart link to mobile nav items
- `src/layout/Header.tsx` -- no changes needed (right-side actions are fine)

### Technical Details

NavigationMenu changes:
```text
- Remove overflow-hidden from nav container
- Change gap-1.5 to gap-0.5
- Change px-3.5 to px-2.5 on links
- Remove Icon rendering from links (text-only on desktop)
- Add Cart button with ShoppingCart icon + cart count badge
- Import useShop for cart state
```

NavigationOverlay changes:
```text
- Add { to: "#cart", label: "Cart", icon: ShoppingCart } to navItems
- On click, call setIsCartOpen(true) + onClose() instead of navigating
```

