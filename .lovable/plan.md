
## Root Cause: Confirmed — Shipping Not Persisting Due to Wrong API Endpoint/Payload

### What the Live DApp API Tells Us

The `get-client` response for Benjamin (`a4357132`) confirms:

```json
"shipping": {
  "address1": "",   ← empty
  "city": "",       ← empty
  "countryCode": "" ← empty
},
"shippings": [
  { "country": "South Africa", "currency": "ZAR" }
]
```

Two separate structures exist on the Dr. Green client record:
- `shipping` — flat object (always empty despite PATCH attempts)
- `shippings` — array of shipping records (has country+currency but no address lines)

The PATCH to `PATCH /dapp/clients/{id}` with `{ shipping: {...} }` returns 200 but does NOT persist the address into either structure. This has been proven by 6+ checkout failures after PATCH calls. The cart validation checks the stored address and rejects with "Client shipping address not found" every time.

**The core problem**: Benjamin was registered in February without a full shipping address. The `shippings[]` array entry was created at registration time with only country+currency. There is no endpoint we've found that can update an existing entry in `shippings[]` after registration.

### The Solution: Two Parallel Approaches

#### Approach A — Add a new shippings entry via POST (most likely correct)

The Dr. Green API likely has a dedicated endpoint for adding shipping addresses to the `shippings[]` array:

```
POST /dapp/clients/{clientId}/shippings
```

with payload:
```json
{
  "address1": "123 Rivonia Road",
  "city": "Sandton",
  "state": "Gauteng",
  "country": "South Africa",
  "countryCode": "ZAF",
  "postalCode": "2148"
}
```

This would add a new entry to `shippings[]` with full address data. The cart validation would then find a complete shipping record.

We try this first in the `create-order` flow Step 1: instead of (or in addition to) the PATCH, POST to `/dapp/clients/{clientId}/shippings`.

#### Approach B — Pass shippingAddress directly in the cart POST payload

The current cart payload is:
```json
{ "clientId": "...", "clientCartId": "...", "items": [...] }
```

Try adding `shippingAddress` directly to the cart POST:
```json
{
  "clientId": "...",
  "clientCartId": "...",
  "shippingAddress": { "address1": "123 Rivonia Road", ... },
  "items": [...]
}
```

If the Dr. Green cart API accepts an inline `shippingAddress`, it bypasses the stored address check entirely.

#### Approach C — Pass shippingAddress directly in the order POST payload

Already partially implemented (the order payload includes `shippingAddress`). But this only works if the cart step is bypassed. The current flow requires cart success before order creation. A direct order POST without a cart step:

```
POST /dapp/orders
{
  "clientId": "...",
  "shippingAddress": { ... },
  "items": [{ "strainId": "...", "quantity": 1 }],
  "currency": "ZAR"
}
```

This skips the cart entirely and creates the order in one step. This is the "create order with items directly" pattern that some APIs support.

---

### Implementation Plan

All changes are in `supabase/functions/drgreen-proxy/index.ts` in the `create-order` case, Step 1 and Step 2.

#### Change 1: Step 1 — Try POST to `/shippings` sub-endpoint first, fall back to PATCH

Replace the current Step 1 PATCH block with a two-attempt shipping update:

