

## Add `admin-list-all-clients` to DEBUG_ACTIONS

### What This Does
Allows querying the full Dr. Green API client list without browser authentication by passing the `x-admin-debug-key` header. This is specifically for testing purposes so we can look up Kayliegh and Scott.

### Change
**File:** `supabase/functions/drgreen-proxy/index.ts`

**Line 122** -- Add `'admin-list-all-clients'` to the `DEBUG_ACTIONS` array:

```typescript
// Before
const DEBUG_ACTIONS = ['create-client-legacy', 'admin-reregister-client'];

// After
const DEBUG_ACTIONS = ['create-client-legacy', 'admin-reregister-client', 'admin-list-all-clients'];
```

### How It Works
- The `admin-list-all-clients` action already exists and is fully implemented (lines 3426-3494)
- It already routes through `production-write` credentials (via `DAPP_ADMIN_READ_ACTIONS`)
- It paginates up to 500 clients (5 pages x 100) and returns name, email, KYC status, and admin approval
- Adding it to `DEBUG_ACTIONS` means when the `x-admin-debug-key` header matches the first 16 characters of `DRGREEN_PRIVATE_KEY`, authentication is bypassed
- This lets us call it directly via `curl_edge_functions` to find Kayliegh and Scott

### Security Note
- Debug mode still requires a secret key derived from `DRGREEN_PRIVATE_KEY` (first 16 chars)
- This is not publicly accessible without that key
- Should be removed after testing is complete

### After Deployment
Once deployed, we will immediately call the endpoint to search for all three clients (admin, Kayliegh, Scott) in the Dr. Green API.

