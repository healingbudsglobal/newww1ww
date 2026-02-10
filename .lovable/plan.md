
# Fix: Live Data Sync, Admin Bypass, and GET Endpoint Signing

## Issues Found

### 1. GET Endpoints Using Wrong Signing Method (Causes 401 errors)
Several GET `/dapp/*` endpoints in `drgreen-proxy` use `drGreenRequestBody()` (body signing) instead of `drGreenRequestQuery()` (query-string signing). The Dr. Green API requires query-string signing for all GET requests. This silently fails with 401, causing empty data on the admin dashboard.

**Affected endpoints:**
- `get-clients-summary` (line 3821) -- used by Admin Client Manager summary badges
- `get-sales-summary` (line 3850) -- used by Sales Dashboard
- `get-user-nfts` (line 4013) -- used by NFT ownership checks
- `get-user-me` (line 3093) -- used by user profile lookup

### 2. Admin Not Bypassing All Verification Gates
Admin users should never be subject to KYC or medical approval checks. Currently:
- `ComplianceGuard` -- correctly bypasses admin (line 72)
- `EligibilityGate` -- correctly bypasses admin (line 26)
- `RestrictedRegionGate` -- **MISSING admin bypass** -- admins in UK/PT regions get blocked from viewing products
- `Cart` component -- does not check admin role, blocks checkout if no `drGreenClient`
- `DashboardStatus` -- redirects verified users to `/shop` but does not redirect admins

### 3. Live Sync Not Polling
The current sync model fetches live data from Dr. Green API once on page load and on auth state change. There is no periodic refresh, so data can become stale during a session.

---

## Changes

### File 1: `supabase/functions/drgreen-proxy/index.ts`
Switch all GET endpoints from `drGreenRequestBody` to `drGreenRequestQuery`:

1. **Line 3821** (`get-clients-summary`): Change `drGreenRequestBody("/dapp/clients/summary", "GET", {}, false, adminEnvConfig)` to `drGreenRequestQuery("/dapp/clients/summary", {}, false, adminEnvConfig)`

2. **Line 3850** (`get-sales-summary`): Change `drGreenRequestBody("/dapp/sales/summary", "GET", {}, false, adminEnvConfig)` to `drGreenRequestQuery("/dapp/sales/summary", {}, false, adminEnvConfig)`

3. **Line 4013** (`get-user-nfts`): Change `drGreenRequestBody("/dapp/users/nfts", "GET", {})` to `drGreenRequestQuery("/dapp/users/nfts", {}, false, adminEnvConfig)`

4. **Line 3093** (`get-user-me`): Change `drGreenRequestBody("/user/me", "GET", {})` to `drGreenRequestQuery("/user/me", {})`

### File 2: `src/components/shop/RestrictedRegionGate.tsx`
Add admin bypass so admin users can always browse products regardless of region:

```typescript
import { useUserRole } from '@/hooks/useUserRole';

// Inside component, add:
const { isAdmin, isLoading: roleLoading } = useUserRole();

// Update loading check to include roleLoading
if (checkingAuth || isLoading || roleLoading) { ... }

// After the "not restricted" check, add admin bypass:
if (isAdmin) {
  return <>{children}</>;
}
```

### File 3: `src/components/shop/Cart.tsx`
Add admin bypass to checkout eligibility check so admin can test checkout flow without needing a Dr. Green client record:

- Import `useUserRole`
- If admin, set `canCheckout: true` regardless of client status
- Admin orders would still need a valid client ID for the API, so show a note

### File 4: `src/pages/DashboardStatus.tsx`
Add admin redirect -- admins should never land on the verification status page:

```typescript
const { isAdmin } = useUserRole();

useEffect(() => {
  if (!isLoading && isAdmin) {
    navigate('/admin', { replace: true });
  }
}, [isAdmin, isLoading, navigate]);
```

### File 5: `src/context/ShopContext.tsx`
Add periodic live sync for client verification status (polling every 60 seconds while the user is on the site). This ensures that when a patient gets approved in the Dr. Green DApp, the Healing Buds UI reflects it without requiring a page refresh:

```typescript
// Add polling interval for live sync
useEffect(() => {
  if (!drGreenClient?.drgreen_client_id) return;
  if (drGreenClient.drgreen_client_id.startsWith('local-')) return;
  // Only poll if not yet verified (no need to keep checking once verified)
  if (drGreenClient.is_kyc_verified && drGreenClient.admin_approval === 'VERIFIED') return;

  const interval = setInterval(() => {
    fetchClient();
  }, 60000); // Every 60 seconds

  return () => clearInterval(interval);
}, [drGreenClient?.drgreen_client_id, drGreenClient?.is_kyc_verified, drGreenClient?.admin_approval, fetchClient]);
```

---

## Expected Outcome
- Admin Client Manager loads live client data and summary counts from Dr. Green API
- Sales Dashboard loads live sales data
- Admin users bypass all verification gates (KYC, medical approval, regional restrictions)
- Patient verification status auto-refreshes every 60 seconds until verified
- Once verified, polling stops to reduce API load
