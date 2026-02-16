

## Make Local Database Mirror Dr. Green as Source of Truth

### Problem
Currently the `sync-clients` edge function only inserts/updates records for Dr. Green API clients that have a matching email in `auth.users`. The remaining clients (6 of 9) are counted as "unlinked" and dropped -- they never appear in the local `drgreen_clients` table. Orders are also not synced from Dr. Green. The dashboard KPIs therefore undercount.

### Solution

**1. Update `sync-clients` edge function to store ALL Dr. Green clients**

Currently, clients without a matching auth user are skipped (`totalUnlinked++`). Change this so unlinked clients are also inserted into `drgreen_clients` with a placeholder `user_id`. This requires:

- Add a system/placeholder UUID for unlinked clients (e.g. a fixed "unlinked" UUID constant like `00000000-0000-0000-0000-000000000000`).
- However, since `user_id` has a NOT NULL constraint and is used in RLS, a better approach is to make the column nullable via a migration.
- Alternatively, store unlinked clients with a sentinel user_id and match them later when a user signs up with a matching email.

**Recommended approach**: Make `user_id` nullable on `drgreen_clients` so unlinked Dr. Green clients can be stored without a local auth account. When a user later signs up with a matching email, the `linkUserToClient` flow will update the `user_id`.

Database migration:
```sql
ALTER TABLE drgreen_clients ALTER COLUMN user_id DROP NOT NULL;
```

Then update the `sync-clients` edge function: instead of skipping unlinked clients, insert them with `user_id: null`.

**2. Add order sync to the `sync-clients` edge function**

After syncing clients, also paginate through Dr. Green orders (via `GET /dapp/orders`) and upsert them into the `drgreen_orders` table. This ensures local orders reflect what Dr. Green has. Orders matched by `drgreen_order_id` get updated; new ones get inserted.

**3. Update `AdminDashboard.tsx` to use local DB counts (which now mirror Dr. Green)**

Since the local DB now contains ALL Dr. Green clients and orders, the existing local-DB-based `fetchStats()` will automatically show correct numbers. No API calls needed for KPIs -- the sync keeps the DB current.

**4. Auto-sync on dashboard load already works**

The `useDrGreenAutoSync` hook already runs `syncNow()` on mount and every 5 minutes, triggering the edge function. After the edge function returns, the dashboard refreshes stats. This loop ensures the local DB stays current with Dr. Green.

**5. Admin role remains local-only (not from Dr. Green)**

Admin roles stay in `user_roles` table, verified via NFT wallet auth. This is not overwritten by Dr. Green sync. The sync only manages client/patient data and orders.

### Technical Changes

**Migration**: `ALTER TABLE drgreen_clients ALTER COLUMN user_id DROP NOT NULL;`

**`supabase/functions/sync-clients/index.ts`**:
- After the existing client-matching logic, insert unlinked clients with `user_id: null` instead of skipping them.
- Add a second pagination loop for orders: `GET /dapp/orders?page=X&take=50&orderBy=desc`.
- For each order, upsert into `drgreen_orders` matching on `drgreen_order_id`.

**`src/pages/AdminDashboard.tsx`**:
- `fetchStats()` already reads from local DB. After migration + updated sync, the counts will be correct automatically.
- No changes needed here beyond what is already in place.

**`src/hooks/useDrGreenAutoSync.ts`**:
- Wire `onComplete` callback to refresh dashboard stats after each sync cycle completes.

### What Does NOT Change
- Admin role assignment stays in `user_roles`, managed independently.
- NFT wallet auth continues to govern admin access.
- The `drgreen-proxy` edge function is untouched.
- RLS policies: add a new policy allowing admins to see clients with `user_id IS NULL`.

