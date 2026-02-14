

# Fix: Client Not Found (404) During Checkout and Order Creation

## Problem

The client ID `dfd81e64-c17d-4a1b-8111-cdf49f879e82` (Scott K) **exists** in the Dr. Green API -- `sync-client-by-email` finds it successfully. However, `get-my-details` and `create-order` return 404 because of two issues:

1. **`findClientById` only fetches 1 page (200 clients)** -- if the client is beyond the first 200 results, it's missed. Meanwhile, `sync-client-by-email` paginates up to 3 pages (600 clients).
2. **`get-my-details` doesn't pass `adminEnvConfig`** -- it calls `findClientById(clientId)` without the environment config, potentially using different credentials.
3. **`create-order` Step 1 calls `PATCH /dapp/clients/{clientId}` directly** -- this direct endpoint call fails with 404/401 when the API key lacks individual client access.

## Changes

### 1. Update `findClientById` to paginate (drgreen-proxy/index.ts ~lines 1304-1366)

Match the pagination logic from `sync-client-by-email`:
- Paginate up to 3 pages (PAGE_SIZE=200, MAX_PAGES=3)
- Handle the same response shape variations (`data.items`, `data.clients`, etc.)
- Update cache to store full paginated results
- Also handle the `listData.data.items` response shape that `sync-client-by-email` handles but `findClientById` currently does not

### 2. Pass `adminEnvConfig` to `findClientById` in `get-my-details` (~line 2418)

Change:
```typescript
apiResponse = await findClientById(clientId);
```
To:
```typescript
apiResponse = await findClientById(clientId, adminEnvConfig);
```

### 3. Handle 404 in `get-my-details` like 401 (~line 2427)

Currently the code only falls back to local data on 401. Add 404 to the fallback condition so the local database record is used when the API can't find the client:

```typescript
} else if (apiResponse.status === 401 || apiResponse.status === 404) {
  logInfo("Dr. Green API returned 401/404 for client details, using local fallback", { clientId });
}
```

### 4. Make `create-order` Step 1 (PATCH shipping) resilient to 404 (~line 2991)

The PATCH to `/dapp/clients/${clientId}` is already marked as "non-blocking" in the code (it continues on failure). But ensure the local shipping address is still saved to the `drgreen_clients` table as fallback so checkout can proceed even when the direct PATCH fails.

## Expected Outcome

- `get-my-details` will find Scott K via paginated list lookup and return full API data (not just local fallback)
- `create-order` will still work even if PATCH shipping fails (existing non-blocking behavior) but will use the correct paginated client lookup
- Both predefined clients will be found reliably regardless of their position in the API's client list

