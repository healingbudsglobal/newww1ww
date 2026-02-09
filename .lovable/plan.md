

## Implementation Plan: Update Secrets, Hide Admin/Wallet UI, Hardcode Admin

### Step 1: Update 7 Secrets

Set each secret with the exact values provided:

| Secret | Value |
|--------|-------|
| `DRGREEN_API_KEY` | `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0K...` (production public key) |
| `DRGREEN_PRIVATE_KEY` | `LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t...` (production private key) |
| `DRGREEN_STAGING_API_KEY` | `LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0K...` (Railway public key) |
| `DRGREEN_STAGING_PRIVATE_KEY` | `LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t...` (Railway private key) |
| `DRGREEN_STAGING_API_URL` | `https://budstack-backend-main-development.up.railway.app` |
| `RESEND_API_KEY` | `re_Jfr6ihh1_H76reahpYEoEEUoQHXHUcqob` |
| `EXTERNAL_SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (external service role key) |

Skip `ADMIN_WALLET_ADDRESSES` -- wallet features hidden for now.

### Step 2: Hide Wallet and Admin Login from Header

**File: `src/layout/Header.tsx`**

1. Remove `<WalletButton>` render (line ~205)
2. Replace the "Admin Login" dropdown (lines 282-325) with a simple button:

```text
<button onClick={() => navigate('/auth')}
  className="font-medium px-4 py-2.5 rounded-lg bg-white/10 text-white 
             hover:bg-white/20 border border-white/20 text-sm flex items-center gap-2">
  <User className="w-4 h-4" />
  Patient Login
</button>
```

3. Remove unused imports: `Wallet` icon, `WalletButton` component

### Step 3: Database Trigger for Admin Role

Create a migration to auto-assign the `admin` role to `healingbudsglobal@gmail.com` on signup:

```text
CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'healingbudsglobal@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_admin_role();
```

Also run a one-time check: if that email already exists in `auth.users`, insert the admin role directly.

### Step 4: Verify Connectivity

Call the `drgreen-health` edge function to confirm both production and staging API connections work with the new credentials.

### No Changes Needed

- **Product display for non-restricted countries** (ZA, TH): Already works -- `RestrictedRegionGate` only gates GB and PT
- **API URLs**: Already hardcoded correctly in `drgreen-proxy`
- **WalletConnect project ID**: Already set to `0ed43641317392e224a038f3edc04ae7`

