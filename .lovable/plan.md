

## Update API Documentation with Postman Client Endpoints

### What needs updating

The user has provided the complete Postman collection for Client endpoints. Two documentation files need updating to match, plus one discrepancy in the proxy needs flagging.

---

### Changes to `DRGREEN_API_ENDPOINTS.md`

**Fix activate/deactivate HTTP method (line 121-125):**
- Currently says `POST /dapp/clients/{clientId}/activate` and `POST /dapp/clients/{clientId}/deactivate`
- Postman confirms these are **PATCH**, not POST (the proxy already uses PATCH correctly)
- Change both to `PATCH`

**Add missing endpoints:**
- `GET /dapp/clients/summary` -- Client summary stats (total, verified, unverified counts)
- `DELETE /dapp/clients/bulk` -- Bulk delete clients (body: `{ "ids": [...] }`)
- `GET /dapp/clients` query parameters: `search`, `searchBy=clientName`

**Update proxy action mapping table (lines 249-268):**
Add missing actions: `activate-client`, `deactivate-client`, `bulk-delete-clients`, `get-clients-summary`, `patch-client`, `delete-client`

---

### Changes to `docs/DRGREEN-API-FULL-REFERENCE.md`

**Section 6 — Client Endpoints (lines 385-423):**
- Add query parameters `search` and `searchBy` to the List Clients table (already partially there but missing from the compact endpoint docs)
- Fix activate/deactivate: already correctly shows PATCH -- no change needed
- Add response examples for Summary, Activate, Deactivate, Bulk Delete based on Postman
- Add `DELETE /dapp/clients/bulk` with body format `{ "ids": ["id1", "id2"] }`

**Flag discrepancy:** The Postman says bulk delete is `DELETE /dapp/clients/bulk` with body `{ "ids": [...] }`, but the proxy currently sends `POST /dapp/clients/bulk-delete` with `{ "clientIds": [...] }`. This will be documented as a known inconsistency requiring testing to determine which the live API actually accepts.

---

### Files changed

| File | Change |
|------|--------|
| `.agent/knowledge/DRGREEN_API_ENDPOINTS.md` | Fix PATCH methods, add summary/bulk-delete/search params, expand proxy mapping table |
| `docs/DRGREEN-API-FULL-REFERENCE.md` | Add Postman-sourced response examples, bulk delete endpoint, flag proxy path discrepancy |

Total: 2 files modified, documentation only, no code changes.
