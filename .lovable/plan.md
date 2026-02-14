

# Full UX/UI Audit: Healing Buds Platform

## Test Coverage

Tested across desktop (1920x1080), mobile (390x844), light mode, dark mode. Covered: Homepage, Research, The Wire, Eligibility, Shop/Strains, Support, About Us, Conditions, Dashboard, Orders, Traceability, Privacy Policy, Admin Portal, mobile menu, footer, and dark mode toggle.

---

## 1. CRITICAL ISSUES (Blocking)

### 1.1 "About Us" Missing from Navigation
- **Where**: Header nav (both desktop `NavigationMenu.tsx` and mobile `NavigationOverlay.tsx`)
- **Problem**: The "About Us" page exists at `/about` and is listed in i18n translations (`nav.aboutUs`), but it is NOT in the navigation menu items. Users cannot discover this page unless they click the footer link or type the URL.
- **Fix**: Add `{ path: '/about', label: 'About Us', icon: Info }` to `navItems` in both `NavigationMenu.tsx` and `NavigationOverlay.tsx`.

### 1.2 The Wire Page is Empty
- **Where**: `/the-wire`
- **Problem**: Shows "No articles yet. Check back soon!" -- this is the news/blog section and is prominent in the main nav. An empty page with a primary nav link undermines credibility for a healthcare platform.
- **Fix**: Either populate with content (seed articles), or hide from nav until content exists, or show a "Coming Soon" placeholder with more context.

### 1.3 Footer Links Not i18n-ized
- **Where**: `Footer.tsx`
- **Problem**: Section headers ("Patient", "Support", "Legal") and link labels ("Check Eligibility", "FAQ", "Contact Us", etc.) are hardcoded in English. Translation keys exist in `common.json` but are not used in the footer component.
- **Fix**: Replace hardcoded strings with `t('footer.xxx')` calls.

---

## 2. WARNINGS / UX Improvements

### 2.1 No "Dashboard" Link in Main Nav for Logged-In Patients
- **Where**: Desktop nav bar
- **Problem**: Authenticated patients must use the account dropdown to find "Dashboard". No direct nav item exists. The mobile overlay shows "Home" but no "Dashboard" either (it is under the user section).
- **Fix**: Consider showing a "Dashboard" nav item when the user is authenticated.

### 2.2 Order History Table Truncation on Mobile
- **Where**: `/orders` on mobile (390px)
- **Problem**: Order reference "LOCAL-20..." is truncated with ellipsis. The "Date", "Ref", "Actions" columns are cramped. Status badge overlaps reference text.
- **Fix**: Use a card-based layout on mobile instead of a table, or allow horizontal scroll.

### 2.3 Dashboard Shipping Address Shows "No shipping address on file"
- **Where**: `/dashboard` sidebar
- **Problem**: Despite the user having completed checkout with a shipping address, the dashboard still shows "No shipping address on file". The "Add" button is present but the existing address is not loaded from either the local DB or Dr Green API.
- **Fix**: Pull shipping address from `drgreen_clients` table on dashboard load.

### 2.4 Debug UI Elements Visible to All Users
- **Where**: `/shop` page
- **Problem**: "Dr Green API", "Connecting...", and "Debug" labels are visible at the bottom of the strain listing. These are development tools and should be hidden in production or restricted to admin users only.
- **Fix**: Conditionally render debug elements based on `isAdmin` flag or an environment variable.

### 2.5 WalletConnect 403 Error in Console
- **Where**: Every page load
- **Problem**: `pulse.walletconnect.org` returns 403. The WalletConnect integration is loading on every page but failing silently. This adds unnecessary network overhead.
- **Fix**: Either configure the WalletConnect project ID correctly or lazy-load the wallet provider only on pages that need it.

### 2.6 Country Shows "PT" Instead of Full Name
- **Where**: Dashboard sidebar Account section
- **Problem**: Country displays as ISO code "PT" rather than "Portugal". Non-technical users won't understand ISO codes.
- **Fix**: Map ISO codes to full country names for display.

### 2.7 Mobile Header Missing Language Switcher on Initial View
- **Where**: Mobile header bar (390px)
- **Problem**: Only dark mode toggle and hamburger are visible. Language switcher is only accessible inside the mobile menu overlay, not the header bar directly. This is fine per the spec, but inconsistent with desktop where it is always visible.
- **Severity**: Low -- current behavior is acceptable.

### 2.8 "Learn More About Our Standards" Button on Homepage Goes Nowhere Meaningful
- **Where**: Homepage bottom section, just above the CTA
- **Problem**: Not clear where this links. Need to verify it routes to a valid page (likely `/about` or `/traceability`).
- **Fix**: Verify the link target and ensure it resolves to existing content.

