
# Fix: Ensure Clients Are Visible and API Connections Are Healthy

## Current State (Verified)

### What's Working
- API health check returns `healthy` (credentials valid, API reachable, 491ms latency)
- `DRGREEN_API_KEY` and `DRGREEN_PRIVATE_KEY` secrets are configured
- Signing logic correctly uses secp256k1 ECDSA with proper PEM detection and DER extraction
- GET endpoints (`dapp-clients`, `get-clients-summary`) correctly use `drGreenRequestQuery` (query-string signing)
- Both `kayliegh.sm@gmail.com` and `scott.k1@outlook.com` exist as auth users in the database

### What's Failing
- **Every recent proxy request returns 401 "Authentication required"** -- the proxy logs show "Unauthenticated request to dapp-clients" and "Unauthenticated request to get-clients-summary"
- This means the admin is **not logged into Supabase auth** when visiting the admin pages, so the JWT is missing from requests
- The `drgreen_clients` table is **empty** -- no local client records exist at all
- Only `scott@healingbuds.global` has the admin role; neither `kayliegh.sm@gmail.com` nor `scott.k1@outlook.com` have admin

## Root Cause

The proxy requires a valid Supabase JWT for admin endpoints. The `supabase.functions.invoke` call in `useDrGreenApi` automatically attaches the JWT **only if the user has an active Supabase session**. If the user visits `/admin/clients` without being logged in, every admin API call fails silently with 401.

The two client emails need to be pulled from the Dr. Green DApp API (they may already be registered there via the DApp directly). Once an admin is logged in and visits the client manager, the API call to `/dapp/clients` should return them.

## Changes Required

### 1. Auto-redirect to login if not authenticated on admin pages
**File: `src/layout/AdminLayout.tsx`**

Add an auth check: if no active Supabase session exists, redirect to `/auth` with a return URL. This prevents the confusing "0 clients" state when the admin simply isn't logged in.

```text
Flow:
  User visits /admin/clients
    -> AdminLayout checks session
    -> No session? Redirect to /auth?redirect=/admin/clients
    -> After login, redirect back to admin page
    -> JWT is now attached to all proxy calls
    -> Clients load from Dr. Green API
```

### 2. Sync Dr. Green API clients to local database on admin fetch
**File: `src/components/admin/AdminClientManager.tsx`**

After successfully fetching clients from the Dr. Green API, upsert them into the local `drgreen_clients` table. This ensures the local cache stays populated for ownership checks and ShopContext lookups. Currently the local table is empty because no one has gone through the onboarding flow on Healing Buds -- all clients were registered directly on the DApp.

Changes:
- After `clientsResult` returns successfully, iterate over the client list
- For each client, upsert into `drgreen_clients` with `drgreen_client_id`, `email`, `full_name`, `is_kyc_verified`, `admin_approval`, `country_code`
- Match existing auth users by email to set the `user_id` foreign key
- This is a background sync -- it should not block the UI

### 3. Map auth users to their Dr. Green client IDs on login
**File: `src/context/ShopContext.tsx`**

When a user logs in, after the auth state change, check if their email matches a `drgreen_clients` record. If not, try to find them via the Dr. Green API (search by email). If found, create the local mapping so the user can access their client data, cart, and orders.

Changes:
- In the `onAuthStateChange` handler, after successful login:
  - Check `drgreen_clients` for a record matching the user's email
  - If not found, call `drgreen-proxy` with action `dapp-clients` and `search` param set to the user's email
  - If a match is found, insert a new `drgreen_clients` record linking the auth user to the Dr. Green client ID
  - This auto-maps `kayliegh.sm@gmail.com` and `scott.k1@outlook.com` to their Dr. Green records on next login

### 4. Clean up stale credential secrets
**No code change -- informational**

The secrets `DRGREEN_WRITE_API_KEY`, `DRGREEN_WRITE_PRIVATE_KEY`, `DRGREEN_ALT_API_KEY`, and `DRGREEN_ALT_PRIVATE_KEY` are legacy and unused. The architecture uses a single credential set per environment. These could be removed to reduce confusion, but are not causing any issues.

## Technical Details

### Key Conversion (Verified Correct)
The current key conversion pipeline:
1. Base64-decode the stored secret
2. Detect PEM format (handles truncated headers like `---\n`)
3. Extract Base64 body from PEM, decode to DER bytes
4. Check for secp256k1 OID (`2b8104000a`) in the DER
5. Parse PKCS#8 or SEC1 structure to extract the raw 32-byte private key
6. Sign with `@noble/secp256k1` using SHA-256 hash
7. Convert compact signature (r||s) to DER format
8. Return Base64-encoded DER signature

This matches the Dr. Green API's expected signing method. The health check confirms it works.

### API Connection (Verified Healthy)
```text
Status: healthy
Credentials: ok (API credentials configured)
Connectivity: ok (API reachable, 491ms)
```

## Expected Outcome
- Admin pages redirect to login if session is missing
- After admin login, `/admin/clients` loads both `kayliegh.sm@gmail.com` and `scott.k1@outlook.com` from the Dr. Green API
- Client records are synced to local `drgreen_clients` table for future lookups
- When `kayliegh.sm@gmail.com` or `scott.k1@outlook.com` log in, they are auto-mapped to their Dr. Green client ID
- All verification status, KYC, and admin approval reflect live DApp data
