

# Credential Simplification — Complete

## Summary

Unified all API operations to use a single credential set per environment. Removed the alt-production, staging, and production-write environments.

## Current State

| Environment | Credentials | Purpose |
|-------------|-------------|---------|
| **Production** | `DRGREEN_API_KEY` / `DRGREEN_PRIVATE_KEY` | All live operations (read + write) |
| **Railway** | `DRGREEN_STAGING_API_KEY` / `DRGREEN_STAGING_PRIVATE_KEY` | Development/testing |

## What Changed

- Removed `alt-production`, `staging`, `production-write` from `ENV_CONFIG`
- Removed `WRITE_ACTIONS` list — no longer needed since all actions use the same key
- `getWriteEnvironment()` now delegates directly to `getEnvironment()`
- Frontend `ApiEnvironmentContext` simplified to `production | railway`
- `EnvironmentSelector` shows only 2 options
- All knowledge files updated to reflect the 2-environment reality

## Why

The previous 5-environment setup with separate write keys caused NFT-scope mismatches: clients created with write keys couldn't have cart/order operations performed with production read keys. Using one key for everything eliminates this class of errors entirely.
