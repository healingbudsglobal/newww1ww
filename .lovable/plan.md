
## Admin Portal Overhaul: Visual Upgrade, Team Consolidation, and Image Regeneration

### Overview
A comprehensive update to the admin portal covering three areas: (1) allowing regeneration of existing article images, (2) a visual overhaul of the entire admin portal with an earthy green colour palette inspired by your reference images, and (3) consolidating User Roles + Wallet Mappings into a unified "Team and Access" section with a new Commission management tab.

### Colour Palette Update (from reference images)

The new admin palette draws from the earthy green harmony you provided:

```text
#344E41  - Forest green (sidebar bg, primary accents)
#3A5A40  - Muted green (nav hover, secondary surfaces)
#588157  - Fir green (active states, buttons)
#A3B18A  - Sage (muted text, borders, secondary badges)
#DAD7CD  - Parchment (background, card surfaces)
#C8D1D3  - Cool sage (light surfaces)
#8AA894  - Soft green (input borders, dividers)
#D4B925  - Gold accent (commission highlights, warnings)
```

These will be added as new admin-specific CSS custom properties in `theme.css` and referenced in `AdminLayout.tsx`.

### Changes

#### 1. Article Image Generator -- Regenerate Existing Images
**File:** `src/components/admin/ArticleImageGenerator.tsx`
- Add a "Show all articles" toggle switch at the top
- When enabled, fetch ALL articles (not just those missing images), showing current featured image as a small thumbnail
- For articles with existing images: show "Regenerate" button that enters the same preview/publish flow
- The existing preview/publish workflow handles the rest seamlessly

#### 2. Remove Prescriptions from Navigation and Routes
**Files:** `src/layout/AdminLayout.tsx`, `src/App.tsx`
- Remove the Prescriptions nav item from `navItems` array
- Remove the `/admin/prescriptions` route from App.tsx
- Keep the page file (no deletion needed, just unreferenced)

#### 3. Consolidate into "Team and Access" Page
**Files:** `src/App.tsx`, `src/layout/AdminLayout.tsx`
- Replace separate "User Roles" and "Wallet Mappings" nav items with a single "Team and Access" item at `/admin/team`
- Remove individual `/admin/roles` and `/admin/wallet-mappings` routes, add `/admin/team`

**New file:** `src/pages/AdminTeam.tsx`
- Three tabs: "Roles" | "Wallet Mappings" | "Commissions"
- Roles tab embeds existing `AdminUserRoles` component
- Wallet Mappings tab embeds existing `WalletEmailMappings` component
- Commissions tab uses new `TeamCommissions` component

**New file:** `src/components/admin/TeamCommissions.tsx`
- Table/card layout showing team members with: Display Name, Role Type, ETH Wallet Address, Commission Percentage, Active status
- "Add Member" dialog with fields: name, role (dropdown: admin, affiliate, agent, employee, referral), ETH wallet address (with 0x validation), commission percentage
- Edit and deactivate existing members
- Mobile-first: cards on small screens, table on desktop
- Note: "All commission payouts are settled on-chain to the attached ETH wallet"

**Database migration:** Create `team_commissions` table:
```text
id           uuid (PK, default gen_random_uuid)
user_id      uuid (nullable, for linking to auth users later)
display_name text (not null)
role_type    text (not null) -- admin, affiliate, agent, employee, referral
wallet_address text -- ETH address
commission_percentage numeric(5,2) default 0
is_active    boolean default true
notes        text (nullable)
created_at   timestamptz default now()
updated_at   timestamptz default now()
```
RLS: Only users with admin role can read/write (using existing `user_roles` check pattern).

#### 4. Admin Portal Visual Overhaul
**File:** `src/styles/theme.css`
- Add new CSS custom properties for the earthy green admin palette:
  - `--admin-bg`, `--admin-sidebar`, `--admin-sidebar-hover`, `--admin-sidebar-active`
  - `--admin-surface`, `--admin-accent`, `--admin-gold`
- Dark mode variants that deepen these tones

**File:** `src/layout/AdminLayout.tsx` -- Major visual redesign:
- Sidebar: Deep forest green gradient background (`#344E41` to `#3A5A40`), frosted glass effect with `backdrop-blur-xl`
- Nav items: White text on dark green, pill-shaped active indicator with sage glow, subtle hover transitions
- Logo area: Refined with brand accent bar underneath
- Mobile header: Sleeker with forest green accent strip at top
- Page header: Larger typography with gradient underline accent
- Content area: Warm parchment background (`#DAD7CD` mapped) for contrast

**File:** `src/components/admin/AdminClientManager.tsx` -- Mobile-first redesign:
- Summary stats as a 2x2 grid of compact metric cards at top (Total, Pending, Verified, Rejected) with coloured indicators matching the earthy palette
- Filter: Pill-style toggle group instead of full-width tabs
- Search: Full-width on mobile with rounded styling
- Client list on desktop: Clean table-style rows with inline status, actions in a dropdown
- Client list on mobile: Stacked cards showing name + status badge at a glance, expandable for details
- Remove excessive nested `TooltipProvider` wrappers (already provided at App level)
- Dr. Green Portal link moved into a dropdown menu to reduce toolbar clutter

**File:** `src/pages/AdminClients.tsx`
- Move `AdminClientCreator` into a collapsible panel or dialog trigger to reduce initial page density

### File Summary

| File | Action |
|------|--------|
| `src/styles/theme.css` | Edit -- add admin earthy green palette tokens |
| `src/layout/AdminLayout.tsx` | Edit -- visual overhaul with earthy sidebar, nav restructure |
| `src/App.tsx` | Edit -- route changes (remove prescriptions, roles, wallet-mappings; add team) |
| `src/components/admin/ArticleImageGenerator.tsx` | Edit -- add "show all" toggle for regeneration |
| `src/components/admin/AdminClientManager.tsx` | Edit -- mobile-first redesign with metric cards |
| `src/pages/AdminClients.tsx` | Edit -- collapsible client creator |
| `src/pages/AdminTeam.tsx` | Create -- unified team and access page with tabs |
| `src/components/admin/TeamCommissions.tsx` | Create -- commission management component |
| Database migration | Create `team_commissions` table with admin-only RLS |
