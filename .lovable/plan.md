

## Fix: Auto-Sync Client Discovery on Login

### Problem
When a user logs in, there's a race condition between the auto-discovery of their Dr. Green profile and the Auth page redirect logic. The ShopContext `isLoading` flag goes `false` before the auto-discovery API call finishes, causing the user to land on `/dashboard/status` which shows "No Profile Found" with a manual "Look Up My Profile" button. This is unacceptable for a healthcare platform -- the lookup should be seamless.

### Root Cause
In `ShopContext.tsx` line 288, `setIsLoading(false)` is called inside the `fetchClient` function at the end of the auto-discovery branch, but the issue is that `isLoading` starts as `true` and the `linkClientFromDrGreenByAuthEmail` call is async. The redirect in Auth.tsx fires as soon as `clientLoading` is false, which can happen before discovery completes.

### Solution

**Step 1: Keep `isLoading` true during auto-discovery** (`src/context/ShopContext.tsx`)

In the `fetchClient` function (around lines 272-290), ensure `isLoading` stays `true` until the full auto-discovery flow completes, including the re-fetch of the newly created local record. Currently `setIsLoading(false)` is called at line 288 which is correct, but we need to make sure it doesn't get set to false prematurely by any other code path during the async operation.

The key fix: Move the `setIsLoading(false)` to run AFTER the auto-discovery await, and ensure no early return sets it to false before discovery finishes.

**Step 2: Auto-trigger lookup on DashboardStatus mount** (`src/pages/DashboardStatus.tsx`)

As a safety net, when a user lands on `/dashboard/status` without a client record, automatically trigger the `handleManualLookup` function instead of waiting for the user to click the button. This makes the "Look Up My Profile" action happen seamlessly on page load.

Changes:
- Add an auto-lookup effect that fires when `!hasClient && isAuthenticated && !isLoading`
- Remove the 5-second auto-redirect to registration (or increase it to 15 seconds) so the lookup has time to complete
- If lookup finds a profile, refresh client and let the existing redirect logic handle navigation to `/shop`

**Step 3: Suppress noisy toasts during auto-discovery** (`src/context/ShopContext.tsx`)

The `linkClientFromDrGreenByAuthEmail` function shows toasts like "Checking records..." and "No Profile Found" during auto-login discovery. These are disruptive during the normal login flow. Add a `silent` parameter to suppress toasts when called automatically (keep them for manual lookups).

### Technical Details

#### ShopContext.tsx changes:
```text
// fetchClient function - ensure isLoading stays true during discovery
if (!localRecord) {
  // DO NOT set isLoading false until discovery completes
  const linked = await linkClientFromDrGreenByAuthEmail(user.id, true); // silent=true
  if (linked) {
    const { data: newRecord } = await supabase
      .from('drgreen_clients')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (newRecord) {
      setDrGreenClient(newRecord);
    }
  }
  setIsLoading(false); // Only NOW set loading false
  return;
}
```

#### linkClientFromDrGreenByAuthEmail signature change:
```text
const linkClientFromDrGreenByAuthEmail = useCallback(
  async (userId: string, silent = false): Promise<boolean> => {
    // Only show toasts if not silent
    if (!silent) {
      toast({ title: 'Checking records...', ... });
    }
    ...
  }
);
```

#### DashboardStatus.tsx changes:
```text
// Auto-trigger lookup when no client found
useEffect(() => {
  if (!isLoading && !drGreenClient && isAuthenticated && !isLookingUp) {
    handleManualLookup();
  }
}, [isLoading, drGreenClient, isAuthenticated]);

// Increase redirect timer from 5s to 15s to allow lookup to complete
// Or: only start countdown AFTER lookup returns "not found"
```

### Impact
- Login flow becomes seamless: user logs in, auto-discovery runs silently, redirect happens based on actual profile status
- No manual "sync" or "lookup" button click needed
- DashboardStatus page still works as a fallback with auto-lookup on mount
- No breaking changes to existing flows

