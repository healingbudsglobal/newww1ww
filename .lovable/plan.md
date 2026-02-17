

## Comprehensive Update: Order Flow Fix + Navigation UX + Color Scheme + Shop Hero

---

### Part 1: Order Flow Fix (Critical -- 3 Bugs Found)

The Postman "Dr Green Order Workflow Test" confirms the exact API contract. Comparing it against the current `drgreen-proxy/index.ts`, there are three specific bugs preventing orders:

**Bug 1 -- Wrong cart payload key (line 3114-3117)**

Current code sends:
```json
{ "clientCartId": "a4357...", "items": [{ "strainId": "...", "quantity": 1 }] }
```

Postman spec requires individual calls per item:
```json
POST /dapp/carts
{ "clientId": "a4357...", "strainId": "...", "quantity": 1 }
```

The field is `clientId`, not `clientCartId`. And each item must be a separate `POST` call.

**Bug 2 -- Wrong cart clear endpoint (line 3100)**

Current: `DELETE /dapp/carts/${clientId}` (treats clientId as a cartItemId)
Correct: `DELETE /dapp/carts/client/${clientId}` (clears all cart items for a client)

Same bug repeated at line 3151 inside the 409 retry.

**Bug 3 -- Unnecessary shipping update**

Benjamin's address is already on the Dr. Green API (confirmed by screenshot). The shipping PATCH/PUT fails due to scope restrictions but is unnecessary. Add a pre-check: fetch the client first, and if `shipping.address1` is non-empty, skip the shipping update entirely.

**Changes in `supabase/functions/drgreen-proxy/index.ts`:**

- **Line 2997-3095 (Step 1)**: Before attempting shipping PATCH, call `GET /dapp/clients/${clientId}` to check if `shipping.address1` exists. If non-empty, set `shippingVerified = true` and skip the entire PATCH/PUT block.

- **Line 3100**: Change `DELETE /dapp/carts/${clientId}` to `DELETE /dapp/carts/client/${clientId}`

- **Line 3107-3177 (Step 2)**: Replace batch cart add with individual item additions:
  - Remove `cartPayload` object with `clientCartId` and `items` array
  - Loop through `cartItems` and send individual `POST /dapp/carts` calls with `{ clientId, strainId, quantity }`
  - Add 300ms delay between items to avoid rate limiting
  - If any individual add returns 409, clear cart via `DELETE /dapp/carts/client/${clientId}` and retry the full sequence

- **Line 3151**: Change `DELETE /dapp/carts/${clientId}` to `DELETE /dapp/carts/client/${clientId}` (inside 409 retry)

- **Lines 3229-3307 (Fallback)**: Remove the "direct order" fallback that sends `items` and `shippingAddress` in the order body. The Postman collection confirms `POST /dapp/orders` only takes `{ clientId }` -- items must be in the cart first. Replace with a second attempt at the cart flow after a longer delay.

- **Line 3370-3381 (get-orders)**: Add support for the Postman endpoint `GET /dapp/client/${clientId}/orders` as a fallback if the query-param approach returns empty.

---

### Part 2: Navigation Menu UX/UI

**`src/components/NavigationMenu.tsx`** (Desktop)
- Add glassmorphism hover pill: `hover:bg-white/10 hover:backdrop-blur-sm rounded-lg`
- Animated underline slides from left using framer-motion `layoutId` for smooth transitions
- Persistent cart icon (always visible, dimmed when empty, gold badge with count when items exist)
- Increase item spacing for premium breathing room

**`src/layout/Header.tsx`**
- Warmer forest green navbar background (`hsl(150, 25%, 18%)`) matching admin panel
- Gold separator becomes gradient fade (`from-transparent via-[#EAB308]/40 to-transparent`)
- Scrolled state: stronger `backdrop-blur-xl`
- Logo cross-fade uses spring physics

**`src/components/NavigationOverlay.tsx`** (Mobile)
- Earthy forest gradient background
- Staggered slide-in animation (50ms offset per item, `translateX(-20px)` ease-out)
- Active item gets glowing gold left border with subtle shadow
- Close button micro-rotation on press

**`src/components/AnimatedMenuButton.tsx`**
- Bar colors updated to warmer forest palette
- Micro-scale pulse on initial render

---

### Part 3: Site-Wide Color Scheme (Matching Admin Panel)

**`src/styles/theme.css`**

Light Mode:
- `--primary`: `175 42% 35%` becomes `160 38% 32%` (warmer sage-green)
- `--navbar-teal` / `--navbar-forest`: becomes `150 25% 18%` (earthy forest)
- `--card`: parchment warmth `150 8% 98%`
- `--accent`: warmer sage `158 30% 90%`

Dark Mode:
- `--background`: `180 8% 7%` becomes `150 10% 6%` (warmer)
- `--card`: `150 8% 10%`
- `--primary`: `155 35% 40%`

**`src/styles/navigation.css`**
- Nav tokens aligned to new forest values
- Overlay gradient updated

---

### Part 4: Shop Hero -- Animated Strain Carousel

**New file: `src/components/shop/StrainHeroCarousel.tsx`**

An auto-scrolling marquee filling the empty hero space between the title and product grid:
- Infinite horizontal scroll via CSS `@keyframes marquee` (performant)
- Glassmorphism cards showing: strain name, category badge (Sativa/Indica/Hybrid), THC/CBD percentages
- Pause on hover with subtle scale-up and glow
- Click navigates to strain detail page
- Mobile: single card with horizontal swipe
- Data from existing `strains` table (first 8-10 strains)
- Skeleton fallback while loading

**`src/pages/Shop.tsx`**
- Insert `StrainHeroCarousel` between hero section and product grid
- Reduce hero bottom padding to accommodate carousel
- Stronger gradient overlay for contrast

---

### Files Changed Summary

| File | Change | Area |
|------|--------|------|
| `supabase/functions/drgreen-proxy/index.ts` | Fix cart payload (individual items with `clientId`), fix cart clear path (`/client/`), add shipping skip check, remove invalid direct-order fallback, add client-orders endpoint fallback | Order flow |
| `src/components/NavigationMenu.tsx` | Glassmorphism hover, animated underline, persistent cart | Nav UX |
| `src/layout/Header.tsx` | Warmer forest navbar, gradient separator, spring logo | Nav UX |
| `src/components/NavigationOverlay.tsx` | Earthy gradient, staggered animations, glowing active | Nav UX |
| `src/components/AnimatedMenuButton.tsx` | Forest palette, micro pulse | Nav UX |
| `src/styles/theme.css` | Earthy sage-forest palette (light + dark) | Color |
| `src/styles/navigation.css` | Nav tokens aligned to new palette | Color |
| `src/pages/Shop.tsx` | Insert carousel, adjust hero padding | Shop hero |
| `src/components/shop/StrainHeroCarousel.tsx` | **New** -- Animated strain marquee | Shop hero |

Total: 8 files modified, 1 new file created.

