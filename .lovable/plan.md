

# Fix Auth Page Flickering and Race Condition

## Problem

The auth page flickers because `ShopContext.onAuthStateChange` directly calls `fetchClient()`, which invokes edge functions. During auth state transitions (login, token refresh), this creates a race condition where API calls fire before the session is fully established, causing 401 errors and rapid state toggling.

## Root Cause (Technical)

In `src/context/ShopContext.tsx` (lines 391-401):

```text
onAuthStateChange(() => {
  fetchCart();      // <- async DB call inside listener
  fetchClient();   // <- async edge function call inside listener
});
```

Per Supabase best practices, awaiting or invoking async Supabase calls directly inside `onAuthStateChange` can cause deadlocks and flickering. The listener fires before the token is fully refreshed, leading to 401s from the proxy.

## Solution

### 1. Fix ShopContext auth pattern (`src/context/ShopContext.tsx`)

- Separate **initial load** (controls `isLoading`) from **ongoing auth changes** (updates state but defers API calls)
- Use `setTimeout(fn, 0)` to dispatch `fetchClient` and `fetchCart` from within `onAuthStateChange`, preventing deadlocks
- Only set `isLoading = false` after the initial load completes (not on every auth event)

```text
useEffect(() => {
  let isMounted = true;

  // Listener for ONGOING changes - defer with setTimeout
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT') {
        setDrGreenClient(null);
        setCart([]);
        return;
      }
      // Defer to avoid deadlock
      setTimeout(() => {
        if (isMounted) {
          fetchCart();
          fetchClient();
        }
      }, 0);
    }
  );

  // INITIAL load - controls isLoading
  const initializeShop = async () => {
    await fetchCart();
    await fetchClient();
    // isLoading is set to false inside fetchClient
  };
  initializeShop();

  return () => {
    isMounted = false;
    subscription.unsubscribe();
  };
}, [fetchCart, fetchClient]);
```

### 2. Fix Auth.tsx redirect logic (`src/pages/Auth.tsx`)

- Respect the `?redirect=` query parameter instead of always sending users to `/admin` or `/dashboard`
- This is important since the user arrived at `/auth?redirect=%2Fcheckout`

### 3. Guard against stale token in fetchClient (`src/context/ShopContext.tsx`)

- In `fetchClient`, add a small guard: if `getSession()` returns no session, bail immediately and set loading false -- already present, but ensure no edge function call fires without a valid session

## Files Modified

- `src/context/ShopContext.tsx` -- fix auth listener pattern, prevent race condition
- `src/pages/Auth.tsx` -- respect redirect query param

## Client Summary

Only 1 client exists in the database:

| Name | Email | Dr Green ID | KYC | Approval | Country | Rehome |
|------|-------|-------------|-----|----------|---------|--------|
| Scott Hickling | scott.k1@outlook.com | dfd81e64-... | Yes | VERIFIED | PT | none |

