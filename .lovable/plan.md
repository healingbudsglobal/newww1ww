

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

- [x] All protected `/dapp/*` endpoints return 200 OK ✅ (get-sales-summary, get-clients-summary, get-sales working)
- [x] Client list is retrievable from Dr. Green API ✅ (6 clients found)
- [x] Kayleigh's record found ✅ (kayliegh.sm@gmail.com - ID: 47542db8-3982-4204-bd32-2f36617c5d3d)
- [ ] Admin Dashboard displays real data instead of permission errors

## Kayleigh's Record (Found)
| Field | Value |
|-------|-------|
| Dr Green ID | `47542db8-3982-4204-bd32-2f36617c5d3d` |
| Email | `kayliegh.sm@gmail.com` |
| Name | Kayliegh Moutinho |
| Phone | +351 963501027 |
| Country | PT (Portugal) |
| Stage | LEADS |
| Created | 2026-01-29T15:22:47.273Z |

## Next Step: Link to Local Database
Kayleigh's record exists in Dr. Green but cannot be imported without a linked Supabase user_id (foreign key constraint). 

**Options:**
1. Kayleigh signs up on Healing Buds → her record auto-links during client registration
2. Admin manually associates her when she logs in for the first time

