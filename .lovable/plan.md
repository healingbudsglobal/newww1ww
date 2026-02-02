# Plan: Add Railway Environment to drgreen-proxy

## Status: ✅ COMPLETED

## Objective
Add a third `railway` environment to `drgreen-proxy` to match the configuration in `drgreen-comparison`, enabling switching between all three API environments.

## Final State

| Environment | Status in drgreen-proxy | Status in drgreen-comparison |
|-------------|-------------------------|------------------------------|
| production | ✅ Configured | ✅ Configured |
| staging | ✅ Configured | ✅ Configured |
| railway | ✅ Configured | ✅ Configured |

## Configuration Details

| Environment | API URL | API Key Source | Private Key Source |
|-------------|---------|----------------|-------------------|
| production | `https://api.drgreennft.com/api/v1` | `DRGREEN_API_KEY` | `DRGREEN_PRIVATE_KEY` |
| staging | `https://stage-api.drgreennft.com/api/v1` | `DRGREEN_STAGING_API_KEY` | `DRGREEN_STAGING_PRIVATE_KEY` |
| railway | `https://budstack-backend-main-development.up.railway.app/api/v1` | `DRGREEN_STAGING_API_KEY` | `DRGREEN_STAGING_PRIVATE_KEY` |

**Note**: Railway uses the same credentials as staging (both are development environments).

## Usage

### Switch environment per request:
```json
{"action": "get-strains", "countryCode": "ZAF", "env": "production"}
{"action": "get-strains", "countryCode": "ZAF", "env": "staging"}
{"action": "get-strains", "countryCode": "ZAF", "env": "railway"}
```

### Test all environments:
```json
{"action": "test-staging"}
```

The `test-staging` action now tests all three environments and provides a summary of which endpoints work in each.

## Changes Made

### File: `supabase/functions/drgreen-proxy/index.ts`

1. Added `railway` environment to `ENV_CONFIG`:
   ```typescript
   railway: {
     apiUrl: 'https://budstack-backend-main-development.up.railway.app/api/v1',
     apiKeyEnv: 'DRGREEN_STAGING_API_KEY',
     privateKeyEnv: 'DRGREEN_STAGING_PRIVATE_KEY',
     name: 'Railway (Dev)',
   },
   ```

2. Updated `test-staging` action to:
   - Test all three environments (production, staging, railway)
   - Test both `/strains` and `/dapp/clients` endpoints per environment
   - Provide per-environment summary with recommendations
