

# Fix Cookie Consent Banner Overlay Issues

## Problem
The cookie consent banner conflicts with other fixed-position elements on the page, particularly:
- **Mobile**: The banner (z-index 9999, fixed bottom) completely covers the `MobileBottomActions` bar (z-index 60), blocking the "Check Eligibility" CTA -- a compliance-critical element
- **Desktop**: The banner can overlap with the `BackToTop` button and `FloatingCartButton` on shop pages
- **No mobile-aware positioning**: The banner renders at the same position on all screen sizes without accounting for the mobile action bar

## Solution

### 1. Adjust mobile positioning in `CookieConsentBanner.tsx`
- On mobile (below `lg` breakpoint), shift the banner **above** the `MobileBottomActions` bar by adding extra bottom padding/margin (approximately `bottom-28` instead of `bottom-4`)
- Keep the desktop positioning as-is (bottom-right corner, max-width card)

### 2. Lower z-index to a sensible level
- Change from `z-[9999]` to `z-[70]` -- above `MobileBottomActions` (z-60) but below navigation overlays (z-[100]+)
- This prevents the banner from trapping focus away from critical navigation elements

### 3. Add safe-area-inset support
- On mobile devices with notches/home indicators, respect `env(safe-area-inset-bottom)` so the banner doesn't hide behind system chrome

## Technical Details

**File: `src/components/CookieConsentBanner.tsx`**

Changes to the root `motion.div`:
- Update className: `bottom-4 left-4 right-4` becomes `bottom-28 left-4 right-4` on mobile (to clear the MobileBottomActions bar) and `md:bottom-6` on desktop
- Change `z-[9999]` to `z-[70]`
- Add `pb-[env(safe-area-inset-bottom)]` for safe area support

**No changes needed to:**
- `useConsentManager.ts` (logic is correct)
- `MobileBottomActions.tsx` (positioning is correct)
- `BackToTop.tsx` (already at z-40, no conflict once banner z-index is lowered)

