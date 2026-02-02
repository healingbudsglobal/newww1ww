
## Goal
Continue debugging the “Place Order” failure on `/checkout` (Kayliegh), and make the error *observable* (not hidden behind “Create order failed after 3 attempts”), while keeping compliance rules intact (no client-side Dr. Green calls; enforce eligibility + ownership).

---

## What we know (from code inspection)
### 1) Frontend retries are masking the real error
In `src/pages/Checkout.tsx`, `retryOperation()` returns a generic:
- `"Create order failed after 3 attempts"`

This overwrites the actual underlying error from `createOrder()`.

### 2) `supabase.functions.invoke()` hides non-2xx response bodies
In `src/hooks/useDrGreenApi.ts`, `callProxy()` uses:
- `supabase.functions.invoke('drgreen-proxy', ...)`

When the proxy returns **non-2xx** (e.g., 400/500), `invoke` sets `error`, and the response body content is not reliably available to the frontend. That means even though `drgreen-proxy` produces a JSON error payload in its catch block, the UI may only see a generic “Edge function returned 500”.

### 3) `drgreen-proxy` currently returns upstream status codes directly for most actions
At the end of `supabase/functions/drgreen-proxy/index.ts`, it returns:
- `status: response.status`

Only one special-case exists:
- If upstream 401 + `ADMIN_ACTIONS`, it converts to `status: 200` with `{ success:false, apiStatus:401, ... }` so the UI can show a stable message.

### 4) Security/compliance concern discovered
`create-order` is **not** in `OWNERSHIP_ACTIONS`, meaning it may not be ownership-verified server-side before performing order operations. That’s a compliance/security gap (a user could theoretically attempt to order against a different `clientId`).

---

## Hypothesis for why Kayliegh still fails
Even if the proxy fallback logic is correct, the UI still may not be receiving actionable error detail because:
- the proxy returns non-2xx on failures → invoke produces generic error → frontend retries → retries collapse into “Create order failed after 3 attempts”.

So we can’t *confirm* whether the failure is:
- cart shipping not found,
- order endpoint rejecting direct items payload,
- upstream 401/403 due to NFT scope,
- upstream schema mismatch,
- or something else.

We need to change the error transport so we can actually see the upstream message in the UI and logs.

---

## Implementation Plan (focused, minimal-risk)

### A) Make `create-order` observable end-to-end (no more “black box” failures)
1) **Proxy: return 200 for `create-order` failures (like the admin-401 pattern)**
   - In `supabase/functions/drgreen-proxy/index.ts`:
     - Add a targeted “non-2xx wrapper” for `action === "create-order"`:
       - If the final `response.ok` is false, return:
         - HTTP 200
         - JSON: `{ success:false, apiStatus:<upstreamStatus>, error:<normalized>, message:<human-friendly>, upstream:<parsedBody> }`
     - Do the same for the proxy-level `catch` path **for create-order only**:
       - Instead of returning status 500/400, return 200 with `{ success:false, apiStatus: 500|400, message, errorCode, retryable }`
   - Why targeted: avoids unintended side effects on other actions that might rely on status codes.

2) **Add explicit request/trace logging for create-order**
   - In `create-order` handler, log:
     - `requestId` (generate a short UUID or timestamp-based id)
     - `clientId` (sanitized already)
     - number of items
     - which step failed (PATCH/cart/cart-order/direct-order)
     - upstream status + trimmed error text
   - This makes backend logs searchable even if UI output is incomplete.

3) **Add `create-order` to `OWNERSHIP_ACTIONS`**
   - This ensures server-enforced ownership verification:
     - user must own `clientId` in `drgreen_clients`
   - This matches your “server-enforced gating” rule and reduces risk.

---

### B) Fix the frontend so it preserves the real error
1) **Update `useDrGreenApi.callProxy()` to interpret `{ success:false }` payloads**
   - If proxy responds with `{ success:false, message, apiStatus }`, return:
     - `{ data: null, error: `${message}${apiStatus ? ` (Status ${apiStatus})` : ''}` }`
   - This keeps the Dr. Green API hidden and still provides meaningful UI errors.

2) **Update `retryOperation()` to not overwrite the last real error**
   - Track `lastError`.
   - After retries, return:
     - `{ data:null, error: lastError ?? `${operationName} failed after ${maxRetries} attempts` }`
   - Also log each attempt with the exact error string returned (for console visibility).

3) **Refine “non-retryable” detection**
   - Currently it checks `includes('400') || includes('validation') || includes('required')`
   - After we start receiving `apiStatus`, we can treat:
     - `Status 400/401/403/422` as non-retryable
     - `Status 429/500/502/503/504` as retryable

This will stop pointless retries on permission/scope errors and reduce noise.

---

### C) Run a deterministic verification (Kayliegh on /checkout)
After changes above, test “Place Order” again:
- Expected outcomes:
  1) **Success:** proxy returns `{ orderId, ... }` and payment step begins
  2) **Actionable fail:** UI toast shows something like:
     - “The Dr. Green system requires shipping address setup… (Status 400)”
     - Or “Unauthorized / credential scope… (Status 401/403)”
     - Or “Order creation failed: … (Status 422/500)”
- In either case, we’ll also have backend logs keyed by requestId to confirm which step failed.

---

## Deliverables
1) Proxy changes:
   - Ownership enforcement for `create-order`
   - 200-wrapped error responses for `create-order` so the UI can read the error body
   - Strong step-by-step logs for cart/order fallback execution

2) Frontend changes:
   - Preserve last real error in retryOperation
   - Display meaningful errors returned from proxy
   - Smarter retry behavior using apiStatus when available

---

## Risks / Considerations
- Returning 200 for errors is a deliberate trade-off to work around `invoke` limitations; we will scope it narrowly to `create-order` to avoid breaking other flows.
- Adding `create-order` to `OWNERSHIP_ACTIONS` is a security/compliance improvement and should not break legitimate users (Kayliegh’s clientId exists locally and is mapped to her user).

---

## Post-fix debugging checklist (what we’ll learn immediately)
When you click “Place Order” as Kayliegh after these changes, we’ll be able to answer:
- Did the cart add fail due to “shipping address not found”?
- Did the direct order payload get rejected (schema mismatch)?
- Is the upstream rejecting due to credential/NFT scope?
- Are we failing before calling upstream (ownership/auth/validation)?

That will tell us the next precise fix (API payload tweak vs credential escalation vs UX messaging).