```typescript
// Step 1: Try POST /dapp/clients/{id}/shippings first (adds to shippings[] array)
// If that fails, fall back to PATCH /dapp/clients/{id}
if (orderData.shippingAddress) {
  const addr = orderData.shippingAddress;
  const normalisedCountryCode = toAlpha3(addr.countryCode) || 'ZAF';
  const shippingObj = {
    address1: addr.street || addr.address1 || '',
    address2: addr.address2 || '',
    landmark: addr.landmark || '',
    city: addr.city || '',
    state: addr.state || addr.city || '',
    country: addr.country || '',
    countryCode: normalisedCountryCode,
    postalCode: addr.zipCode || addr.postalCode || '',
  };

  // Attempt 1A: POST to /shippings sub-endpoint (adds new entry to shippings[])
  try {
    const shippingsPostResp = await drGreenRequestBody(
      `/dapp/clients/${clientId}/shippings`, "POST", shippingObj, false, adminEnvConfig
    );
    const shippingsPostBody = await shippingsPostResp.clone().text();
    logInfo(`Step 1A: POST /shippings response`, { 
      status: shippingsPostResp.status, 
      body: shippingsPostBody.slice(0, 300) 
    });
    if (shippingsPostResp.ok) shippingVerified = true;
  } catch (e) {
    logWarn(`Step 1A: POST /shippings failed`, { error: String(e).slice(0,100) });
  }

  // Attempt 1B: PATCH /dapp/clients/{id} (flat shipping object)
  try {
    const patchResp = await drGreenRequestBody(
      `/dapp/clients/${clientId}`, "PATCH", { shipping: shippingObj }, false, adminEnvConfig
    );
    const patchBody = await patchResp.clone().text();
    logInfo(`Step 1B: PATCH client response`, { 
      status: patchResp.status, 
      body: patchBody.slice(0, 300) 
    });
  } catch (e) {
    logWarn(`Step 1B: PATCH client failed`, { error: String(e).slice(0,100) });
  }

  // Save locally regardless
  // ...local save code...

  await sleep(2000);
}
```

#### Change 2: Step 2 — Add `shippingAddress` to cart POST payload

Extend the cart batch payload to include the inline shipping address:

```typescript
const cartPayload = {
  clientId: clientId,
  clientCartId: clientCartId,
  shippingAddress: shippingObj, // ADD THIS — inline address override
  items: cartItems.map(item => ({
    strainId: item.strainId,
    quantity: item.quantity,
  })),
};
```

#### Change 3: If cart still fails — attempt direct order creation skipping cart

Add a fallback after cart failure that sends a direct `POST /dapp/orders` with items inline (no cart pre-step):

```typescript
if (!cartSuccess) {
  logInfo(`Step 2.5: Attempting direct order creation (bypassing cart)...`);
  try {
    const directOrderPayload = {
      clientId,
      items: cartItems.map(i => ({ strainId: i.strainId, quantity: i.quantity })),
      shippingAddress: shippingObj,
      currency: orderData.currency || 'ZAR',
    };
    const directResp = await drGreenRequestBody("/dapp/orders", "POST", directOrderPayload, false, adminEnvConfig);
    const directBody = await directResp.clone().text();
    logInfo(`Step 2.5: Direct order response`, { status: directResp.status, body: directBody.slice(0, 300) });
    if (directResp.ok) {
      // extract orderId and return success
    }
  } catch (e) { ... }
}
```

---

### Technical Summary Table

| Step | Current Behaviour | New Behaviour |
|------|------------------|---------------|
| Step 1A (NEW) | Does not exist | POST `/dapp/clients/{id}/shippings` — adds to shippings[] array |
| Step 1B | PATCH `/dapp/clients/{id}` with `{shipping:{}, shippings:[]}` | PATCH with only `{shipping:{}}` — simplified |
| Step 2 | `POST /dapp/carts` with `{clientId, clientCartId, items[]}` | Add `shippingAddress` field to payload |
| Step 2.5 (NEW) | Falls straight to LOCAL fallback if cart fails | Try direct `POST /dapp/orders` with items inline |
| Step 3 | `POST /dapp/orders` | Unchanged |

---

### Why This Will Work

- **Step 1A** tests the most likely correct endpoint for populating `shippings[]`. If it returns 201, the cart validation will pass on the next attempt.
- **Step 2** passes `shippingAddress` inline so even if the stored record is empty, the cart call carries the address data itself.
- **Step 2.5** means if the cart still refuses, we try direct order creation — some Dr. Green API implementations accept items directly in the order payload without a prior cart step.
- All three changes are logged verbosely so we will see **exactly** which one works on the first attempt after deployment.

### No Database Changes Required

This is a pure edge function change. The `drgreen_clients` local DB already stores the address correctly — that part works.

### Files Changed

- `supabase/functions/drgreen-proxy/index.ts` — Step 1, Step 2, and new Step 2.5 in the `create-order` case
