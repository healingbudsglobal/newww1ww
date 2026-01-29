

# Plan: Update Dr. Green API Credentials and Verify Access

## Credentials Received

| Secret Name | Value (Base64-encoded) |
|-------------|------------------------|
| `DRGREEN_API_KEY` | `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0K...` (Public Key) |
| `DRGREEN_PRIVATE_KEY` | `LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t...` (Private Key) |

---

## Implementation Steps

### Step 1: Update Secrets in Lovable Cloud

Update both secrets with the new credentials:
- `DRGREEN_API_KEY` → ApiKey value provided
- `DRGREEN_PRIVATE_KEY` → secretKey value provided

### Step 2: Redeploy Edge Function

Redeploy `drgreen-proxy` to pick up the new credentials.

### Step 3: Verify Protected Endpoints

Test the following dApp endpoints that were previously returning 401:

| Endpoint | Action | Expected Result |
|----------|--------|-----------------|
| `/dapp/clients` | `dapp-clients` | 200 OK with client list |
| `/dapp/sales/summary` | `get-sales-summary` | 200 OK with sales data |
| `/dapp/dashboard/summary` | `dashboard-summary` | 200 OK with dashboard metrics |

### Step 4: Search for Kayleigh

Once endpoints work, search for the missing client:
```json
{
  "action": "dapp-clients",
  "search": "kayliegh"
}
```

### Step 5: Import to Local Database

If found in Dr. Green system, use the Admin Client Import tool to sync her record to the local `drgreen_clients` table.

---

## Success Criteria

- [ ] All protected `/dapp/*` endpoints return 200 OK
- [ ] Client list is retrievable from Dr. Green API
- [ ] Kayleigh's record can be found and imported
- [ ] Admin Dashboard displays real data instead of permission errors

