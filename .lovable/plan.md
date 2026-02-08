

# Re-Register Scott & Kayleigh in Dr. Green API

## Current State Analysis

Based on the codebase exploration:

1. **Admin Client Manager exists** (`src/components/admin/AdminClientManager.tsx`)
   - Has `handleReregister()` function that calls `reregisterClient()`
   - Shows clients fetched from Dr. Green API with filter tabs

2. **Re-registration endpoint exists** (`admin-reregister-client` action in drgreen-proxy)
   - Creates new client record in Dr. Green API under current API key pair
   - Generates new KYC link
   - Updates local `drgreen_clients` table with new `drgreen_client_id`

3. **Local database is empty**
   - `drgreen_clients` table: 0 records
   - `drgreen_orders` table: 0 records

## The Problem

Scott and Kayleigh's client records exist in the Dr. Green API (created under a previous API key pair), but:
- Their records are NOT linked to the current API credentials
- Orders created for them fail with 401 errors
- They need to be re-registered under the current API key

## Solution: Admin Dashboard Re-Registration

### Step 1: Access Admin Client Manager

Navigate to `/admin` and use the Client Management section to:
1. View all clients from the Dr. Green API
2. Find Scott and Kayleigh by searching their email addresses

### Step 2: Re-Register Each Client

For each client (Scott and Kayleigh):
1. Click the "Re-register" button (KeyRound icon) on their row
2. Confirm the re-registration dialog
3. The system will:
   - Call Dr. Green API `/dapp/clients` POST to create a new client
   - Store the new `drgreen_client_id` in local database
   - Generate a new KYC verification link
   - Reset their status to `PENDING`

### Step 3: Complete KYC Again

After re-registration, the clients will need to:
1. Click the new KYC link (copied to clipboard automatically)
2. Complete identity verification again
3. Wait for admin approval in Dr. Green DApp portal

---

## Technical Implementation

The re-registration flow is already implemented. Here's how it works:

```text
┌─────────────────────────────────────────────────────────────┐
│  Admin Dashboard → Client Management                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Admin clicks "Re-register" on client row                │
│     → handleReregister(client)                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  2. useDrGreenApi.reregisterClient() called                 │
│     Payload: { email, firstName, lastName, countryCode }    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  3. drgreen-proxy → admin-reregister-client action          │
│     - POST /dapp/clients with minimal medical record        │
│     - Uses current API key pair for signing                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Success Response:                                       │
│     - New clientId returned                                 │
│     - New kycLink generated                                 │
│     - Local drgreen_clients record updated                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Action Items

1. **Go to Admin Dashboard** (`/admin`)
2. **Find the Client Management section**
3. **Search for Scott** (by email) → Click re-register button
4. **Search for Kayleigh** (by email) → Click re-register button
5. **Send new KYC links** to each user
6. **Approve in Dr. Green DApp** after KYC completion

---

## Files Involved (No Changes Needed)

| File | Purpose |
|------|---------|
| `src/components/admin/AdminClientManager.tsx` | UI for re-registration |
| `src/hooks/useDrGreenApi.ts` | `reregisterClient()` method |
| `supabase/functions/drgreen-proxy/index.ts` | `admin-reregister-client` action |

The implementation is complete - you just need to use the admin dashboard to trigger re-registration for Scott and Kayleigh.

