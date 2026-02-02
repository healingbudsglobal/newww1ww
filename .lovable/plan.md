

# Fix Plan: Debug create-client-legacy 401 Error

## Problem Summary
The Re-Sync Account feature returns a 401 error. The error message `"User is not authorized"` comes from the Dr. Green API, indicating the proxy's credentials may not be authorized to create new clients.

## Investigation Findings
1. User authentication (Supabase JWT) is working correctly when properly logged in
2. The payload structure is correct (using `payload` key as expected)
3. Without authentication, requests are blocked at the Supabase auth gate (expected behavior)
4. When authenticated, the Dr. Green API is rejecting the request with 401 `"User is not authorized"`

## ✅ Completed Steps

### Step 1: Add Enhanced Logging (DONE)
Added explicit logging at the START of the `create-client-legacy` case handler:

**File**: `supabase/functions/drgreen-proxy/index.ts` (lines 1584-1595)
- Added `[create-client-legacy] ========== STARTING HANDLER ==========` log
- Added payload validation logging
- Edge function deployed successfully

### Step 2: Testing Status
- Browser test attempted - login for `scott.k1@outlook.com` failed with 400 (password incorrect)
- Direct curl test without auth returns 401 "Authentication required" (expected - Supabase auth gate)
- Need user with valid credentials to test the full flow and capture enhanced logs

## Next Steps
1. **User Action Required**: Scott needs to log in with correct credentials
2. Re-trigger the Re-Sync flow while logged in
3. Check edge function logs for the `[create-client-legacy]` markers
4. If logs show the handler is reached but API returns 401, contact Dr. Green dApp admin

## Technical Context
The 401 error from Dr. Green API (`"User is not authorized"`) indicates:
- The API key/signature is valid (otherwise would be different error)
- The key may not have permission to create clients under current NFT scope
- This is consistent with the documented NFT-scoped access restrictions
