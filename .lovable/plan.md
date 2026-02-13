

# Dr. Green Integration Fix -- Complete Re-Homing and Checkout Hardening

## Overview

This plan implements the full client re-homing system, checkout auto-fix guard, admin management UI, and order sync tracking. It builds on existing infrastructure -- the `admin-reregister-client` action already works in `drgreen-proxy`, and the orders table already tracks sync status.

## Current State

- **drgreen_clients table**: Empty (no users have logged in yet). Schema has: `id`, `user_id`, `drgreen_client_id`, `country_code`, `is_kyc_verified`, `admin_approval`, `kyc_link`, `email`, `full_name`, `shipping_address`
- **drgreen_orders table**: Already has `sync_status`, `sync_error`, `synced_at`, `client_id`, `shipping_address`, `customer_email`, `customer_name`, `country_code`, `currency`
- **drgreen-proxy**: Already has `admin-reregister-client` action (creates client under current API keys)
- **3 user accounts**: `scott.k1@outlook.com`, `kayliegh.sm@gmail.com` (regular), `healingbudsglobal@gmail.com` (admin)

## Phase 1: Database Schema Enhancement (Migration)

Add re-homing tracking columns to `drgreen_clients`:

```sql
ALTER TABLE drgreen_clients
  ADD COLUMN IF NOT EXISTS old_drgreen_client_id TEXT,
  ADD COLUMN IF NOT EXISTS rehome_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS rehome_error TEXT,
  ADD COLUMN IF NOT EXISTS rehomed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS api_key_scope TEXT;
```

- `old_drgreen_client_id`: preserves the previous client ID before re-homing
- `rehome_status`: `none` | `pending` | `success` | `failed`
- `rehome_error`: stores error details if re-homing fails
- `rehomed_at`: timestamp of successful re-homing
- `api_key_scope`: tracks which API key created this client (first 8 chars of key)

## Phase 2: Batch Re-Homing Edge Function (`drgreen-rehome`)

New edge function that:
1. Queries all `drgreen_clients` where the client ID fails a live API health check (404/401 from Dr. Green)
2. For each broken client, calls `admin-reregister-client` via the existing proxy action
3. Processes in batches of 3 with 2-second delays to avoid API rate limiting
4. Updates local records with new `drgreen_client_id`, preserving old ID in `old_drgreen_client_id`
5. Sets `rehome_status` to `success` or `failed` with error details
6. Returns a summary: total processed, succeeded, failed, with per-client details

**File**: `supabase/functions/drgreen-rehome/index.ts`

## Phase 3: Single Client Re-Homing (Enhance Existing Proxy Action)

Enhance `admin-reregister-client` in `drgreen-proxy` to:
1. Save the old `drgreen_client_id` before overwriting
2. Update `rehome_status`, `rehomed_at`, and `api_key_scope` columns
3. Return more structured response with old vs new client ID

Also add a new action `auto-rehome-client` that:
- Can be called by the checkout flow (ownership-verified, not admin-only)
- Detects if the current client ID returns 404/401 from Dr. Green
- If broken, triggers re-registration automatically
- Updates local record and returns the new client ID

## Phase 4: Admin UI -- Client Re-Homing Management

Add a "Re-Homing" section to the Admin Dashboard with:

1. **Stats card**: Count of clients needing re-homing (broken scope)
2. **"Re-home All" button**: Triggers batch re-homing edge function
3. **Per-client status**: Table showing `rehome_status`, old/new IDs, errors
4. **Retry button**: For individual failed re-homes

**Files modified**:
- `src/pages/AdminDashboard.tsx` -- add re-homing stats card + quick action button
- `src/components/admin/AdminClientManager.tsx` -- add rehome status column and retry button

## Phase 5: Checkout Auto-Rehome Guard

Before creating an order in `Checkout.tsx`:
1. Call `get-client` to verify the current `drgreen_client_id` is valid
2. If it returns 404 or 401 (scope mismatch), trigger `auto-rehome-client`
3. If re-homing succeeds, continue with the new client ID
4. If re-homing fails, fall back to local order (existing `PENDING_SYNC` path)
5. Show a brief toast: "Updating your profile..." during re-homing

**File modified**: `src/pages/Checkout.tsx` -- add pre-flight check before `handlePlaceOrder`

## Phase 6: Enhanced Order Sync Tracking

Add admin visibility into order sync status:
1. Filter orders by `sync_status` in Admin Orders page (all / synced / pending / failed)
2. Show `sync_error` in order detail view
3. Add "Retry Sync" button for failed orders that re-attempts order creation on Dr. Green

**Files modified**:
- `src/pages/AdminOrders.tsx` -- add sync status filter tabs
- `src/pages/OrderDetail.tsx` -- show sync status badge and error

## Technical Details

### Files to Create
- `supabase/functions/drgreen-rehome/index.ts` -- batch re-homing edge function

### Files to Modify
- `supabase/functions/drgreen-proxy/index.ts` -- enhance `admin-reregister-client`, add `auto-rehome-client` action
- `src/pages/Checkout.tsx` -- add pre-flight client validation guard
- `src/pages/AdminDashboard.tsx` -- add re-homing stats and quick action
- `src/components/admin/AdminClientManager.tsx` -- add rehome status display
- `src/pages/AdminOrders.tsx` -- add sync status filter
- `src/pages/OrderDetail.tsx` -- show sync details

### Database Migration
Single migration adding 5 columns to `drgreen_clients` table.

### Execution Order
1. Run migration (adds columns)
2. Deploy `drgreen-rehome` edge function
3. Update `drgreen-proxy` with new action
4. Update frontend pages (Checkout, Admin)

### Safety
- All re-homing preserves old client IDs for audit trail
- Scott and Kay are real patients -- no test data created
- Local order fallback remains as safety net
- Batch processing uses rate limiting (3 at a time, 2s delay)
- Re-homing only triggers when API confirms client ID is broken (404/401)