### 2.9 Footer "Contact Us" and "FAQ" Both Link to `/support`
- **Where**: Footer Support column
- **Problem**: Both "FAQ" and "Contact Us" link to the same `/support` page. This is slightly redundant.
- **Fix**: Consider using anchor links (`/support#faq`, `/support#contact`) if the support page has distinct sections.

### 2.10 "Shipping Info" Footer Link Uses Hash (`/support#delivery`)
- **Where**: Footer
- **Problem**: The hash `#delivery` may not scroll to a section if the support page doesn't have a matching anchor. Need to verify this actually works.
- **Fix**: Ensure the support page has an `id="delivery"` section.

---

## 3. FUNCTIONAL ISSUES

### 3.1 Admin Dashboard Stats Show Dashes Instead of Numbers
- **Where**: `/admin` on mobile
- **Problem**: "Registered Clients", "Total Orders", "Pending Approvals", "Verified and Active" all show dashes (--) instead of actual counts. Either the data is loading slowly, or the API call is failing silently on this viewport.
- **Fix**: Add loading skeletons and verify the admin stats query runs correctly.

### 3.2 "Reorder" Button on Orders Page -- Untested Behavior
- **Where**: `/orders` table, "Reorder" action
- **Problem**: The Reorder button is present but its behavior when clicked is unknown. If it adds the same items to cart, verify it handles out-of-stock or discontinued strains gracefully.
- **Fix**: Test this flow; ensure error handling for unavailable products.

---

## 4. DARK MODE ISSUES

### 4.1 Dark Mode Has Minimal Visual Difference
- **Where**: All pages
- **Problem**: Most page content sections (Research, About, Conditions, Support, Eligibility) use the same teal/white color scheme in both modes. The dark mode toggle works (sun/moon icon switches) but the content areas do not change meaningfully. The header and footer are already dark-themed by default.
- **Fix**: Review each page section's background and text colors to ensure they respond to the dark class. Many sections may use hardcoded colors (e.g., `bg-[#1A2E2A]`) instead of CSS variables.

---

## 5. ACCESSIBILITY

### 5.1 Mobile Menu: Focus Trap is Implemented (Pass)
- Focus trap hook is active in `NavigationOverlay.tsx`. Verified it uses `useFocusTrap(isOpen)`.

### 5.2 Scroll Progress Bar Lacks ARIA
- **Where**: Header progress bar
- **Problem**: The scroll progress bar has no `role="progressbar"` or `aria-label`. Screen readers cannot interpret it.
- **Fix**: Add `role="progressbar"` and `aria-valuenow`.

---

## 6. PASS - What Works Well

| Area | Status |
|------|--------|
| Homepage hero and CTAs | PASS - clean, professional, trust badges visible |
| Navigation collapse at breakpoint | PASS - xl breakpoint correctly hides/shows |
| Mobile hamburger menu | PASS - overlay works, items are clear, close works |
| Cookie consent banner | PASS - POPIA compliant, accept/decline visible |
| Eligibility page for verified users | PASS - shows "You're Verified" with browse CTA |
| Shop page filters and product grid | PASS - strain type, effects, terpene filters work |
| Patient dashboard layout | PASS - verification status, documents, dosage tracker |
| Admin portal structure | PASS - sidebar nav, role protection working |
| Footer layout and Dr Green branding | PASS - clean, informative |
| Route protection (admin routes) | PASS - uses ProtectedRoute with role check |
| Account dropdown menu | PASS - role-aware, shows admin/patient label |
| Privacy Policy page content | PASS - POPIA compliant, well-structured |
| Conditions page with categories | PASS - Pain, Psychiatry, Neurology grouped well |
| Scroll progress bar | PASS - smooth spring animation |

---

## Summary Verdict: CONDITIONAL PASS

The site is visually polished and functionally strong. The primary gaps are:
1. Missing "About Us" in navigation (easy fix)
2. Empty "The Wire" page undermining credibility (content needed)
3. Debug UI visible to non-admin users on shop page
4. Footer not using i18n translations
5. Dashboard not loading saved shipping address

None of these are blocking for basic patient flows (eligibility check, browse strains, checkout) but they should be addressed before public launch.

---

## Technical Implementation Summary

| File | Changes Needed |
|------|---------------|
| `src/components/NavigationMenu.tsx` | Add About Us nav item |
| `src/components/NavigationOverlay.tsx` | Add About Us nav item |
| `src/components/Footer.tsx` | Use i18n `t()` for all strings |
| `src/components/shop/ProductGrid.tsx` (or parent) | Hide debug UI for non-admins |
| `src/pages/PatientDashboard.tsx` | Load shipping address from DB |
| `src/pages/Shop.tsx` | Hide "Dr Green API" / "Debug" for non-admin |
| Various page components | Audit dark mode CSS variable usage |

