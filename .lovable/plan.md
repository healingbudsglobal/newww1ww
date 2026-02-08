

## Re-Register Scott and Kayliegh with Current Dr. Green API Key

### Status: ✅ COMPLETE

### What Was Done

#### Phase 1: Database Cleanup ✅
- Deleted stale `drgreen_clients` records for both users:
  - `scott.k1@outlook.com`
  - `kayliegh.sm@gmail.com`
- Their `auth.users` and `profiles` records remain intact (they can still log in)

#### Phase 2: Edge Function Implementation ✅
- Added `admin-reregister-client` to `ADMIN_ACTIONS` array
- Implemented handler that:
  1. Accepts client data (email, firstName, lastName, shipping, etc.)
  2. Builds a valid Dr. Green client creation payload with minimal medical defaults
  3. Calls `POST /dapp/clients` with current API credentials
  4. Returns new `clientId` and `kycLink`
  5. Updates local `drgreen_clients` record if user exists

#### Phase 3: Admin UI ✅
- Added `reregisterClient` method to `useDrGreenApi.ts` hook
- Added "Re-Register" button to Admin Client Manager with:
  - KeyRound icon
  - Confirmation dialog before action
  - Loading state during API call
  - Toast notifications for success/failure
  - Automatic clipboard copy of new KYC link

### How to Use

1. Log in as admin
2. Navigate to Admin Dashboard > Client Management
3. Find Scott or Kayliegh in the client list
4. Click the "Re-Register" button (amber colored with key icon)
5. Confirm the action in the dialog
6. System will:
   - Send client creation payload to Dr. Green API
   - Store new client ID locally
   - Copy new KYC link to clipboard
7. Share the KYC link with the user to complete verification

### Next Steps for Users

After re-registration:
1. Scott/Kayliegh will need to complete KYC verification via the new link
2. Once verified in Dr. Green DApp admin portal, they can shop and place orders
3. Use "Sync" button to refresh their status after Dr. Green approval
