
# Plan: Add Staging Environment Support to drgreen-proxy

## Problem Summary
The `drgreen-proxy` edge function currently only uses production credentials (`DRGREEN_API_KEY` and `DRGREEN_PRIVATE_KEY`) which are returning 401 errors. Staging credentials are already configured (`DRGREEN_STAGING_API_KEY`, `DRGREEN_STAGING_PRIVATE_KEY`, `DRGREEN_STAGING_API_URL`) but aren't being used.

## Solution Overview
Add environment switching capability to `drgreen-proxy` following the same pattern used in `drgreen-comparison`, allowing requests to target either production or staging APIs.

## Implementation Steps

### Step 1: Add Environment Configuration Object
Add an `ENV_CONFIG` object at the top of `drgreen-proxy/index.ts` (similar to `drgreen-comparison`):

```text
interface EnvConfig {
  apiUrl: string;
  apiKeyEnv: string;
  privateKeyEnv: string;
  name: string;
}

const ENV_CONFIG: Record<string, EnvConfig> = {
  production: {
    apiUrl: 'https://api.drgreennft.com/api/v1',
    apiKeyEnv: 'DRGREEN_API_KEY',
    privateKeyEnv: 'DRGREEN_PRIVATE_KEY',
    name: 'Production',
  },
  staging: {
    apiUrl: Deno.env.get('DRGREEN_STAGING_API_URL') || 'https://stage-api.drgreennft.com/api/v1',
    apiKeyEnv: 'DRGREEN_STAGING_API_KEY',
    privateKeyEnv: 'DRGREEN_STAGING_PRIVATE_KEY',
    name: 'Staging',
  },
};
```

### Step 2: Add Environment Detection Logic
Add a function to determine which environment to use:

- Check for `env` parameter in request body
- Check for `DRGREEN_USE_STAGING` environment variable
- Default to production if neither is set

```text
function getEnvironment(requestedEnv?: string): EnvConfig {
  const envName = requestedEnv || Deno.env.get('DRGREEN_USE_STAGING') === 'true' ? 'staging' : 'production';
  return ENV_CONFIG[envName] || ENV_CONFIG.production;
}
```

### Step 3: Update drGreenRequestBody Function
Modify the `drGreenRequestBody` function (around line 888) to accept an optional environment parameter:

- Add `envConfig?: EnvConfig` parameter
- Use the environment's API URL instead of hardcoded `DRGREEN_API_URL`
- Read credentials from the environment-specific secret names

### Step 4: Update drGreenRequestQuery Function
Apply the same changes to the query-based request function for consistency.

### Step 5: Update Main Request Handler
Modify the request handler to:

- Extract optional `env` parameter from request body
- Pass the resolved environment config to API request functions
- Log which environment is being used for debugging

### Step 6: Add Test Action
Add a new `test-staging` action that explicitly uses staging credentials to verify they work.

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/drgreen-proxy/index.ts` | Add ENV_CONFIG, update request functions, add environment detection |

## Testing Plan
After implementation:

1. Test staging credentials with explicit `env: 'staging'` parameter
2. Test production fallback when no env specified
3. Test `DRGREEN_USE_STAGING` environment variable override
4. Verify existing actions continue to work

## Technical Notes

- The `DRGREEN_STAGING_API_URL` secret is already configured
- The `DRGREEN_STAGING_API_KEY` and `DRGREEN_STAGING_PRIVATE_KEY` secrets are already configured
- This change is backwards-compatible; existing calls without `env` parameter will use production
- Staging can be enabled globally via `DRGREEN_USE_STAGING=true` environment variable without code changes
