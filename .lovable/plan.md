

## Show Cart in Navigation Only When Items Are in Cart

### What Changes

The Cart link/button in both desktop and mobile navigation should only appear when `cartCount > 0`. When the cart is empty, the Cart link is hidden entirely.

### Files to Change

**1. `src/components/NavigationMenu.tsx`** (desktop nav, lines 65-82)
- Wrap the Cart button in a conditional: only render when `cartCount > 0`
- Add a fade-in animation using `AnimatePresence` + `motion.button` so it appears/disappears smoothly

**2. `src/components/NavigationOverlay.tsx`** (mobile nav, line 126)
- Conditionally include the Cart item in the `navItems` array only when `cartCount > 0`
- Simple filter: if `cartCount === 0`, omit the cart entry entirely

### Technical Details

**NavigationMenu.tsx:**
```text
- Wrap lines 65-82 (the cart button) in: {cartCount > 0 && ( ... )}
- Optionally wrap with AnimatePresence + motion.button for smooth entry/exit
```

**NavigationOverlay.tsx:**
```text
- Change line 126 from always including the cart item to:
  ...(cartCount > 0 ? [{ to: "#cart", label: `Cart (${cartCount})`, icon: ShoppingCart, active: false, isCart: true }] : [])
```

This keeps the nav clean when the cart is empty and makes the Cart link appear as soon as a product is added.
