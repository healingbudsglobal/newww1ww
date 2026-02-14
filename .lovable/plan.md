

# Fix: Replace `/dapp/clients/{id}` with List-and-Filter

## Problem

The Dr. Green API key does not have permission to access `GET /dapp/clients/{id}` (returns 401), but `GET /dapp/clients` (list all) works and returns all 7 clients with full data including `adminApproval`, `isKYCVerified`, shipping, etc.

Multiple proxy actions currently call the forbidden endpoint, causing 401 errors throughout the admin and patient flows.

## Solution

Create a shared helper function inside `drgreen-proxy` that fetches the full client list from `GET /dapp/clients` and filters for the requested client ID. Then replace all occurrences of `/dapp/clients/${clientId}` GET calls with this helper.

## Affected Actions (GET only -- writes like PATCH/PUT/DELETE are separate endpoints and may still work)

| Action | Current Call | Fix |
|---|---|---|
| `dapp-client-details` | `GET /dapp/clients/{id}` | Use list-and-filter helper |
| `sync-client-status` | `GET /dapp/clients/{id}` | Use list-and-filter helper |
| `get-client` | `GET /dapp/clients/{id}` | Use list-and-filter helper |
| `get-my-details` | `GET /dapp/clients/{id}` | Use list-and-filter helper |
| `admin-reregister-client` (broken check) | `GET /dapp/clients/{id}` | Use list-and-filter helper |

## Technical Details

### 1. New Helper Function

Add a `findClientById` helper near the top of the proxy that:
- Calls `GET /dapp/clients?take=200&page=1` (the working endpoint)
- Parses the response and finds the client matching the requested ID
- Returns a synthetic `Response` object matching what the individual endpoint would have returned
- Caches the list briefly if multiple lookups happen in the same request

### 2. Replace Each Affected Action

For each action listed above, replace:
```typescript
response = await drGreenRequestQuery(`/dapp/clients/${clientId}`, ...);
```
With:
```typescript
response = await findClientById(clientId, adminEnvConfig);
```

### 3. Keep Write Endpoints As-Is

`PATCH`, `PUT`, `DELETE`, and `POST` calls to `/dapp/clients/{id}` (for activate, deactivate, update, shipping updates) will remain unchanged -- those are different HTTP methods that may have different permissions. If they also fail with 401, we can address them separately.

### 4. No Frontend Changes Required

The proxy response shape stays the same. Frontend code (`useDrGreenApi.ts`, `AdminClientManager`, etc.) will continue working without modification.

