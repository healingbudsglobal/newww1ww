

## Fix Login and Add Automatic Dr. Green Client Sync

### Problem 1: Login Failing
The account for `healingbudsglobal@gmail.com` exists and is confirmed, but the password `123455678` is not working. The `admin-update-user` edge function may not have set the password correctly during creation.

**Fix:** Call the edge function again with just the password update to reset it properly.

### Problem 2: Manual Client Resync Required
Currently, Dr. Green client data only syncs:
- On login (auto-discovery by email via `get-client-by-auth-email`)
- Every 60 seconds for unverified clients (polling in ShopContext)
- Manually via admin tools

**What's missing:** When a new user signs up or logs in, their Dr. Green client record should be automatically found and linked without any manual intervention. The current auto-discovery already exists in ShopContext but needs to be more robust.

### Plan

#### Step 1: Fix the Password
- Call `admin-update-user` edge function to reset the password for `healingbudsglobal@gmail.com` to `123455678`

#### Step 2: Create the Other User Accounts
- Create `varseainc@gmail.com`, `scott.k1@outlook.com`, and `kayliegh.sm@gmail.com` with password `123455678` and auto-confirmed emails
- Update their profiles with names

#### Step 3: Enhance Auto-Sync on Login
Modify the Auth page's login handler to trigger a Dr. Green client sync immediately after successful authentication:
- After `signInWithPassword` succeeds, call `refreshClient()` from ShopContext (which already does auto-discovery)
- This ensures the client record is fetched and linked on every login without manual intervention

#### Step 4: Add Auth-Event-Triggered Sync
Enhance the `ShopContext` auth state listener to automatically sync on `SIGNED_IN` events:
- On `SIGNED_IN`: immediately run `linkClientFromDrGreenByAuthEmail` silently
- On `TOKEN_REFRESHED`: re-verify client status if client exists
- This covers all auth scenarios (login, signup, token refresh)

#### Step 5: Add Startup Client Sync for Admin
Add a background sync hook (`useDrGreenAutoSync`) that:
- Runs once on app startup for admin users
- Fetches all clients from Dr. Green API and updates local `drgreen_clients` table
- Runs every 15 minutes in the background (only for admins)
- Syncs KYC status, admin approval, and basic client data

### Technical Details

**Files to modify:**
- `src/context/ShopContext.tsx` -- enhance auth state change handler to sync on SIGNED_IN
- `src/pages/Auth.tsx` -- no changes needed (ShopContext handles it)
- `src/hooks/useDrGreenClientSync.ts` -- add auto-sync interval for admin users
- `src/components/admin/AdminClientCreator.tsx` -- add `varseainc@gmail.com` to predefined clients

**Files to create:**
- `src/hooks/useDrGreenAutoSync.ts` -- new hook for periodic admin-level background sync

**Edge function calls:**
- `admin-update-user` -- fix password and create accounts
- `drgreen-proxy` with `get-client-by-auth-email` -- auto-discover clients on login (already exists)

