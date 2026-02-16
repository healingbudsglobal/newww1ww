

## Create Benjamin Varcianna Account and Sync Database

### Step 1: Create User Account
- Call the `admin-update-user` edge function with:
  - **email**: `healingbudsglobal@gmail.com`
  - **password**: `123455678`
  - **verify**: `true` (auto-confirm email)
- This will create the auth user and trigger the `handle_new_user` function to auto-create a profile
- The `auto_assign_admin_role` trigger will also fire since `healingbudsglobal@gmail.com` is in the admin list, granting admin access automatically

### Step 2: Update Profile
- Update the `profiles` table to set `full_name` to "Benjamin Varcianna"

### Step 3: Database Sync Status
Current state of the database:
- **Strains**: 7 already synced (Caribbean Breeze, Peanut Butter Breath, Blue Zushi, Femme Fatale, BlockBerry, etc.)
- **Clients**: Empty (no Dr. Green clients yet -- these are created when patients go through the onboarding/medical questionnaire flow)
- **Profiles**: Empty (no users yet)
- **18 tables** exist and are ready

### Step 4: Verify Automatic Sync
- The `useStrainSync` hook already handles automatic strain syncing (24h freshness, 6h background interval)
- Confirm the multi-country sync is working for ZAF, PRT, GBR, THA

### Technical Details
- Edge function: `admin-update-user` (already deployed)
- Admin auto-assignment trigger: active for `healingbudsglobal@gmail.com`
- No schema changes needed -- all tables exist

