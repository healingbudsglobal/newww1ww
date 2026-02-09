

## Gate Admin Settings and Role Management to Root Admin Only

### Problem
Currently, all admin-tier users (including delegated NFT holder admins) can see and access Settings, Role Management, Wallet Mappings, and Developer Tools in the admin sidebar. These should be restricted to `root_admin` only.

### Changes

#### 1. AdminLayout — Conditional sidebar navigation
**File:** `src/layout/AdminLayout.tsx`

- Pass `isRootAdmin` from the existing `useUserRole()` hook (already called in AdminLayout)
- Split `secondaryNavItems` into two groups:
  - **Root-only items:** User Roles, Wallet Mappings, Settings, Developer Tools
  - **All-admin items:** (none currently, but the pattern supports future additions)
- Filter the secondary nav items based on `isRootAdmin` before rendering
- This applies to both desktop sidebar and mobile menu

#### 2. Route-level protection for root-only pages
**File:** `src/App.tsx`

- Wrap the following routes with a `RootAdminGuard` component:
  - `/admin/roles`
  - `/admin/wallet-mappings`
  - `/admin/settings`
  - `/admin/tools`

#### 3. New RootAdminGuard component
**File:** `src/components/RootAdminGuard.tsx` (new)

- Uses `useUserRole()` to check `isRootAdmin`
- If not root admin, shows "Access Denied" with redirect back
- If loading, shows spinner
- If root admin, renders children

### Technical Details

```text
Current sidebar:
+-- Dashboard
+-- Clients
+-- Orders
+-- Prescriptions
+-- Strains
+-- Strain Sync
+-- ─────────────
+-- User Roles        <-- root_admin only
+-- Wallet Mappings   <-- root_admin only
+-- Settings          <-- root_admin only
+-- Developer Tools   <-- root_admin only

After change:
- admin role sees: Dashboard, Clients, Orders, Prescriptions, Strains, Strain Sync
- root_admin sees: all of the above + User Roles, Wallet Mappings, Settings, Dev Tools
```

**No database changes required** — the `isRootAdmin` flag is already computed in `useUserRole()` from the existing `user_roles` table.

