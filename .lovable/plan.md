

## Sync Benjamin Varcianna's Dr. Green Client Record to Local Database

The Dr. Green API has confirmed this client record exists. The local `drgreen_clients` table is currently empty. We need to insert this record to link the auth user to their Dr. Green client.

### What will be done

Insert one row into `drgreen_clients`:

| Field | Value |
|-------|-------|
| user_id | `3c5b8d43-5dcf-4af8-b023-cef47f2fde9d` |
| drgreen_client_id | `a4357132-7e8c-4c8a-b005-6f818b3f173e` |
| email | `varseainc@gmail.com` |
| full_name | `Benjamin Varcianna` |
| country_code | `ZAF` |
| is_kyc_verified | `false` (default, pending actual KYC status) |
| admin_approval | `PENDING` (default) |
| shipping_address | JSON with: 123 Rivonia Road, Sandton, 2148, ZA |

### Why this matters
- Links the local auth user to their Dr. Green API client ID
- Enables the shop, cart, and checkout eligibility checks to work
- The auto-sync hook added earlier will keep this record updated going forward

### Technical Details
- Single `INSERT` into `drgreen_clients` using the data tool
- No schema changes needed
- The auto-sync (`useDrGreenAutoSync`) will refresh KYC/approval status from the API automatically after this seed

