
# Plan: Update Migration to Use Correct External Supabase Project

## Problem
The migration function is currently hardcoded to query an empty project (`swjifcjdrqtbupoibyfn`). You've provided credentials for a different project (`vczjjhmypsyvpnymijwz`) which likely contains the actual client data including Kayliegh's records.

## Solution

### Step 1: Update the Migration Edge Function
**File:** `supabase/functions/migrate-external-clients/index.ts`

Change the hardcoded external URL from:
```typescript
const externalUrl = "https://swjifcjdrqtbupoibyfn.supabase.co";
```

To:
```typescript
const externalUrl = "https://vczjjhmypsyvpnymijwz.supabase.co";
```

### Step 2: Update the External Service Key Secret
The `EXTERNAL_SUPABASE_SERVICE_KEY` secret currently contains the service role key for the wrong project. It needs to be updated with the service role key for `vczjjhmypsyvpnymijwz`.

**Note:** You provided the anon key in your message. For migration to work (bypassing RLS), we need the **service role key** for this project, not the anon key.

### Step 3: Run the Migration
After updating:
1. Deploy the updated edge function
2. Call the migration endpoint
3. Verify Kayliegh's data is migrated (drgreen_client_id, KYC status, admin approval)

### Step 4: Verify Dr. Green API Integration
Once client data is migrated, test the checkout flow to ensure:
- Client details are fetched correctly
- Shipping address is retrieved
- Order creation works end-to-end

## Required Input From You
To complete this migration, please provide:
- **The service role key** for project `vczjjhmypsyvpnymijwz` (not the anon key you shared)

The anon key cannot bypass Row Level Security policies, which is required to read all client records.

## Files to Modify
| File | Change |
|------|--------|
| `supabase/functions/migrate-external-clients/index.ts` | Update `externalUrl` to new project |
| Supabase Secrets | Update `EXTERNAL_SUPABASE_SERVICE_KEY` with new service role key |

## Testing Checklist
After implementation:
1. Invoke `migrate-external-clients` function
2. Verify Kayliegh's record appears in local `drgreen_clients` table
3. Test checkout flow with Kayliegh's account
4. Confirm shipping address loads from Dr. Green API
