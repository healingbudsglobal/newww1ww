## Proxy Cleanup and Client Verification Fix — COMPLETED

All changes implemented and deployed on 2026-02-09.

### What was done:

1. **Fixed `get-client` response normalization** — Now wraps response in `{ success: true, data: ... }` envelope so ShopContext can parse live verification status correctly.

2. **Made ShopContext resilient to response format** — Updated the live status check to handle both wrapped and raw responses: `const liveData = apiResponse?.data || apiResponse`

3. **Removed duplicate switch cases** — Removed first `empty-cart` and `place-order` blocks (simpler implementations) so the second, more complete implementations now execute correctly.

4. **Removed dead `extractPemBody` function** — Updated `debug-signing-test` to use raw API key instead.

5. **Aliased `drGreenRequestQuery`** — Replaced the deprecated wrapper function with a `const` alias to `drGreenRequestGet`.

6. **Removed dead code** — `generateHmacSignatureFallback`, `signPayloadWithMode`, and `debug-list-all-clients` (security risk) all removed.

### Root cause of "clients appearing unverified"

The `get-client` proxy action returned raw Dr. Green API data without a `success` field. ShopContext checked `apiResponse?.success && apiResponse?.data` — always false — so it fell back to stale local cache. Now both sides are fixed: proxy wraps the response, and ShopContext handles both formats.
