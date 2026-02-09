

# Header & Admin UX Improvements

## Issues Identified

1. **"Check Eligibility" visible for admin** -- The eligibility CTA should be completely hidden for admin users
2. **No admin account dropdown** -- Admin needs a dropdown showing their email and account info instead of separate Portal/Logout buttons
3. **Portal button shows text** -- Should be icon-only to save space
4. **Nav bar crowded** -- Too many items competing for space (Language, Theme, Cursor toggle, Wallet, KYC badge, Eligibility CTA, Portal, Logout)
5. **Nav links hard to see** -- Contrast/spacing can be improved

## Changes

### 1. Replace Portal + Logout with Admin Account Dropdown (`src/layout/Header.tsx`)

When logged in as admin, replace the separate "Portal" link + "Logout" button with a single dropdown that shows:
- **Trigger**: Shield icon + truncated email (e.g., "scott@heal...")
- **Dropdown content**:
  - Email address (full, as label)
  - Role badge ("Admin")
  - Separator
  - "Admin Portal" link (with Shield icon)
  - "Patient Dashboard" link (with LayoutDashboard icon)
  - Separator
  - "Sign Out" (with LogOut icon)

For patient users, show a similar dropdown:
- **Trigger**: User icon + truncated email
- **Dropdown content**:
  - Email address
  - "Dashboard" link
  - Separator
  - "Sign Out"

### 2. Remove "Check Eligibility" for Admin (`src/layout/Header.tsx`)

The `shouldHideEligibilityCTA` logic already checks `isAdmin`, but timing issues with role loading may cause a flash. We will:
- Ensure the CTA is hidden while `roleLoading` is true (don't show it during loading)
- Keep the existing `isAdmin` check

### 3. Remove KYC Badge and Wallet Button for Admin (`src/layout/Header.tsx`)

Admins don't need the KYC status badge or the eligibility CTA. Clean up the right actions area:
- Hide KYC badge for admins (already done)
- Hide "Check Eligibility" for admins (fix loading state)
- Potentially hide wallet connect for admin email users (they logged in via email, not wallet)

### 4. Streamline Right Actions (`src/layout/Header.tsx`)

Reorganize the right side of the nav bar for clarity:
- Language switcher + Theme toggle (utility group)
- Wallet button (only if relevant)
- Account dropdown (single unified control replacing Portal + Logout)

Remove the cursor toggle button from the header if present -- it's not a critical nav action.

### 5. Improve Nav Link Visibility (`src/components/NavigationMenu.tsx`)

- Increase text opacity from `text-white/85` to `text-white/90` for inactive items
- Slightly increase gap between items from `gap-1` to `gap-1.5`
- Keep icons at smaller size to save space

---

## Technical Summary

| File | Change |
|------|--------|
| `src/layout/Header.tsx` | Replace Portal+Logout with unified account dropdown; hide eligibility CTA during role loading; streamline right actions |
| `src/components/NavigationMenu.tsx` | Improve link visibility with better contrast and spacing |

## Account Dropdown Design

```text
+---------------------------+
| scott@healingbuds.global  |
| Role: Admin               |
|---------------------------|
| Shield  Admin Portal      |
| Grid    Patient Dashboard |
|---------------------------|
| LogOut  Sign Out           |
+---------------------------+
```
