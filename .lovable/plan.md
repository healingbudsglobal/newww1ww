

# Set Up Admin Account and Run API Test Runner

## Problem
This is a freshly remixed project with no users in the database. The admin tools page (including the API Test Runner) requires an authenticated user with the `admin` role, so we need to create the account and assign the role first.

## Steps

### Step 1: Create the admin user account
- Sign up `scott@healing.buds` with password `H34l1ngBuds2026!` using the authentication system
- Auto-confirm the email so login works immediately

### Step 2: Assign the admin role
- Insert a record into the `user_roles` table granting the `admin` role to the new user
- Also create the corresponding `profiles` entry if the trigger doesn't fire automatically

### Step 3: Log in and navigate to Admin Tools
- Log in with the admin credentials
- Navigate to `/admin/tools`
- Locate the API Test Runner component

### Step 4: Run the API Test Runner
- Execute the test suite which validates all Dr. Green API endpoints:
  - GET /strains (product listing)
  - GET /dapp/clients (client listing)
  - GET /dapp/nfts (NFT listing)
  - GET /dapp/orders (order listing)
  - Health check connectivity
- Report pass/fail results for each endpoint

## Technical Details

- The admin role check uses the `has_role()` database function and the `user_roles` table with the `app_role` enum
- The API Test Runner component (`ApiTestRunner.tsx`) calls the `drgreen-proxy` edge function with various actions
- All API calls go through the proxy layer — no direct external API calls from the browser
- The environment selector allows testing against production, staging, alt-production, railway, or production-write environments

