

# Fix: Single-Resource GET Endpoints Returning 401

## Problem Identified

The Dr. Green API requires a non-empty signature payload for all authenticated requests. Currently:

- **Working**: `dapp-clients` (list) signs query string `orderBy=desc&take=10&page=1` -- returns 200
- **Failing**: `get-client` and `dapp-client-details` sign an empty string `""` -- returns 401

The API rejects signatures over empty strings for `/dapp/*` endpoints.

## Root Cause

In `drGreenRequestGet()` (line 1220), when `queryParams` is `{}`, the query string is empty, so the signature is generated over `""`. The Dr. Green API does not accept this for dApp-scoped endpoints.

## Fix

Update all single-resource GET endpoint calls that currently pass empty query params `{}` to include at minimum a dummy pagination param (matching the pattern used by working endpoints). This ensures the signature is always generated over actual data.

### Affected Actions

| Action | Current Call | Fix |
|--------|------------|-----|
| `get-client` (line 2659) | `drGreenRequestQuery('/dapp/clients/{id}', {})` | Add `{ orderBy: 'desc', take: 1, page: 1 }` |
| `dapp-client-details` (line 2321) | `drGreenRequestQuery('/dapp/clients/{id}', {})` | Add `{ orderBy: 'desc', take: 1, page: 1 }` |
| `get-my-details` | Uses same pattern via `drGreenRequestQuery` | Same fix |
| `get-cart` (line 2718) | `drGreenRequestQuery('/dapp/carts/{id}', {})` | Add `{ orderBy: 'desc', take: 1, page: 1 }` |

### Technical Changes

**File**: `supabase/functions/drgreen-proxy/index.ts`

1. For each affected action, replace empty `{}` query params with `{ orderBy: 'desc', take: 1, page: 1 }` to ensure there's always a non-empty query string to sign
2. Redeploy the edge function
3. Test `get-client` with client ID `dfd81e64-c17d-4a1b-8111-cdf49f879e82` to confirm 200 response

### Verification

After deployment:
- Test `get-client` action with the target client ID
- Test `get-my-details` for the logged-in user
- Confirm the dashboard/status page stops showing 401 errors

