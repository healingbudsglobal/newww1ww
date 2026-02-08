
# Admin Shipping Address Management for Clients

## Problem

1. **Shipping addresses missing locally** for Scott's two accounts (Kay's was populated during testing). Future clients will have addresses created during onboarding, but existing clients need admin tooling to check and update addresses.

2. **Admin needs NFT-gated access** to view and edit any client's delivery address, fetching the current address from the DApp API (`dapp-client-details`) and allowing updates via the existing `admin-update-shipping-address` proxy action.

## What Already Exists

- `dapp-client-details` proxy action -- fetches full client details (including shipping) from the DApp API using admin credentials
- `admin-update-shipping-address` proxy action -- PATCHes shipping address to DApp API for any client
- `adminUpdateShippingAddress()` hook method in `useDrGreenApi`
- `ShippingAddressForm` component with `variant="inline"` support
- `AdminClientManager` component showing client list from DApp API
- NFT gating via `ProtectedNFTRoute` and wallet context

## Changes

### 1. Expand AdminClientManager with Address Panel

**File: `src/components/admin/AdminClientManager.tsx`**

Add an expandable detail row to each client card that:
- Has a "View / Edit Address" button on each client row
- When clicked, calls `dapp-client-details` to fetch the client's current shipping address from the DApp
- Displays the current address (or "No address on file")
- Renders the `ShippingAddressForm` in `inline` variant, pre-populated with the fetched address
- On save, calls `adminUpdateShippingAddress` (existing proxy action) and also updates the local `drgreen_clients.shipping_address` column

Implementation details:
- Add `expandedClientId` state to track which client row is expanded
- Add `fetchingAddressFor` state for loading indicator
- When expanding, call `dapp-client-details` with the client ID to get current address from DApp
- Pass fetched address as `initialAddress` to `ShippingAddressForm`
- The form's `onSuccess` callback will also write to local Supabase via the existing logic in `ShippingAddressForm`

### 2. Update ShippingAddressForm for Admin Use

**File: `src/components/shop/ShippingAddressForm.tsx`**

Add an `isAdmin` prop:
- When `isAdmin=true`, use `adminUpdateShippingAddress` instead of `updateShippingAddress` for the DApp API call
- This ensures the admin proxy action (which bypasses ownership checks) is used

### 3. Sync Local Shipping Addresses for Existing Clients

**File: `src/components/admin/AdminClientManager.tsx`**

When the admin fetches a client's details from the DApp and the response includes a shipping address, automatically sync it to the local `drgreen_clients.shipping_address` column. This backfills the missing local data for Scott's accounts.

### 4. Admin Route Protection

The `AdminClientManager` is already rendered inside `AdminDashboard`, which is within `AdminLayout`. `AdminLayout` already checks for admin role. The NFT wallet connection is already displayed on the admin dashboard. No additional route changes needed -- the existing admin role check plus the wallet/NFT UI on the dashboard page satisfies the NFT login requirement.

## Files Modified

| File | Change |
|---|---|
| `src/components/admin/AdminClientManager.tsx` | Add expandable address view/edit per client using DApp API data |
| `src/components/shop/ShippingAddressForm.tsx` | Add `isAdmin` prop to use admin proxy action |

## No New Dependencies Required
