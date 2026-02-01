
# Plan: Fix Client Details Access for Checkout + Admin Address Updates

## Status: ✅ COMPLETE

## Changes Made

### 1. Edge Function Updates (`supabase/functions/drgreen-proxy/index.ts`)

- Added `get-my-details` and `update-shipping-address` to `OWNERSHIP_ACTIONS`
- Added `admin-update-shipping-address` to `ADMIN_ACTIONS`
- Added `get-my-details` case handler (calls GET `/dapp/clients/:clientId`)
- Added `admin-update-shipping-address` case handler (same logic as `update-shipping-address` but in ADMIN_ACTIONS)

### 2. Hook Updates (`src/hooks/useDrGreenApi.ts`)

- Updated `getClientDetails()` to use `get-my-details` action instead of `dapp-client-details`
- Added `adminUpdateShippingAddress()` method for admin use

---

## Action Classification After Changes

| Action | List | Who Can Use | Purpose |
|--------|------|-------------|---------|
| `get-my-details` | OWNERSHIP_ACTIONS | Users (own data only) | Fetch own client details + shipping |
| `update-shipping-address` | OWNERSHIP_ACTIONS | Users (own data only) | Update own shipping address |
| `dapp-client-details` | ADMIN_ACTIONS | Admins only | Fetch any client's details |
| `admin-update-shipping-address` | ADMIN_ACTIONS | Admins only | Update any client's address |

---

## Verification

- Edge function deployed successfully
- `get-my-details` correctly requires authentication (401) instead of admin-only (403)
- Users can now fetch their own client details for checkout
- Admins can update any client's address via `admin-update-shipping-address`

---

## Manual Testing Required

1. Login as Kayliegh and navigate to checkout
2. Verify shipping address auto-populates
3. Complete an order to confirm checkout works
