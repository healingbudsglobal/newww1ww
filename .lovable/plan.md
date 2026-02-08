

# Add Wallet-Email Mappings as a Dedicated Admin Route

## What Changes

Move the Wallet-Email Mappings component from being embedded in the admin dashboard into its own dedicated page with its own sidebar navigation entry, consistent with how other admin tools (Strains, Orders, Prescriptions, etc.) are organized.

## Changes Required

### 1. New Page: `src/pages/AdminWalletMappings.tsx`
Create a new page component that wraps the existing `WalletEmailMappings` component inside `AdminLayout` with a title and description, following the same pattern as other admin pages (e.g., `AdminStrains.tsx`, `AdminOrders.tsx`).

### 2. Update Sidebar Navigation: `src/layout/AdminLayout.tsx`
Add a new entry to the `navItems` array:
- Route: `/admin/wallet-mappings`
- Label: "Wallet Mappings"
- Icon: `Wallet` (from lucide-react, already imported in other files)

This will appear in the sidebar below "User Roles" since it is a security/access-related tool.

### 3. Add Route: `src/App.tsx`
Add a new lazy-loaded route:
- Path: `/admin/wallet-mappings`
- Component: `AdminWalletMappings`

### 4. Clean Up Dashboard: `src/pages/AdminDashboard.tsx`
- Remove the `WalletEmailMappings` import
- Remove the embedded `<WalletEmailMappings />` section (lines 701-704)
- The dashboard will remain focused on stats, quick actions, and tools

## Technical Details

### File: `src/pages/AdminWalletMappings.tsx` (new)
```tsx
import AdminLayout from "@/layout/AdminLayout";
import { WalletEmailMappings } from "@/components/admin/WalletEmailMappings";

const AdminWalletMappings = () => (
  <AdminLayout
    title="Wallet-Email Mappings"
    description="Manage wallet-to-email account linking for NFT-authenticated admin access"
  >
    <WalletEmailMappings />
  </AdminLayout>
);

export default AdminWalletMappings;
```

### File: `src/layout/AdminLayout.tsx`
- Import `Wallet` icon from lucide-react
- Add to `navItems` array after User Roles:
  `{ to: "/admin/wallet-mappings", label: "Wallet Mappings", icon: Wallet }`

### File: `src/App.tsx`
- Add lazy import: `const AdminWalletMappings = lazy(() => import("./pages/AdminWalletMappings"));`
- Add route: `<Route path="/admin/wallet-mappings" element={<AdminWalletMappings />} />`

### File: `src/pages/AdminDashboard.tsx`
- Remove import of `WalletEmailMappings`
- Remove the embedded section (lines 701-704)

No changes to the `WalletEmailMappings` component itself -- it already works as a standalone component.
